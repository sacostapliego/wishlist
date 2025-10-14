import requests
from bs4 import BeautifulSoup
import json
import time
import random
from urllib.parse import urlparse

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


def clean_amazon_url(url: str) -> str:
    """Remove tracking/query parameters to prevent 400 Bad Request errors."""
    parsed = urlparse(url)
    base = "https://www.amazon.com" + parsed.path
    return base.split("/ref=")[0]


def scrape_url(url: str):
    url = clean_amazon_url(url)
    session = requests.Session()
    headers = get_headers()

    try:
        response = session.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, "html.parser")

        # --- Detect Captcha / Blocked Page ---
        if "captcha" in soup.text.lower() or "enter the characters" in soup.text.lower():
            return {"error": "Blocked by Amazon CAPTCHA. Try again later or use a different IP."}

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
                price_text = el.get_text(strip=True).replace("$", "").replace(",", "")
                try:
                    price = float(price_text)
                    break
                except ValueError:
                    continue

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

        if not title:
            return {
                "error": "Could not extract product details. The page may be blocked or have a different layout."
            }

        return {
            "name": title,
            "price": price,
            "image_url": image_url,
            "description": description,
            "url": url,
        }

    except requests.exceptions.HTTPError as e:
        return {"error": f"HTTP error: {e.response.status_code}"}
    except requests.exceptions.RequestException as e:
        return {"error": f"Network error: {e}"}
    except Exception as e:
        return {"error": f"Unexpected error: {e}"}
    finally:
        time.sleep(random.uniform(2, 4))
