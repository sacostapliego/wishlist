import html
import requests
from bs4 import BeautifulSoup
import ipaddress
import json
import re
import socket
import time
import random
from urllib.parse import urljoin, urlparse

# Redirects are followed by hand so every hop gets the address check below.
MAX_REDIRECTS = 5
# Product pages are big, but not this big. Stops a link to a huge file being
# read into memory.
MAX_PAGE_BYTES = 5 * 1024 * 1024

# --- User Agent Pool (realistic desktop browsers) ---
USER_AGENTS = [
    # Chrome (Windows)
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",

    # Edge (Windows)
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0",

    # Firefox (Windows)
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0",

    # Chrome (Mac)
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_3_1) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",

    # Safari (Mac)
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_3_1) AppleWebKit/605.1.15 "
    "(KHTML, like Gecko) Version/16.4 Safari/605.1.15",
]


def _can_decode_brotli() -> bool:
    try:
        import brotli  # noqa: F401
        return True
    except ImportError:
        try:
            import brotlicffi  # noqa: F401
            return True
        except ImportError:
            return False


# requests only unpacks Brotli when one of these is installed. Asking for it
# without one gets back compressed bytes that parse as garbage.
ACCEPT_ENCODING = "gzip, deflate, br" if _can_decode_brotli() else "gzip, deflate"


def get_headers():
    """Return randomized realistic headers without external dependencies."""
    return {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": ACCEPT_ENCODING,
        "Connection": "keep-alive",
        "Referer": "https://www.google.com/",
        "DNT": "1",
        "Upgrade-Insecure-Requests": "1",
    }


def is_amazon_host(hostname: str) -> bool:
    """amazon.com, amazon.co.uk and the rest, plus the a.co short links."""
    hostname = hostname.lower()
    return hostname == "a.co" or hostname.startswith("amazon.") or ".amazon." in hostname


def clean_amazon_url(url: str) -> str:
    """Remove tracking/query parameters to prevent 400 Bad Request errors."""
    parsed = urlparse(url)
    base = f"https://{parsed.netloc}{parsed.path}"
    return base.split("/ref=")[0]


def is_public_address(hostname: str) -> bool:
    """
    The server fetches whatever link a user pastes, so a link must not be able to
    point it at itself, the host's metadata service or anything else on a private
    network. Every address the name resolves to has to be public.
    """
    try:
        addresses = socket.getaddrinfo(hostname, None)
    except (socket.gaierror, UnicodeError):
        return False

    return bool(addresses) and all(
        ipaddress.ip_address(info[4][0]).is_global for info in addresses
    )


def check_fetchable(url: str) -> None:
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https") or not parsed.hostname:
        raise ValueError("not a web address")
    if parsed.port not in (None, 80, 443):
        raise ValueError("unusual port")
    if not is_public_address(parsed.hostname):
        raise ValueError("not a public address")


def fetch_page(session: requests.Session, url: str, headers: dict) -> requests.Response:
    """GET a page, checking the address of every hop and capping the size."""
    for _ in range(MAX_REDIRECTS + 1):
        check_fetchable(url)
        response = session.get(url, headers=headers, timeout=15, allow_redirects=False, stream=True)

        if response.is_redirect:
            url = urljoin(url, response.headers["location"])
            response.close()
            continue

        response.raise_for_status()

        content = b""
        for chunk in response.iter_content(64 * 1024):
            content += chunk
            if len(content) > MAX_PAGE_BYTES:
                response.close()
                raise ValueError("page too large")
        response._content = content
        return response

    raise ValueError("too many redirects")


def meta_content(soup: BeautifulSoup, *names: str):
    """The first of these <meta> tags (by property, name or itemprop) that has content."""
    for name in names:
        for attr in ("property", "name", "itemprop"):
            el = soup.find("meta", attrs={attr: name})
            if el and el.get("content", "").strip():
                return el["content"].strip()
    return None


# --- schema.org JSON-LD -----------------------------------------------------
# Most shops embed this for Google Shopping, so it is the most reliable source.

PRODUCT_TYPES = {"Product", "ProductGroup", "IndividualProduct", "ProductModel", "SomeProducts"}
MAX_JSON_LD_NODES = 2000


def _types(node: dict) -> set:
    kind = node.get("@type")
    if isinstance(kind, str):
        kind = [kind]
    if not isinstance(kind, list):
        return set()
    # "http://schema.org/Product" and "schema:Product" both mean Product
    return {str(k).rsplit("/", 1)[-1].rsplit(":", 1)[-1] for k in kind}


def _find_product(data):
    """Breadth first, so the page's main product wins over 'related products'."""
    queue = [data]
    seen = 0
    while queue and seen < MAX_JSON_LD_NODES:
        node = queue.pop(0)
        seen += 1
        if isinstance(node, list):
            queue.extend(node)
        elif isinstance(node, dict):
            if _types(node) & PRODUCT_TYPES:
                return node
            queue.extend(v for v in node.values() if isinstance(v, (dict, list)))
    return None


