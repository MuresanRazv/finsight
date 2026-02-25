from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
from sentence_transformers import SentenceTransformer
import torch
import logging

logger = logging.getLogger(__name__)

class MLService:
    """
    Service for handling ML model inference.
    """
    def __init__(self):
        self.sentiment_pipeline = pipeline("sentiment-analysis", model="ProsusAI/finbert")
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        logger.info("ML models loaded successfully")

    def analyze_sentiment(self, text: str) -> dict:
        """
        Analyzes the sentiment of the given text using FinBERT.
        Returns a dictionary with label and score.
        """
        result = self.sentiment_pipeline(text)[0]
        return {
            "label": result['label'],
            "score": result['score']
        }

    def generate_embedding(self, text: str) -> list:
        """
        Generates vector embedding for the given text using MiniLM.
        Returns a list of floats.
        """
        embedding = self.embedding_model.encode(text)
        return embedding.tolist()

ml_service = MLService()
