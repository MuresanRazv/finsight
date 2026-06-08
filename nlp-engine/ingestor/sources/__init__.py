from typing import List, Type

from ingestor.base_scraper import NewsScraper
from .cnbc import CNBCScraper
from .yahoo import YahooFinanceScraper
from .investing_com import InvestingComScraper
from .marketwatch import MarketWatchScraper
from .reuters import ReutersScraper
from .wsj import WSJScraper
from .financial_times import FinancialTimesScraper
from .seeking_alpha import SeekingAlphaScraper
from .benzinga import BenzingaScraper
from .news_api import NewsAPIScraper

# A list of all available scraper classes.
ALL_SCRAPERS: List[Type[NewsScraper]] = [
    CNBCScraper, 
    YahooFinanceScraper, 
    InvestingComScraper, 
    MarketWatchScraper,
    ReutersScraper,
    WSJScraper,
    FinancialTimesScraper,
    SeekingAlphaScraper,
    BenzingaScraper,
    NewsAPIScraper
]
