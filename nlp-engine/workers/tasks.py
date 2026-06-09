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
    requested_by_user_id = news_item_data.pop("requested_by_user_id", None)
    try:
        # Validate input
        news_item = FinancialNewsItem(**news_item_data)
        
        # Deduplication
        if redis_service.is_processed(news_item.url):
            logger.info(f"Article already processed: {news_item.url}")
            
            # If a user requested this manually, send a completion notification to core-api
            if requested_by_user_id is not None:
                try:
                    doc = chroma_service.collection.get(ids=[news_item.url])
                    if doc and doc.get("metadatas") and len(doc["metadatas"]) > 0:
                        metadata = doc["metadatas"][0]
                        entities_data = json.loads(metadata.get("entities", "[]"))
                        entities = [EntitySentiment(**e) for e in entities_data]
                        
                        analyzed_article = AnalyzedArticle(
                            url=news_item.url,
                            title=metadata.get("title", news_item.title),
                            source=metadata.get("source", news_item.source),
                            overall_sentiment_label=metadata.get("sentiment_label", "neutral"),
                            overall_sentiment_score=metadata.get("sentiment_score", 0.0),
                            entities=entities,
                            processed_at=datetime.now(timezone.utc),
                            requested_by_user_id=requested_by_user_id
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
                        logger.info(f"Successfully republished existing article info for manual request: {news_item.url}")
                        return
                except Exception as ex:
                    logger.warning(f"Failed to retrieve existing processed article from ChromaDB: {ex}. Proceeding to re-process.")
            else:
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
            source=news_item.source,
            overall_sentiment_label=overall_sentiment["label"],
            overall_sentiment_score=overall_sentiment["score"],
            entities=entities,
            processed_at=datetime.now(timezone.utc),
            requested_by_user_id=requested_by_user_id
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
        if requested_by_user_id is not None:
            try:
                failure_payload = {
                    "url": news_item_data.get("url", "unknown"),
                    "requestedByUserId": requested_by_user_id,
                    "errorMessage": str(e)
                }
                channel = rabbitmq_client.get_channel()
                channel.queue_declare(queue="analyzed_sentiment_failed", durable=True)
                channel.basic_publish(
                    exchange='',
                    routing_key="analyzed_sentiment_failed",
                    body=json.dumps(failure_payload),
                    properties=pika.BasicProperties(
                        content_type='application/json',
                        delivery_mode=2,
                    )
                )
                logger.info(f"Published failure notification for URL: {news_item_data.get('url')}")
            except Exception as pub_ex:
                logger.error(f"Failed to publish failure notification: {pub_ex}")
