import logging
from datetime import datetime, timezone
from typing import List

import requests
from bs4 import BeautifulSoup

from ingestor.base_scraper import NewsScraper
from models.schemas import FinancialNewsItem

logger = logging.getLogger(__name__)


class CNBCScraper(NewsScraper):
    """
    Scraper for the CNBC 'Finance' RSS feed.
    """

    RSS_URL = "https://www.cnbc.com/id/10000664/device/rss/rss.html"
    SOURCE_NAME = "CNBC"

    def scrape(self) -> List[FinancialNewsItem]:
        """
        Scrapes the CNBC RSS feed for news articles.

        Returns:
            List[FinancialNewsItem]: A list of scraped news items from CNBC.
        """
        try:
            # Add headers to mimic a real browser and avoid 403 Forbidden errors
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
            response = requests.get(self.RSS_URL, headers=headers, timeout=10)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, "xml")
            items = soup.find_all("item")

            news_items: List[FinancialNewsItem] = []
            for item in items:
                pub_date_str = item.pubDate.text
                try:
                    # Handles timezone names like GMT, EST (e.g., "Wed, 29 May 2024 10:00:01 GMT")
                    pub_date = datetime.strptime(pub_date_str, "%a, %d %b %Y %H:%M:%S %Z")
                except ValueError:
                    try:
                        # Fallback for timezone offsets like +0000
                        pub_date = datetime.strptime(pub_date_str, "%a, %d %b %Y %H:%M:%S %z")
                    except ValueError:
                        logger.warning(
                            f"Could not parse date '{pub_date_str}' for article '{item.title.text}'. Falling back to current UTC time."
                        )
                        pub_date = datetime.now(timezone.utc)

                news_items.append(
                    FinancialNewsItem(
                        source=self.SOURCE_NAME,
                        title=item.title.text,
                        text=item.description.text,
                        url=item.link.text,
                        published_at=pub_date,
                    )
                )
            return news_items
        except requests.RequestException as e:
            logger.error(f"Failed to fetch data from {self.SOURCE_NAME} RSS feed: {e}")
            return []
        except Exception as e:
            logger.error(f"An unexpected error occurred while scraping {self.SOURCE_NAME}: {e}", exc_info=True)
            return []