import logging
from datetime import datetime, timezone
from typing import List

import requests
from bs4 import BeautifulSoup

from ingestor.base_scraper import NewsScraper
from models.schemas import FinancialNewsItem

logger = logging.getLogger(__name__)


class ReutersScraper(NewsScraper):
    """
    Scraper for the Reuters 'Business News' RSS feed.
    """

    # Changed to HTTPS to avoid potential DNS/redirection issues
    RSS_URL = "https://feeds.reuters.com/reuters/businessNews"
    SOURCE_NAME = "Reuters"

    def scrape(self) -> List[FinancialNewsItem]:
        """
        Scrapes the Reuters RSS feed for news articles.

        Returns:
            List[FinancialNewsItem]: A list of scraped news items.
        """
        try:
            # Add headers to mimic a real browser
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
            response = requests.get(self.RSS_URL, headers=headers, timeout=10)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, "xml")
            items = soup.find_all("item")

            news_items: List[FinancialNewsItem] = []
            for item in items:
                pub_date_str = item.pubDate.text if item.pubDate else ""
                try:
                    # Standard RSS format: "Tue, 03 Jun 2003 09:39:21 GMT"
                    if pub_date_str:
                         pub_date = datetime.strptime(pub_date_str, "%a, %d %b %Y %H:%M:%S %Z")
                    else:
                        pub_date = datetime.now(timezone.utc)
                except ValueError:
                    try:
                        # Fallback for timezone offsets like +0000
                        pub_date = datetime.strptime(pub_date_str, "%a, %d %b %Y %H:%M:%S %z")
                    except ValueError:
                        logger.warning(
                            f"Could not parse date '{pub_date_str}' for article '{item.title.text}'. Falling back to current UTC time."
                        )
                        pub_date = datetime.now(timezone.utc)

                link = item.link.text if item.link else ""
                description = item.description.text if item.description else ""
                title = item.title.text if item.title else "No Title"

                news_items.append(
                    FinancialNewsItem(
                        source=self.SOURCE_NAME,
                        title=title,
                        text=description,
                        url=link,
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
