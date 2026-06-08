import logging
import requests
from datetime import datetime, timezone
from typing import List

from ingestor.base_scraper import NewsScraper
from models.schemas import FinancialNewsItem
from core.config import settings

logger = logging.getLogger(__name__)


class NewsAPIScraper(NewsScraper):
    """
    Scraper that fetches articles from NewsAPI (newsapi.org).
    """

    SOURCE_NAME = "NewsAPI"

    def scrape(self) -> List[FinancialNewsItem]:
        """
        Scrapes financial articles from NewsAPI.

        Returns:
            List[FinancialNewsItem]: Scraped news items.
        """
        if not settings.NEWS_API_KEY:
            logger.warning("NEWS_API_KEY is not set. Skipping NewsAPI scrape.")
            return []

        url = "https://newsapi.org/v2/everything"
        params = {
            "q": "finance OR economy OR stock OR market",
            "language": "en",
            "sortBy": "publishedAt",
            "pageSize": 20,
            "apiKey": settings.NEWS_API_KEY
        }

        try:
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()

            if data.get("status") != "ok":
                logger.error(f"NewsAPI error: {data.get('message')}")
                return []

            articles = data.get("articles", [])
            news_items: List[FinancialNewsItem] = []

            for art in articles:
                if not art.get("title") or not art.get("url"):
                    continue

                # Parse publishedAt date
                pub_date_str = art.get("publishedAt")
                try:
                    # e.g., "2026-06-08T14:15:00Z"
                    pub_date = datetime.fromisoformat(pub_date_str.replace("Z", "+00:00"))
                except Exception:
                    pub_date = datetime.now(timezone.utc)

                # NewsAPI content is usually truncated; use description if it has more full context
                content = art.get("description") or art.get("content") or ""
                
                # Check that content is not empty
                if not content.strip():
                    continue

                news_items.append(
                    FinancialNewsItem(
                        source=art.get("source", {}).get("name") or self.SOURCE_NAME,
                        title=art.get("title"),
                        text=content,
                        url=art.get("url"),
                        published_at=pub_date,
                    )
                )

            logger.info(f"NewsAPI successfully scraped {len(news_items)} articles.")
            return news_items

        except Exception as e:
            logger.error(f"Failed to fetch data from NewsAPI: {e}")
            return []
