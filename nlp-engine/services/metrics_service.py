import time
import json
import inspect
import functools
import logging
from datetime import datetime, timezone
from typing import Callable, Any, Optional, Dict, List
from services.redis_service import redis_service

logger = logging.getLogger(__name__)

class MetricsService:
    """
    Service for benchmarking and tracking observability metrics for various actions
    in the FinSight pipeline, stored in Redis.
    """
    
    def __init__(self, history_limit: int = 100):
        self.history_limit = history_limit

    def record_execution(
        self,
        action: str,
        duration: float,
        success: bool,
        article_count: int = 0,
        error_message: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """
        Record a single execution run of an action in Redis.
        """
        try:
            r = redis_service.redis_client
            
            # Use keys prefixed with metrics:
            key_prefix = f"metrics:{action}"
            
            # Increment total execution counter
            r.incr(f"{key_prefix}:count")
            
            # Increment total duration (float)
            r.incrbyfloat(f"{key_prefix}:total_time", duration)
            
            # Increment success/failure counter
            if success:
                r.incr(f"{key_prefix}:success_count")
            else:
                r.incr(f"{key_prefix}:error_count")
                
            # Increment article count if provided
            if article_count > 0:
                r.incrby(f"{key_prefix}:article_count", article_count)
                
            # Construct history event
            history_event = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "duration": duration,
                "status": "success" if success else "failed",
                "article_count": article_count,
                "error": error_message,
                "metadata": metadata or {}
            }
            
            # Push to Redis list and trim to maintain limit
            history_key = f"{key_prefix}:history"
            r.lpush(history_key, json.dumps(history_event))
            r.ltrim(history_key, 0, self.history_limit - 1)
            
        except Exception as e:
            logger.error(f"Failed to record metrics for {action}: {e}")

    def get_metrics(self, action: str) -> Dict[str, Any]:
        """
        Get aggregated metrics and recent history for a specific action.
        """
        try:
            r = redis_service.redis_client
            key_prefix = f"metrics:{action}"
            
            # Fetch counter keys
            count = int(r.get(f"{key_prefix}:count") or 0)
            total_time = float(r.get(f"{key_prefix}:total_time") or 0.0)
            success_count = int(r.get(f"{key_prefix}:success_count") or 0)
            error_count = int(r.get(f"{key_prefix}:error_count") or 0)
            article_count = int(r.get(f"{key_prefix}:article_count") or 0)
            
            # Fetch history
            history_key = f"{key_prefix}:history"
            history_raw = r.lrange(history_key, 0, -1)
            history = [json.loads(h) for h in history_raw]
            
            # Calculate derived metrics
            avg_time = total_time / count if count > 0 else 0.0
            avg_time_per_article = total_time / article_count if article_count > 0 else 0.0
            failure_rate = error_count / count if count > 0 else 0.0
            
            return {
                "action": action,
                "total_executions": count,
                "total_time_seconds": total_time,
                "success_count": success_count,
                "error_count": error_count,
                "failure_rate": failure_rate,
                "avg_execution_time_seconds": avg_time,
                "total_articles_processed": article_count,
                "avg_time_per_article_seconds": avg_time_per_article,
                "recent_history": history
            }
        except Exception as e:
            logger.error(f"Failed to retrieve metrics for {action}: {e}")
            return {"action": action, "error": str(e)}

    def get_all_metrics(self) -> Dict[str, Any]:
        """
        Get metrics for all tracked actions.
        """
        actions = [
            "rss_scrape",
            "automatic_ingest_cron",
            "celery_task_process",
            "ml_sentiment_inference",
            "ml_entity_inference",
            "ml_embedding_inference",
            "chromadb_insert",
            "manual_single_ingest",
            "manual_bulk_ingest",
            "semantic_search",
            "rag_chat"
        ]
        return {action: self.get_metrics(action) for action in actions}

    def clear_metrics(self, action: Optional[str] = None):
        """
        Clear metrics from Redis (either for a specific action or all actions).
        """
        try:
            r = redis_service.redis_client
            actions = [action] if action else [
                "rss_scrape",
                "automatic_ingest_cron",
                "celery_task_process",
                "ml_sentiment_inference",
                "ml_entity_inference",
                "ml_embedding_inference",
                "chromadb_insert",
                "manual_single_ingest",
                "manual_bulk_ingest",
                "semantic_search",
                "rag_chat"
            ]
            for act in actions:
                key_prefix = f"metrics:{act}"
                keys_to_delete = [
                    f"{key_prefix}:count",
                    f"{key_prefix}:total_time",
                    f"{key_prefix}:success_count",
                    f"{key_prefix}:error_count",
                    f"{key_prefix}:article_count",
                    f"{key_prefix}:history"
                ]
                r.delete(*keys_to_delete)
            logger.info(f"Cleared metrics for actions: {actions}")
        except Exception as e:
            logger.error(f"Failed to clear metrics: {e}")

metrics_service = MetricsService()

def benchmark_action(
    action_name: str,
    article_count_extractor: Optional[Callable[[Any, Any, Any], int]] = None,
    metadata_extractor: Optional[Callable[[Any, Any, Any], Dict[str, Any]]] = None
):
    """
    Decorator to benchmark a function's execution time and count.
    Supports both synchronous and asynchronous functions.
    
    The extractors receive (args, kwargs, result) to extract metrics dynamically.
    """
    def decorator(func: Callable):
        if inspect.iscoroutinefunction(func):
            @functools.wraps(func)
            async def async_wrapper(*args, **kwargs):
                start_time = time.perf_counter()
                success = True
                error_msg = None
                result = None
                try:
                    result = await func(*args, **kwargs)
                    return result
                except Exception as e:
                    success = False
                    error_msg = str(e)
                    raise e
                finally:
                    duration = time.perf_counter() - start_time
                    art_count = 0
                    meta = None
                    try:
                        if article_count_extractor:
                            art_count = article_count_extractor(args, kwargs, result)
                        if metadata_extractor:
                            meta = metadata_extractor(args, kwargs, result)
                    except Exception as ext_err:
                        logger.warning(f"Error extracting metrics metadata: {ext_err}")
                    
                    metrics_service.record_execution(
                        action=action_name,
                        duration=duration,
                        success=success,
                        article_count=art_count,
                        error_message=error_msg,
                        metadata=meta
                    )
            return async_wrapper
        else:
            @functools.wraps(func)
            def sync_wrapper(*args, **kwargs):
                start_time = time.perf_counter()
                success = True
                error_msg = None
                result = None
                try:
                    result = func(*args, **kwargs)
                    return result
                except Exception as e:
                    success = False
                    error_msg = str(e)
                    raise e
                finally:
                    duration = time.perf_counter() - start_time
                    art_count = 0
                    meta = None
                    try:
                        if article_count_extractor:
                            art_count = article_count_extractor(args, kwargs, result)
                        if metadata_extractor:
                            meta = metadata_extractor(args, kwargs, result)
                    except Exception as ext_err:
                        logger.warning(f"Error extracting metrics metadata: {ext_err}")
                    
                    metrics_service.record_execution(
                        action=action_name,
                        duration=duration,
                        success=success,
                        article_count=art_count,
                        error_message=error_msg,
                        metadata=meta
                    )
            return sync_wrapper
    return decorator
