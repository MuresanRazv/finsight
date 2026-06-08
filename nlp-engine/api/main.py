from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone

from core.config import settings
from services.ml_service import ml_service
from services.chroma_service import chroma_service
from models.schemas import EntitySentiment
import logging
import json

from langchain_community.llms import Ollama
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="NLP Engine API",
    description="API for semantic search and sentiment analysis of financial news.",
    version="1.0.0"
)

# Initialize LLM
if settings.USE_GEMINI:
    logger.info(f"Using Gemini model: {settings.GEMINI_MODEL}")
    llm = ChatGoogleGenerativeAI(
        model=settings.GEMINI_MODEL,
        google_api_key=settings.GOOGLE_API_KEY,
        temperature=0
    )
else:
    logger.info(f"Using Ollama model: {settings.LLM_MODEL} at {settings.LLM_HOST}")
    llm = Ollama(
        base_url=settings.LLM_HOST,
        model=settings.LLM_MODEL,
        temperature=0
    )

# Define Prompt Template
rag_prompt = PromptTemplate(
    template="You are a strict financial AI analyst. You must answer the user's question based ONLY on the provided context. Do not use external knowledge. If the context does not contain the answer, reply exactly with: 'I do not have enough information in my database to answer this.'\n\nContext: {context}\n\nQuestion: {question}\n\nAnswer:",
    input_variables=["context", "question"]
)

class SearchResult(BaseModel):
    """
    Schema for search results.
    """
    url: str
    title: str
    source: str
    published_at: str
    sentiment_label: str
    sentiment_score: float
    relevance_score: float
    entities: List[EntitySentiment] = []

class ChatRequest(BaseModel):
    query: str

class ChatResponse(BaseModel):
    answer: str
    source_urls: List[str]

@app.get("/health")
async def health_check():
    """
    Health check endpoint.
    """
    return {"status": "ok"}

