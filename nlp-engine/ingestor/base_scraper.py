from abc import ABC, abstractmethod
from typing import List

from models.schemas import FinancialNewsItem


class NewsScraper(ABC):
    """Abstract base class for news scrapers."""

    @abstractmethod
    def scrape(self) -> List[FinancialNewsItem]:
        """
        Scrapes news articles and returns them as a list of FinancialNewsItem objects.

        Returns:
            List[FinancialNewsItem]: A list of scraped news items.
        """
        raise NotImplementedError