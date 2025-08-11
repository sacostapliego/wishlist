import requests
from bs4 import BeautifulSoup
import json

def scrape_url(url: str):
    # Using more common headers to mimic a real browser visit
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'Connection': 'keep-alive',
    }
    try:
        # Add a timeout to prevent the request from hanging indefinitely
        response = requests.get(url, headers=headers, timeout=15)
        
        # This will raise an HTTPError if the HTTP request returned an unsuccessful status code.
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # --- Scraper Logic for Amazon ---
        
        # Title
        title_element = soup.select_one('#productTitle')
        title = title_element.get_text(strip=True) if title_element else None
        
        # Price
        price = None
        # Try to find price in a couple of common locations
        price_element = soup.select_one('.a-price .a-offscreen') or soup.select_one('.a-price-whole')
        if price_element:
            price_text = price_element.get_text(strip=True).replace('$', '').replace(',', '')
            try:
                price = float(price_text)
            except ValueError:
                price = None

        # Image
        image_element = soup.select_one('#landingImage') or soup.select_one('#imgBlkFront')
        image_url = image_element['src'] if image_element else None

        # If we can't find the main details, it's likely the page structure is different or we were blocked.
        if not title and not price:
             return {"error": "Could not extract item details. The website may be blocking the request or has an unsupported page layout."}

        return {
            "name": title,
            "price": price,
            "image_url": image_url,
            "url": url
        }

    except requests.exceptions.HTTPError as e:
        return {"error": f"Failed to fetch the URL. The website responded with status code: {e.response.status_code}"}
    except requests.exceptions.RequestException as e:
        return {"error": f"A network error occurred: {e}"}
    except Exception as e:
        return {"error": f"An unexpected error occurred during scraping: {e}"}