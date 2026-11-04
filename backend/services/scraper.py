import requests
from bs4 import BeautifulSoup
import ipaddress
import json
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


def get_headers():
    """Return randomized realistic headers without external dependencies."""
    return {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
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
    """The first of these <meta> tags (by property or name) that has content."""
    for name in names:
        el = soup.find("meta", attrs={"property": name}) or soup.find("meta", attrs={"name": name})
        if el and el.get("content"):
            return el["content"].strip()
    return None


def json_ld_product(soup: BeautifulSoup) -> dict:
    """The schema.org Product most shops embed for search engines, if there is one."""
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string or "")
        except (ValueError, TypeError):
            continue

        if isinstance(data, list):
            candidates = data
        elif isinstance(data, dict):
            candidates = data.get("@graph", [data])
        else:
            continue

        for candidate in candidates:
            if not isinstance(candidate, dict):
                continue
            kind = candidate.get("@type")
            if kind == "Product" or (isinstance(kind, list) and "Product" in kind):
                return candidate
    return {}


def parse_price(text):
    if text is None:
        return None
    try:
        return float(str(text).replace("$", "").replace(",", "").strip())
    except ValueError:
        return None


def scrape_generic(soup: BeautifulSoup) -> dict:
    """Product details from the Open Graph and schema.org tags most shops publish."""
    product = json_ld_product(soup)

    offers = product.get("offers")
    if isinstance(offers, list):
        offers = offers[0] if offers else {}
    if not isinstance(offers, dict):
        offers = {}

    image = product.get("image")
    if isinstance(image, list):
        image = image[0] if image else None
    if isinstance(image, dict):
        image = image.get("url")

    title_tag = soup.find("title")
    return {
        "name": product.get("name")
            or meta_content(soup, "og:title", "twitter:title")
            or (title_tag.get_text(strip=True) if title_tag else None),
        "price": parse_price(offers.get("price"))
            or parse_price(meta_content(soup, "product:price:amount", "og:price:amount")),
        "image_url": image or meta_content(soup, "og:image", "twitter:image"),
        "description": product.get("description")
            or meta_content(soup, "og:description", "description"),
    }


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

    # --- Description ---
    description = None
    for sel in ["#feature-bullets ul", "#productDescription"]:
        el = soup.select_one(sel)
        if el:
            description = el.get_text(separator=" ", strip=True)
            break

    return {
        "name": title,
        "price": price,
        "image_url": image_url,
        "description": description,
    }


def scrape_url(url: str):
    amazon = is_amazon_host(urlparse(url).hostname or "")
    if amazon:
        url = clean_amazon_url(url)
    session = requests.Session()
    headers = get_headers()

    try:
        response = fetch_page(session, url, headers)
        soup = BeautifulSoup(response.content, "html.parser")

        if amazon:
            # --- Detect Captcha / Blocked Page ---
            if "captcha" in soup.text.lower() or "enter the characters" in soup.text.lower():
                return {"error": "Blocked by Amazon CAPTCHA. Try again later or use a different IP."}
            details = scrape_amazon(soup)
            # Amazon also publishes the generic tags, which can fill a gap
            for key, value in scrape_generic(soup).items():
                details[key] = details[key] or value
        else:
            details = scrape_generic(soup)

        if not details["name"]:
            return {
                "error": "Could not extract product details. The page may be blocked or have a different layout."
            }

        if details["image_url"]:
            details["image_url"] = urljoin(response.url or url, details["image_url"])

        return {**details, "url": url}

    except requests.exceptions.HTTPError as e:
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
