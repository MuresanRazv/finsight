from celery import shared_task
from core.config import settings
from core.rabbitmq import rabbitmq_client
from models.schemas import FinancialNewsItem, AnalyzedArticle, EntitySentiment
from services.ml_service import ml_service
from services.chroma_service import chroma_service
from services.redis_service import redis_service
import json
import logging
import pika
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

@shared_task(name="workers.tasks.analyze_sentiment")
def analyze_sentiment(**news_item_data):
    """
    Celery task to process raw financial news.
    """
    try:
        # Validate input
        news_item = FinancialNewsItem(**news_item_data)
        
        # Deduplication
        if redis_service.is_processed(news_item.url):
            logger.info(f"Article already processed: {news_item.url}")
            return

        # Extract entities and their sentiment
        entity_sentiments_data = ml_service.extract_entity_sentiments(news_item.text)
        
        # Convert to Pydantic models
        entities = [EntitySentiment(**es) for es in entity_sentiments_data]

        # Run FinBERT on the whole text for overall sentiment
        overall_sentiment = ml_service.analyze_sentiment(news_item.text)

        # Pass the raw article text through the all-MiniLM-L6-v2 model to generate the embedding array
        # (Truncate the text if it exceeds the model's token limit - handled by the model/library usually, but good to be aware)
        embedding = ml_service.generate_embedding(news_item.text)
        
        # Prepare entities for ChromaDB metadata (serialize to JSON string)
        entities_json_str = json.dumps([e.model_dump() for e in entities])

        # Upsert the generated embedding into the financial_articles ChromaDB collection
        chroma_service.add_document(
            document_id=news_item.url,
            text=news_item.text,
            embedding=embedding,
            metadata={
                "url": news_item.url,
                "published_at": news_item.published_at.isoformat(),
                "source": news_item.source,
                "title": news_item.title,
                "sentiment_label": overall_sentiment["label"],
                "sentiment_score": overall_sentiment["score"],
                "entities": entities_json_str
            }
        )

        analyzed_article = AnalyzedArticle(
            url=news_item.url,
            title=news_item.title,
            overall_sentiment_label=overall_sentiment["label"],
            overall_sentiment_score=overall_sentiment["score"],
            entities=entities,
            processed_at=datetime.now(timezone.utc)
        )
        
        # Push to RabbitMQ
        channel = rabbitmq_client.get_channel()
        channel.basic_publish(
            exchange='',
            routing_key=settings.QUEUE_ANALYZED_SENTIMENT,
            body=analyzed_article.model_dump_json(),
            properties=pika.BasicProperties(
                content_type='application/json',
                delivery_mode=2,  # make message persistent
            )
        )
        
        # Mark as processed
        redis_service.mark_processed(news_item.url)
        
        logger.info(f"Successfully processed article: {news_item.url}")

    except Exception as e:
        logger.error(f"Error processing news item: {e}")
        # Ideally, we might want to retry or send to a dead-letter queue
