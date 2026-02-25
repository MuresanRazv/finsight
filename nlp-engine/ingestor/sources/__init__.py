from typing import List, Type

from ingestor.base_scraper import NewsScraper
from .cnbc import CNBCScraper

# A list of all available scraper classes.
ALL_SCRAPERS: List[Type[NewsScraper]] = [CNBCScraper]