@app.get("/search", response_model=List[SearchResult])
async def search_news(
    query: str = Query(..., min_length=3, description="Search query for semantic search"),
    limit: int = Query(10, ge=1, le=50, description="Number of results to return")
):
    """
    Semantic search endpoint.
    """
    try:
        # Generate embedding for the query
        query_embedding = ml_service.generate_embedding(query)
        
        # Query ChromaDB
        results = chroma_service.query_documents(query_embedding, n_results=limit)
        
        search_results = []
        if results and results.get('ids') and len(results['ids']) > 0:
            ids = results['ids'][0]
            metadatas = results['metadatas'][0]
            distances = results['distances'][0]
            
            for i, doc_id in enumerate(ids):
                metadata = metadatas[i]
                distance = distances[i]
                
                # Convert distance to relevance score (simple inversion for now)
                relevance_score = 1.0 / (1.0 + distance)
                
                # Parse entities from metadata
                entities_json = metadata.get("entities", "[]")
                try:
                    entities_data = json.loads(entities_json)
                    entities = [EntitySentiment(**e) for e in entities_data]
                except json.JSONDecodeError:
                    logger.warning(f"Failed to parse entities JSON for doc {doc_id}")
                    entities = []
                
                search_results.append(SearchResult(
                    url=metadata.get("url", "Unknown URL"),
                    title=metadata.get("title", "Unknown Title"),
                    source=metadata.get("source", "Unknown Source"),
                    published_at=metadata.get("published_at", ""),
                    sentiment_label=metadata.get("sentiment_label", "neutral"),
                    sentiment_score=metadata.get("sentiment_score", 0.0),
                    relevance_score=relevance_score,
                    entities=entities
                ))
                
        return search_results
        
    except Exception as e:
        logger.error(f"Search failed: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    RAG Endpoint for querying financial articles using an LLM.
    """
    try:
        # Convert the query into a vector
        query_embedding = ml_service.generate_embedding(request.query)

        # Query ChromaDB for top 5 documents
        results = chroma_service.query_documents(query_embedding, n_results=5)
        
        # Extract raw text and join into context
        context_docs = []
        source_urls = []
        
        if results and results.get('documents') and len(results['documents']) > 0:
            context_docs = results['documents'][0]
            metadatas = results['metadatas'][0]
            # Collect source URLs and filter out None
            source_urls = [meta.get("url") for meta in metadatas if meta and "url" in meta]
            
        context = "\n\n".join(context_docs)

        # Pass context and query to LangChain and LLM
        chain = rag_prompt | llm | StrOutputParser()
        answer = chain.invoke({"context": context, "question": request.query})
        
        # Return JSON response
        return ChatResponse(
            answer=answer,
            source_urls=source_urls
        )
    except Exception as e:
        logger.error(f"Chat RAG failed: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

class ProcessRequest(BaseModel):
    url: str
    title: Optional[str] = None
    text: Optional[str] = None
    source: Optional[str] = None
    userId: Optional[int] = None

@app.post("/api/process")
async def process_article(req: ProcessRequest):
    logger.info(f"Received manual process request for URL: {req.url}")
    
    # 1. Scrape if text/title/source is missing
    title = req.title
    text = req.text
    source = req.source
    
    if not text or not title:
        try:
            import requests
            from bs4 import BeautifulSoup
            from urllib.parse import urlparse
            
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
            res = requests.get(req.url, headers=headers, timeout=10)
            res.raise_for_status()
            
            soup = BeautifulSoup(res.content, "html.parser")
            
            # extract title
            if not title:
                title_tag = soup.find("title")
                title = title_tag.text.strip() if title_tag else "Manual Article"
            
            # extract text
            if not text:
                # get all paragraphs
                paragraphs = soup.find_all("p")
                text = " ".join([p.text.strip() for p in paragraphs if p.text.strip()])
                
            if not source:
                domain = urlparse(req.url).netloc
                source = domain.replace("www.", "")
                
            if not text or not text.strip():
                raise HTTPException(status_code=400, detail="Could not extract text content from the URL. Please provide title and text manually.")
                
        except HTTPException as he:
            raise he
        except Exception as e:
            logger.error(f"Failed to scrape URL {req.url}: {e}")
            raise HTTPException(status_code=400, detail=f"Failed to scrape URL: {str(e)}")
            
    if not source:
        from urllib.parse import urlparse
        domain = urlparse(req.url).netloc
        source = domain.replace("www.", "") or "Manual Ingest"

    # 2. Queue the Celery task
    payload = {
        "source": source,
        "title": title,
        "text": text,
        "url": req.url,
        "published_at": datetime.now(timezone.utc).isoformat(),
        "requested_by_user_id": req.userId
    }
    
    try:
        from workers.celery_app import celery_app
        celery_app.send_task(
            "workers.tasks.analyze_sentiment",
            kwargs=payload,
            queue=settings.QUEUE_RAW_NEWS,
        )
        logger.info(f"Published manual processing task for: {req.url}")
        return {"status": "queued", "url": req.url}
    except Exception as e:
        logger.error(f"Failed to queue celery task: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to queue task: {str(e)}")

class BulkProcessRequest(BaseModel):
    urls: List[str]
    userId: Optional[int] = None

@app.post("/api/process/bulk")
async def process_articles_bulk(req: BulkProcessRequest):
    logger.info(f"Received manual bulk process request for {len(req.urls)} URLs")
    
    if not req.urls:
        raise HTTPException(status_code=400, detail="No URLs provided")

    success_count = 0
    errors = []
    
    from workers.celery_app import celery_app
    
    for idx, url in enumerate(req.urls):
        url_cleaned = url.strip()
        if not url_cleaned:
            continue
            
        title = None
        text = None
        source = None
        
        try:
            import time
            if idx > 0:
                time.sleep(1) # Sleep 1 second between scrapes to throttle local system & source web traffic
                
            import requests
            from bs4 import BeautifulSoup
            from urllib.parse import urlparse
            
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
            res = requests.get(url_cleaned, headers=headers, timeout=10)
            res.raise_for_status()
            
            soup = BeautifulSoup(res.content, "html.parser")
            
            # extract title
            title_tag = soup.find("title")
            title = title_tag.text.strip() if title_tag else "Manual Article"
            
            # extract text
            paragraphs = soup.find_all("p")
            text = " ".join([p.text.strip() for p in paragraphs if p.text.strip()])
            
            domain = urlparse(url_cleaned).netloc
            source = domain.replace("www.", "") or "Manual Ingest"
            
            if not text or not text.strip():
                raise Exception("Could not extract text content from the URL.")
                
            payload = {
                "source": source,
                "title": title,
                "text": text,
                "url": url_cleaned,
                "published_at": datetime.now(timezone.utc).isoformat(),
                "requested_by_user_id": req.userId
            }
            
            celery_app.send_task(
                "workers.tasks.analyze_sentiment",
                kwargs=payload,
                queue=settings.QUEUE_RAW_NEWS,
                countdown=idx * 3 # Stagger NLP/FinBERT task executions by 3s each to prevent laptop crashes
            )
            success_count += 1
            
        except Exception as e:
            logger.error(f"Failed to scrape URL {url_cleaned} in bulk process: {e}")
            errors.append({"url": url_cleaned, "error": str(e)})
            
            if req.userId is not None:
                try:
                    import pika
                    from core.rabbitmq import rabbitmq_client
                    failure_payload = {
                        "url": url_cleaned,
                        "requestedByUserId": req.userId,
                        "errorMessage": f"Scraping failed: {str(e)}"
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
                except Exception as pub_ex:
                    logger.error(f"Failed to publish bulk failure notification for {url_cleaned}: {pub_ex}")
                    
    return {
        "status": "initiated",
        "processed": success_count,
        "failed": len(errors),
        "errors": errors
    }


