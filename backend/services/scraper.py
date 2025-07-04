import requests
from bs4 import BeautifulSoup
import json

def scrape_url(url: str):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()  # Raise an exception for bad status codes
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # --- Scraper Logic for Amazon ---
        
        # Title
        title_element = soup.select_one('#productTitle')
        title = title_element.get_text(strip=True) if title_element else None
        
        # Price
        price = None
        price_element = soup.select_one('.a-price .a-offscreen')
        if price_element:
            price_text = price_element.get_text(strip=True).replace('$', '').replace(',', '')
            try:
                price = float(price_text)
            except ValueError:
                price = None

        # Image
        image_element = soup.select_one('#landingImage')
        image_url = image_element['src'] if image_element else None

        if not title and not price and not image_url:
             return {"error": "Could not extract item details. The website structure might be unsupported."}

        return {
            "name": title,
            "price": price,
            "image_url": image_url,
            "url": url
        }

    except requests.exceptions.RequestException as e:
        return {"error": f"Failed to fetch the URL: {e}"}
    except Exception as e:
        return {"error": f"An error occurred during scraping: {e}"}
