import time
import logging
import schedule

from core.config import settings
from workers.celery_app import celery_app
from ingestor.sources import ALL_SCRAPERS

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Instantiate all available scrapers
scrapers = [Scraper() for Scraper in ALL_SCRAPERS]

def fetch_and_publish_news():
    """
    Fetches news from all configured scrapers and publishes them to RabbitMQ.
    """
    logger.info("Starting news scraping process for %d source(s)...", len(scrapers))

    for scraper in scrapers:
        scraper_name = scraper.__class__.__name__
        try:
            logger.info(f"Scraping from {scraper_name}...")
            news_items = scraper.scrape()

            if not news_items:
                logger.info(f"No new articles found from {scraper_name}.")
                continue

            logger.info(f"Scraped {len(news_items)} articles from {scraper_name}. Publishing to queue...")

            for news_item in news_items:
                try:
                    # Pydantic's model_dump with mode='json' ensures datetimes are ISO 8601 strings
                    payload = news_item.model_dump(mode="json")

                    # Publish to RabbitMQ using Celery Protocol
                    celery_app.send_task(
                        "workers.tasks.analyze_sentiment",
                        kwargs=payload,
                        queue=settings.QUEUE_RAW_NEWS,
                    )
                    logger.debug(f"Published news item: {news_item.title}")

                except Exception as e:
                    logger.error(f"Failed to publish news item '{news_item.title}': {e}", exc_info=True)

            logger.info(f"Successfully published {len(news_items)} articles from {scraper_name}.")

        except Exception as e:
            logger.error(f"Failed to scrape and publish from {scraper_name}: {e}", exc_info=True)

def main():
    """
    Main entry point for the ingestor.
    """
    logger.info("Starting NLP Ingestor...")

    # Schedule the job to run every 1 minute
    schedule.every(1).minutes.do(fetch_and_publish_news)

    logger.info("Running initial scrape on startup...")
    fetch_and_publish_news()

    logger.info("Scheduler started. Waiting for next run...")
    while True:
        schedule.run_pending()
        time.sleep(1)

if __name__ == "__main__":
    main()
