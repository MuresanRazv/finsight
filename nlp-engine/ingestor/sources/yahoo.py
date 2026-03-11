import logging
from datetime import datetime, timezone
from typing import List

import requests
from bs4 import BeautifulSoup

from ingestor.base_scraper import NewsScraper
from models.schemas import FinancialNewsItem

logger = logging.getLogger(__name__)


class YahooFinanceScraper(NewsScraper):
    """
    Scraper for the Yahoo Finance RSS feed.
    """

    RSS_URL = "https://finance.yahoo.com/news/rssindex"
    SOURCE_NAME = "Yahoo Finance"

    def scrape(self) -> List[FinancialNewsItem]:
        """
        Scrapes the Yahoo Finance RSS feed for news articles.
        Strictly skips articles if any field is missing or invalid.
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
                try:
                    # Extract fields with strict checking
                    title_node = item.title
                    description_node = item.description
                    link_node = item.link
                    guid_node = item.guid
                    pub_date_node = item.pubDate

                    # Check existence of critical nodes
                    if not title_node or not description_node or not pub_date_node:
                        continue

                    title = title_node.text.strip()
                    description = description_node.text.strip()
                    pub_date_str = pub_date_node.text.strip()
                    
                    # Link can be in <link> or <guid>
                    link = link_node.text.strip() if link_node else (guid_node.text.strip() if guid_node else "")

                    # Validate non-empty strings
                    if not title or not description or not link or not pub_date_str:
                        logger.debug(f"Skipping Yahoo article due to missing content. Title: {title}")
                        continue
                    
                    # Validate description length to avoid generic/empty content
                    # Often "same score" issues arise from empty or very short descriptions
                    if len(description) < 50:
                         logger.debug(f"Skipping article '{title}' due to short description ({len(description)} chars).")
                         continue

                    # Parse Date - Strict Mode
                    pub_date = None
                    
                    # 1. Try ISO 8601 (e.g., 2026-03-11T10:00:20Z)
                    try:
                        pub_date = datetime.fromisoformat(pub_date_str.replace("Z", "+00:00"))
                    except ValueError:
                        pass
                    
                    if not pub_date:
                        # 2. Try RFC 822 (Standard RSS): "Tue, 03 Jun 2003 09:39:21 GMT"
                        try:
                            pub_date = datetime.strptime(pub_date_str, "%a, %d %b %Y %H:%M:%S %Z")
                        except ValueError:
                            pass

                    if not pub_date:
                        # 3. Try RFC 822 with numeric timezone: "Tue, 03 Jun 2003 09:39:21 +0000"
                        try:
                            pub_date = datetime.strptime(pub_date_str, "%a, %d %b %Y %H:%M:%S %z")
                        except ValueError:
                            pass
                    
                    # Ensure timezone awareness (UTC)
                    if pub_date:
                        if pub_date.tzinfo is None:
                             pub_date = pub_date.replace(tzinfo=timezone.utc)
                    else:
                        # If date parsing fails completely, skip the article.
                        # Do NOT fallback to current time to avoid duplicates or incorrect ordering.
                        logger.warning(f"Skipping article '{title}' due to unparseable date: '{pub_date_str}'")
                        continue

                    news_items.append(
                        FinancialNewsItem(
                            source=self.SOURCE_NAME,
                            title=title,
                            text=description,
                            url=link,
                            published_at=pub_date,
                        )
                    )
                except ValueError as e:
                     logger.warning(f"Validation error for article '{item.title.text if item.title else 'Unknown'}': {e}")
                     continue
                except Exception as e:
                    # Catch individual item errors to prevent crashing the whole loop
                    logger.warning(f"Error processing a Yahoo item: {e}")
                    continue

            return news_items
        except requests.RequestException as e:
            logger.error(f"Failed to fetch data from {self.SOURCE_NAME} RSS feed: {e}")
            return []
        except Exception as e:
            logger.error(f"An unexpected error occurred while scraping {self.SOURCE_NAME}: {e}", exc_info=True)
            return []
