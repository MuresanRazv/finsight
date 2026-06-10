import logging
from abc import ABC, abstractmethod
from typing import Optional
import requests
import trafilatura

logger = logging.getLogger(__name__)

class ArticleScraper(ABC):
    """
    Abstract base class for scraping full article content from web pages.
    """
    @abstractmethod
    def scrape(self, url: str) -> Optional[str]:
        """
        Scrapes the complete article text from the given URL.

        Args:
            url (str): The URL of the article to scrape.

        Returns:
            Optional[str]: The full text of the article if successful, otherwise None.
        """
        pass

class TrafilaturaArticleScraper(ArticleScraper):
    """
    Article scraper implementation using the Trafilatura library.
    """
    def __init__(self, timeout: int = 10):
        self.timeout = timeout
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }

    def scrape(self, url: str) -> Optional[str]:
        try:
            logger.info(f"Scraping full article text from: {url}")
            # Try to fetch html using requests with custom headers to prevent bot detection
            response = requests.get(url, headers=self.headers, timeout=self.timeout)
            response.raise_for_status()
            html_content = response.text
            
            # Extract content using trafilatura
            text = trafilatura.extract(
                html_content, 
                include_comments=False, 
                include_tables=True,
                no_fallback=False
            )
            
            if text and text.strip():
                logger.info(f"Successfully scraped {len(text)} characters from: {url}")
                return text.strip()
            
            logger.warning(f"Trafilatura extracted empty content from raw HTML for: {url}. Trying fallback fetch...")
            
            # Fallback to trafilatura's own fetch method in case of encoding or structure issues
            downloaded = trafilatura.fetch_url(url)
            if downloaded:
                text = trafilatura.extract(downloaded, include_comments=False, include_tables=True)
                if text and text.strip():
                    logger.info(f"Fallback fetch scraped {len(text)} characters from: {url}")
                    return text.strip()
            
            logger.warning(f"All Trafilatura extraction methods returned empty text for: {url}")
            return None
            
        except Exception as e:
            logger.error(f"Failed to scrape URL {url} with Trafilatura: {e}")
            return None

def get_article_scraper() -> ArticleScraper:
    """
    Factory function to retrieve the default article scraper instance.
    """
    return TrafilaturaArticleScraper()


def chunk_text(text: str, chunk_size: int = 1000, chunk_overlap: int = 200) -> list[str]:
    """
    Splits text into paragraphs and aggregates them into chunks of approximately chunk_size characters,
    with an overlap of approximately chunk_overlap characters.
    """
    if not text or not text.strip():
        return []
        
    paragraphs = [p.strip() for p in text.split('\n') if p.strip()]
    if not paragraphs:
        return [text]
        
    # If the text is just one huge paragraph or has very long paragraphs, split by characters
    if max(len(p) for p in paragraphs) > chunk_size * 1.5:
        chunks = []
        start = 0
        while start < len(text):
            end = start + chunk_size
            chunks.append(text[start:end])
            start += chunk_size - chunk_overlap
        return chunks
        
    chunks = []
    current_chunk = []
    current_size = 0
    
    for p in paragraphs:
        p_len = len(p)
        if current_size + p_len > chunk_size and current_chunk:
            chunks.append("\n\n".join(current_chunk))
            # Overlap: keep the last few paragraphs that fit into chunk_overlap
            overlap_chunk = []
            overlap_size = 0
            for prev_p in reversed(current_chunk):
                if overlap_size + len(prev_p) < chunk_overlap:
                    overlap_chunk.insert(0, prev_p)
                    overlap_size += len(prev_p) + 2
                else:
                    break
            current_chunk = overlap_chunk
            current_size = overlap_size
            
        current_chunk.append(p)
        current_size += p_len + 2
        
    if current_chunk:
        chunks.append("\n\n".join(current_chunk))
        
    return chunks
