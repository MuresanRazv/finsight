import time
import logging
import os
from datetime import datetime, timedelta, time as datetime_time
from zoneinfo import ZoneInfo

from core.config import settings
from workers.celery_app import celery_app
from ingestor.sources import ALL_SCRAPERS
from services.metrics_service import benchmark_action

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def publish_news_items(news_items, source_name):
    if not news_items:
        logger.info(f"No new articles found from {source_name}.")
        return

    logger.info(f"Scraped {len(news_items)} articles from {source_name}. Publishing to queue...")

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

    logger.info(f"Successfully published {len(news_items)} articles from {source_name}.")

@benchmark_action(
    "automatic_ingest_cron",
    article_count_extractor=lambda args, kwargs, result: result if isinstance(result, int) else 0,
    metadata_extractor=lambda args, kwargs, result: {"success": True}
)
def fetch_and_publish_news():
    """
    Fetches news from active database-configured RSS sources and dispatches Celery tasks.
    Preconfigured default feeds use their specialized python scraper classes.
    """
    logger.info("Starting news scraping process...")
    total_scraped = 0

    try:
        import requests
        url = "http://core-api:8080/api/rss-sources/active"
        logger.info(f"Fetching active configured RSS sources from {url}...")
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            active_sources = response.json()
            logger.info(f"Found {len(active_sources)} active RSS source(s).")
            
            # Map source name to scraper class
            scraper_classes = {}
            for scraper_cls in ALL_SCRAPERS:
                source_name = getattr(scraper_cls, "SOURCE_NAME", None)
                if source_name:
                    scraper_classes[source_name] = scraper_cls

            from ingestor.configurable_scraper import ConfigurableRSSScraper
            
            for source in active_sources:
                source_name = source.get("name", "Configurable RSS")
                try:
                    logger.info(f"Scraping source '{source_name}'...")
                    
                    if source_name in scraper_classes:
                        logger.info(f"Using preconfigured scraper class for '{source_name}'")
                        scraper = scraper_classes[source_name]()
                    else:
                        logger.info(f"Using generic ConfigurableRSSScraper for '{source_name}'")
                        config = {
                            "name": source_name,
                            "url": source.get("url"),
                            "item_selector": source.get("item_selector") or source.get("itemSelector"),
                            "title_selector": source.get("title_selector") or source.get("titleSelector"),
                            "link_selector": source.get("link_selector") or source.get("linkSelector"),
                            "link_attribute": source.get("link_attribute") or source.get("linkAttribute"),
                            "description_selector": source.get("description_selector") or source.get("descriptionSelector"),
                            "pub_date_selector": source.get("pub_date_selector") or source.get("pubDateSelector"),
                            "pub_date_format": source.get("pub_date_format") or source.get("pubDateFormat")
                        }
                        scraper = ConfigurableRSSScraper(config)
                        
                    news_items = scraper.scrape()
                    publish_news_items(news_items, source_name)
                    total_scraped += len(news_items)
                except Exception as src_ex:
                    logger.error(f"Failed to scrape source '{source_name}': {src_ex}", exc_info=True)
            return total_scraped
        else:
             logger.warning(f"Failed to fetch configured RSS sources: HTTP {response.status_code}")
             return 0
    except Exception as e:
        logger.warning(f"Could not reach core-api to fetch active RSS configs: {e}")
        return 0


def get_sleep_duration_and_zone(dt: datetime) -> tuple[str, int]:
    """
    Given a datetime in Romania time, returns the zone name and the next sleep duration in seconds.
    Boundary checks ensure the loop wakes up exactly when a new zone starts.
    """
    weekday = dt.weekday()
    current_time = dt.time()

    # 1. Weekend Zone (Saturday & Sunday)
    if weekday >= 5:
        days_to_monday = 7 - weekday
        next_change = datetime.combine(dt.date() + timedelta(days=days_to_monday), datetime_time(0, 0), dt.tzinfo)
        time_to_change = int((next_change - dt).total_seconds())
        frequency = 12 * 3600 # 12 hours
        return "quiet", max(1, min(frequency, time_to_change))

    # 2. Fire Zone (Mon-Fri, 14:30 - 23:00)
    fire_start = datetime_time(14, 30)
    fire_end = datetime_time(23, 0)
    
    if fire_start <= current_time < fire_end:
        next_change = datetime.combine(dt.date(), fire_end, dt.tzinfo)
        time_to_change = int((next_change - dt).total_seconds())
        frequency = 15 * 60 # 15 minutes
        return "fire", max(1, min(frequency, time_to_change))

    # 3. Maintenance Zone (Mon-Fri, 23:00 - 14:30 next day)
    if current_time < fire_start:
        next_change = datetime.combine(dt.date(), fire_start, dt.tzinfo)
        time_to_change = int((next_change - dt).total_seconds())
    else:
        if weekday == 4: # Friday night, transitions to weekend at Saturday 00:00
            next_change = datetime.combine(dt.date() + timedelta(days=1), datetime_time(0, 0), dt.tzinfo)
        else: # Mon-Thu night, transitions to Fire zone tomorrow at 14:30
            next_change = datetime.combine(dt.date() + timedelta(days=1), fire_start, dt.tzinfo)
        time_to_change = int((next_change - dt).total_seconds())

    frequency = 2 * 3600 # 2 hours
    return "maintenance", max(1, min(frequency, time_to_change))


def main():
    """
    Main entry point for the ingestor.
    """
    logger.info("Starting NLP Ingestor...")

    # Check for local dev override (e.g., INGESTOR_DEV_INTERVAL_SECONDS=10)
    dev_interval = os.getenv("INGESTOR_DEV_INTERVAL_SECONDS")
    if dev_interval:
        try:
            interval_secs = int(dev_interval)
            logger.info(f"Local development override active. Ingestion running on a fixed loop every {interval_secs} seconds.")
            
            # Initial fetch on startup
            try:
                fetch_and_publish_news()
            except Exception as e:
                logger.error(f"Error during startup ingestion: {e}", exc_info=True)
                
            while True:
                logger.info(f"Sleeping for dev interval of {interval_secs} seconds...")
                time.sleep(interval_secs)
                try:
                    fetch_and_publish_news()
                except Exception as e:
                    logger.error(f"Error during ingestion cycle: {e}", exc_info=True)
        except ValueError:
            logger.error(f"Invalid value for INGESTOR_DEV_INTERVAL_SECONDS: {dev_interval}. Falling back to production schedule.")

    romania_tz = ZoneInfo("Europe/Bucharest")
    
    # Run initial scrape on startup
    logger.info("Running initial scrape on startup...")
    try:
        fetch_and_publish_news()
    except Exception as e:
        logger.error(f"Error during startup ingestion: {e}", exc_info=True)

    logger.info("Scheduler started. Waiting for next run...")
    while True:
        # Compute sleep interval based on Romanian local time
        now = datetime.now(romania_tz)
        zone_name, sleep_seconds = get_sleep_duration_and_zone(now)
        
        logger.info(f"Sleeping for {sleep_seconds} seconds (approx {sleep_seconds // 60} minutes) in '{zone_name}' zone...")
        time.sleep(sleep_seconds)
        
        try:
            fetch_and_publish_news()
        except Exception as e:
            logger.error(f"Error during scheduled ingest: {e}", exc_info=True)


if __name__ == "__main__":
    main()
