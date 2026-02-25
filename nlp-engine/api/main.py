from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from typing import List
from services.ml_service import ml_service
from services.chroma_service import chroma_service
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="NLP Engine API",
    description="API for semantic search and sentiment analysis of financial news.",
    version="1.0.0"
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
        if results and results['ids']:
            ids = results['ids'][0]
            metadatas = results['metadatas'][0]
            distances = results['distances'][0]
            
            for i, doc_id in enumerate(ids):
                metadata = metadatas[i]
                distance = distances[i]
                
                # Convert distance to relevance score (simple inversion for now)
                relevance_score = 1.0 / (1.0 + distance)
                
                search_results.append(SearchResult(
                    url=doc_id,
                    title=metadata.get("title", "Unknown Title"),
                    source=metadata.get("source", "Unknown Source"),
                    published_at=metadata.get("published_at", ""),
                    sentiment_label=metadata.get("sentiment_label", "neutral"),
                    sentiment_score=metadata.get("sentiment_score", 0.0),
                    relevance_score=relevance_score
                ))
                
        return search_results
        
    except Exception as e:
        logger.error(f"Search failed: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