def json_ld_product(soup: BeautifulSoup) -> dict:
    """The schema.org Product most shops embed for search engines, if there is one."""
    for script in soup.find_all("script", type=lambda t: t and "ld+json" in t.lower()):
        raw = script.string or script.get_text() or ""
        try:
            # strict=False lets through the raw newlines some shops leave in strings
            data = json.loads(raw, strict=False)
        except (ValueError, TypeError):
            continue
        product = _find_product(data)
        if product:
            return product
    return {}


def _as_list(value) -> list:
    if value is None:
        return []
    return value if isinstance(value, list) else [value]


def offer_price(offers, depth: int = 0):
    """Price from an Offer, an AggregateOffer or a list of either."""
    if depth > 3:
        return None
    for offer in _as_list(offers):
        if not isinstance(offer, dict):
            continue
        for key in ("price", "lowPrice", "highPrice"):
            price = parse_price(offer.get(key))
            if price:
                return price
        for spec in _as_list(offer.get("priceSpecification")):
            if isinstance(spec, dict):
                price = parse_price(spec.get("price"))
                if price:
                    return price
        price = offer_price(offer.get("offers"), depth + 1)
        if price:
            return price
    return None


def image_from(value):
    """schema.org images can be a URL, an ImageObject or a list of either."""
    for image in _as_list(value):
        if isinstance(image, dict):
            image = image.get("url") or image.get("contentUrl")
        if isinstance(image, str) and image.strip() and not image.startswith("data:"):
            return image.strip()
    return None


# --- prices -----------------------------------------------------------------

NUMBER = re.compile(r"\d[\d.,  ']*")


def parse_price(value):
    """
    A number from whatever a shop puts in its price: 19.99, "$1,299.00",
    "EUR 1.299,00", "19,99 €", "From $25 - $40" (takes the first).
    """
    if value is None or isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value) if value > 0 else None

    match = NUMBER.search(str(value))
    if not match:
        return None
    number = re.sub(r"[  ']", "", match.group()).rstrip(".,")

    if "," in number and "." in number:
        # Whichever comes last is the decimal point
        if number.rfind(",") > number.rfind("."):
            number = number.replace(".", "").replace(",", ".")
        else:
            number = number.replace(",", "")
    elif "," in number:
        # "19,99" is a decimal comma, "1,299" is thousands
        whole, _, fraction = number.rpartition(",")
        if len(fraction) == 3 or number.count(",") > 1:
            number = number.replace(",", "")
        else:
            number = whole + "." + fraction
    elif number.count(".") > 1:
        # "1.299.000" is thousands
        number = number.replace(".", "")

    try:
        price = float(number)
    except ValueError:
        return None
    return price if price > 0 else None


# --- names ------------------------------------------------------------------

TITLE_SEPARATORS = (" | ", " - ", " – ", " — ", " :: ", " : ")


def _brand_labels(hostname: str) -> set:
    """'www.uniqlo.co.uk' -> {'uniqlo'}: the parts of a domain that name the shop."""
    generic = {"www", "www2", "m", "shop", "store", "com", "net", "org", "co", "uk", "us", "ca", "au", "de"}
    return {label for label in hostname.lower().split(".") if len(label) > 2 and label not in generic}


def clean_name(name, site_name=None, hostname=None):
    """Tidy whitespace and drop a trailing " | Store Name" from page titles."""
    if not name:
        return None
    name = " ".join(html.unescape(str(name)).split())
    # Only ever the last segment, whichever separator introduces it
    cut = max((name.rfind(sep), sep) for sep in TITLE_SEPARATORS)
    if cut[0] > 0:
        head, tail = name[: cut[0]].strip(), name[cut[0] + len(cut[1]):].strip()
        squashed = tail.lower().replace(" ", "")
        brands = _brand_labels(hostname or "")
        if (site_name and tail.lower() == site_name.strip().lower()) or any(b in squashed for b in brands):
            name = head
    return name or None


# --- any shop ---------------------------------------------------------------

