from pydantic import BaseModel, Field, HttpUrl
from typing import List, Optional
from datetime import datetime

class FinancialNewsItem(BaseModel):
    """
    Schema for raw financial news articles pushed to the 'raw_financial_news' queue.
    """
    source: str = Field(..., description="Source of the news, e.g., CNBC, Reuters")
    title: str = Field(..., description="Headline of the article")
    text: str = Field(..., description="Body or summary of the article")
    url: str = Field(..., description="URL of the article")
    published_at: datetime = Field(..., description="ISO-8601 timestamp of publication")

class AnalyzedSentiment(BaseModel):
    """
    Schema for analyzed sentiment pushed to the 'analyzed_sentiment' queue.
    """
    url: str = Field(..., description="URL of the article, used as unique ID")
    sentiment_label: str = Field(..., description="Sentiment label: positive, negative, neutral")
    sentiment_score: float = Field(..., ge=-1.0, le=1.0, description="Sentiment score between -1.0 and 1.0")
    entities_mentioned: List[str] = Field(default_factory=list, description="List of entities mentioned in the text")
    processed_at: datetime = Field(default_factory=datetime.utcnow, description="ISO-8601 timestamp of processing")
