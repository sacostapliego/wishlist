# Future ideas

Enhancements we might build later. Nothing here is planned yet; when one is
picked up it gets its own design doc or moves into a TODO.

## Official store APIs for the link scraper

The scraper (`backend/services/scraper.py`) reads any shop's page, but many
big shops block it with bot protection. A few of them offer official product
APIs, which are reliable and allowed. Each would be a small check in
`scrape_url`: spot the shop's link, take the product ID from it, call the API,
and return the same `name` / `price` / `image_url`. An API call is lighter than
fetching a whole page, so it adds no real load on the Render plan.

| Store | API | Effort | Notes |
|---|---|---|---|
| eBay | Browse API (free) | About half a day | Developer account, OAuth client-credentials token, look up by the item number in the link. Currently blocked by the scraper |
| Best Buy | Products API (free) | A few hours | One API key, look up by SKU |
| Walmart | Affiliate API | Medium, needs approval | Low value: the scraper already works on Walmart |
| Amazon | Product Advertising API | High | Needs an Amazon Associates account, and access depends on making referral sales. Could replace the CAPTCHA-prone scraper and earn commission |

Most fashion and beauty shops (Abercrombie, Zara, H&M, Sephora, Lululemon,
Target) have no public product API, so this only helps a handful of stores.
"Share to app" in `backend/TODO.md` covers far more of them.

API keys would go in Render environment variables, never in the repo.