def scrape_generic(soup: BeautifulSoup, hostname: str = "") -> dict:
    """
    Name, price and main image from any shop, using the tags shops publish for
    search engines and link previews, most trustworthy first: schema.org
    JSON-LD, then microdata, then Open Graph / Twitter tags, then the page itself.
    """
    product = json_ld_product(soup)

    # A ProductGroup (one listing with sizes/colours) can keep its offers and
    # images on the variants instead
    variants = [v for v in _as_list(product.get("hasVariant")) if isinstance(v, dict)]

    # schema.org microdata, scoped to the product if the page marks one
    scope = soup.find(attrs={"itemtype": re.compile(r"schema\.org/(Product|IndividualProduct)", re.I)}) or soup

    def itemprop(name, *attrs):
        el = scope.find(attrs={"itemprop": name})
        if not el:
            return None
        for attr in attrs:
            if el.get(attr):
                return el[attr]
        return el.get_text(" ", strip=True) or None

    site_name = meta_content(soup, "og:site_name", "application-name")
    h1 = soup.find("h1")
    title_tag = soup.find("title")

    name = (
        product.get("name")
        or itemprop("name", "content")
        or meta_content(soup, "og:title", "twitter:title")
        or (h1.get_text(" ", strip=True) if h1 else None)
        or (title_tag.get_text(strip=True) if title_tag else None)
    )

    price = (
        offer_price(product.get("offers"))
        or next((p for p in (offer_price(v.get("offers")) for v in variants) if p), None)
        or parse_price(itemprop("price", "content", "data-price"))
        or parse_price(meta_content(
            soup, "product:price:amount", "og:price:amount", "product:sale_price:amount", "price"
        ))
    )

    image_link = soup.find("link", rel="image_src")
    image_url = (
        image_from(product.get("image"))
        or next((i for i in (image_from(v.get("image")) for v in variants) if i), None)
        or meta_content(soup, "og:image:secure_url", "og:image", "og:image:url",
                        "twitter:image", "twitter:image:src")
        or image_from(itemprop("image", "src", "content", "href"))
        or (image_link.get("href") if image_link else None)
    )

    return {
        "name": clean_name(name, site_name, hostname),
        "price": price,
        "image_url": image_url,
    }


# --- Amazon -----------------------------------------------------------------

def scrape_amazon(soup: BeautifulSoup) -> dict:
    # --- Product Title ---
    title = None
    for sel in ["#productTitle", "span.a-size-large.product-title-word-break"]:
        el = soup.select_one(sel)
        if el:
            title = el.get_text(strip=True)
            break

    # --- Price ---
    price = None
    for sel in [
        "#corePrice_feature_div .a-offscreen",
        ".a-price .a-offscreen",
        "#price_inside_buybox",
        "span.a-color-price",
    ]:
        el = soup.select_one(sel)
        if el:
            price = parse_price(el.get_text(strip=True))
            if price is not None:
                break

    # --- Image ---
    image_url = None
    img = soup.select_one("#imgTagWrapperId img")
    if img and "data-a-dynamic-image" in img.attrs:
        try:
            image_data = json.loads(img["data-a-dynamic-image"])
            image_url = list(image_data.keys())[0]
        except Exception:
            pass

    if not image_url:
        fallback_img = soup.select_one("#landingImage") or soup.select_one("#imgBlkFront")
        if fallback_img and "src" in fallback_img.attrs:
            image_url = fallback_img["src"]

    return {
        "name": title,
        "price": price,
        "image_url": image_url,
    }


# Titles of the "checking your browser" pages bot protection serves instead of
# the product. Reading one as a product would name the item "Just a moment...".
BLOCK_PAGE_TITLES = (
    "client challenge", "just a moment", "attention required", "access denied",
    "robot check", "pardon our interruption", "are you a human", "security check",
    "verify you are human", "please verify", "request blocked",
)
BLOCKED_MESSAGE = "This store blocks automatic lookups. Please enter the details by hand."


def is_block_page(soup: BeautifulSoup) -> bool:
    title = soup.find("title")
    text = title.get_text(" ", strip=True).lower() if title else ""
    return any(text.startswith(t) for t in BLOCK_PAGE_TITLES)


def scrape_url(url: str):
    amazon = is_amazon_host(urlparse(url).hostname or "")
    if amazon:
        url = clean_amazon_url(url)
    session = requests.Session()
    headers = get_headers()

    try:
        response = fetch_page(session, url, headers)
        soup = BeautifulSoup(response.content, "html.parser")

        if is_block_page(soup):
            return {"error": BLOCKED_MESSAGE}

        if amazon:
            # --- Detect Captcha / Blocked Page ---
            if "captcha" in soup.text.lower() or "enter the characters" in soup.text.lower():
                return {"error": "Blocked by Amazon CAPTCHA. Try again later or use a different IP."}
            details = scrape_amazon(soup)
            # Amazon also publishes the generic tags, which can fill a gap
            for key, value in scrape_generic(soup).items():
                details[key] = details[key] or value
        else:
            details = scrape_generic(soup, urlparse(response.url or url).hostname or "")

        if not details["name"]:
            return {
                "error": "Could not extract product details. The page may be blocked or have a different layout."
            }

        if details["image_url"]:
            details["image_url"] = urljoin(response.url or url, details["image_url"])

        return {**details, "url": url}

    except requests.exceptions.HTTPError as e:
        if e.response.status_code in (401, 403, 429, 503):
            return {"error": BLOCKED_MESSAGE}
        return {"error": f"HTTP error: {e.response.status_code}"}
    except ValueError:
        return {"error": "That link cannot be fetched"}
    except requests.exceptions.RequestException:
        return {"error": "Could not reach that page"}
    except Exception as e:
        print(f"Scraper error for {url}: {e}")
        return {"error": "Could not read that page"}
    finally:
        # Pacing for Amazon's bot detection; other shops do not need the wait
        if amazon:
            time.sleep(random.uniform(2, 4))
