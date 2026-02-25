import redis
from core.config import settings
import logging

logger = logging.getLogger(__name__)

class RedisService:
    """
    Service for interacting with Redis.
    """
    def __init__(self):
        self.redis_client = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            db=0,
            decode_responses=True
        )
        logger.info("Connected to Redis")

    def is_processed(self, url: str) -> bool:
        """
        Checks if the given URL has already been processed.
        """
        return self.redis_client.exists(url)

    def mark_processed(self, url: str):
        """
        Marks the given URL as processed.
        """
        self.redis_client.set(url, "processed")
        logger.info(f"Marked {url} as processed")

redis_service = RedisService()
