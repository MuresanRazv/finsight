from celery import Celery
from core.config import settings

celery_app = Celery(
    "nlp_engine",
    broker=f"amqp://{settings.RABBITMQ_USER}:{settings.RABBITMQ_PASSWORD}@{settings.RABBITMQ_HOST}:{settings.RABBITMQ_PORT}//",
    backend=f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/0",
    include=["workers.tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    # Route tasks to the specific queue defined in settings
    task_default_queue=settings.QUEUE_RAW_NEWS,
    task_acks_late=True,  # Ensure tasks aren't lost if the worker crashes during processing
    broker_heartbeat=0,  # Disable heartbeats to prevent connection resets when executing heavy ML models
)
