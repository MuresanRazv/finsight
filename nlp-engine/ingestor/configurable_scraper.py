import logging
import requests
from bs4 import BeautifulSoup
from datetime import datetime, timezone
from typing import List

from ingestor.base_scraper import NewsScraper
from models.schemas import FinancialNewsItem

logger = logging.getLogger(__name__)


class ConfigurableRSSScraper(NewsScraper):
    """
    A generic scraper that dynamically extracts news articles from RSS/Atom feeds
    based on user-defined BeautifulSoup tag selectors and date formats.
    """

    def __init__(self, config: dict):
        self.source_name = config.get("name", "Configurable RSS")
        self.url = config.get("url")
        self.item_selector = config.get("item_selector") or "item"
        self.title_selector = config.get("title_selector") or "title"
        self.link_selector = config.get("link_selector") or "link"
        self.link_attribute = config.get("link_attribute")
        self.description_selector = config.get("description_selector") or "description"
        self.pub_date_selector = config.get("pub_date_selector") or "pubDate"
        self.pub_date_format = config.get("pub_date_format")

    def scrape(self) -> List[FinancialNewsItem]:
        """
        Fetches the feed, parses the document with BeautifulSoup, and maps elements to FinancialNewsItems.
        """
        if not self.url:
            logger.error(f"RSS Source '{self.source_name}' has no URL configured.")
            return []

        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
            response = requests.get(self.url, headers=headers, timeout=10)
            response.raise_for_status()

            # Attempt to parse with XML first, fallback to html.parser
            soup = BeautifulSoup(response.content, "xml")
            items = soup.find_all(self.item_selector)
            if not items:
                soup = BeautifulSoup(response.content, "html.parser")
                items = soup.find_all(self.item_selector)

            if not items:
                logger.warning(f"No items found for RSS source '{self.source_name}' using selector '{self.item_selector}'")
                return []

            news_items: List[FinancialNewsItem] = []
            for item in items:
                try:
                    # Extract title
                    title_node = item.find(self.title_selector)
                    if not title_node or not title_node.text.strip():
                        continue
                    title = title_node.text.strip()

                    # Extract link
                    link_node = item.find(self.link_selector)
                    if not link_node:
                        # Fallback to guid
                        link_node = item.find("guid")
                    
                    if not link_node:
                        continue
                        
                    if self.link_attribute and link_node.has_attr(self.link_attribute):
                        link = link_node[self.link_attribute].strip()
                    else:
                        link = link_node.text.strip()

                    if not link:
                        continue

                    # Extract description/text
                    desc_node = item.find(self.description_selector)
                    if not desc_node:
                        # Fallback options
                        for fb in ["summary", "content", "content:encoded"]:
                            desc_node = item.find(fb)
                            if desc_node:
                                break
                    text = desc_node.text.strip() if desc_node else ""
                    if not text:
                        continue

                    # Extract published date
                    date_node = item.find(self.pub_date_selector)
                    pub_date = None
                    if date_node:
                        date_str = date_node.text.strip()
                        pub_date = self._parse_date(date_str)

                    # Fallback to current time if unparseable
                    if not pub_date:
                        pub_date = datetime.now(timezone.utc)

                    news_items.append(
                        FinancialNewsItem(
                            source=self.source_name,
                            title=title,
                            text=text,
                            url=link,
                            published_at=pub_date,
                        )
                    )
                except Exception as item_err:
                    logger.debug(f"Failed to parse item in feed '{self.source_name}': {item_err}")
                    continue

            return news_items

        except Exception as e:
            logger.error(f"Error scraping RSS feed '{self.source_name}': {e}", exc_info=True)
            return []

    def _parse_date(self, date_str: str) -> datetime:
        """Helper to parse raw date string into datetime object."""
        # 1. Custom format
        if self.pub_date_format:
            try:
                dt = datetime.strptime(date_str, self.pub_date_format)
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                return dt
            except ValueError:
                pass

        # 2. ISO format
        try:
            return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        except ValueError:
            pass

        # 3. Standard RSS (RFC 822) GMT/UTC formats
        for fmt in [
            "%a, %d %b %Y %H:%M:%S %Z",
            "%a, %d %b %Y %H:%M:%S %z",
            "%Y-%m-%dT%H:%M:%SZ",
            "%d %b %Y %H:%M:%S %Z",
            "%Y-%m-%d %H:%M:%S"
        ]:
            try:
                dt = datetime.strptime(date_str, fmt)
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                return dt
            except ValueError:
                continue

        logger.debug(f"Could not parse date string: '{date_str}' in RSS '{self.source_name}'")
        return None
