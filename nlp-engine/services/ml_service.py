from transformers import pipeline
from sentence_transformers import SentenceTransformer
import logging
import spacy
from typing import List, Dict, Any
from services.metrics_service import benchmark_action

logger = logging.getLogger(__name__)


# Hardcoded ticker mapping for MVP
TICKER_MAPPING = {
    "Apple": "AAPL",
    "Microsoft": "MSFT",
    "Nvidia": "NVDA",
    "Tesla": "TSLA",
    "Intel": "INTC",
    "Google": "GOOGL",
    "Alphabet": "GOOGL",
    "Amazon": "AMZN",
    "Meta": "META",
    "Facebook": "META",
    "Netflix": "NFLX",
    "AMD": "AMD",
    "JPMorgan": "JPM",
    "Goldman Sachs": "GS",
    "Morgan Stanley": "MS"
}

class MLService:
    """
    Service for handling ML model inference.
    """
    def __init__(self):
        self._sentiment_pipeline = None
        self._ner_pipeline = None
        self._embedding_model = None
        self._nlp = None

    @property
    def sentiment_pipeline(self):
        if self._sentiment_pipeline is None:
            logger.info("Lazily loading FinBERT model...")
            self._sentiment_pipeline = pipeline(
                "sentiment-analysis", 
                model="ProsusAI/finbert", 
                truncation=True, 
                max_length=512
            )
        return self._sentiment_pipeline

    @property
    def ner_pipeline(self):
        if self._ner_pipeline is None:
            logger.info("Lazily loading BERT-NER model...")
            self._ner_pipeline = pipeline(
                "ner", 
                model="dslim/bert-base-NER", 
                aggregation_strategy="simple"
            )
        return self._ner_pipeline

    @property
    def embedding_model(self):
        if self._embedding_model is None:
            logger.info("Lazily loading SentenceTransformer model...")
            self._embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
            self._embedding_model.max_seq_length = 256
        return self._embedding_model

    @property
    def nlp(self):
        if self._nlp is None:
            logger.info("Lazily loading SpaCy model...")
            try:
                self._nlp = spacy.load("en_core_web_sm")
            except OSError:
                logger.warning("Spacy model 'en_core_web_sm' not found. Downloading...")
                from spacy.cli import download
                download("en_core_web_sm")
                self._nlp = spacy.load("en_core_web_sm")
        return self._nlp

    @benchmark_action(
        "ml_sentiment_inference",
        metadata_extractor=lambda args, kwargs, result: {
            "text_length": len(args[1]) if len(args) > 1 else (len(kwargs.get("text")) if "text" in kwargs else 0),
            "sentiment": result.get("label") if result else None
        }
    )
    def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """
        Analyzes the sentiment of the given text using FinBERT.
        Returns a dictionary with label and score.
        """
        # Truncate text to 512 tokens handled by pipeline args but good to be safe
        result = self.sentiment_pipeline(text)[0]
        return {
            "label": result['label'],
            "score": result['score']
        }

    @benchmark_action(
        "ml_embedding_inference",
        metadata_extractor=lambda args, kwargs, result: {
            "text_length": len(args[1]) if len(args) > 1 else (len(kwargs.get("text")) if "text" in kwargs else 0)
        }
    )
    def generate_embedding(self, text: str) -> List[float]:
        """
        Generates vector embedding for the given text using MiniLM.
        Returns a list of floats.
        """
        # SentenceTransformer handles truncation based on max_seq_length
        embedding = self.embedding_model.encode(text)
        return embedding.tolist()

    @benchmark_action(
        "ml_entity_inference",
        metadata_extractor=lambda args, kwargs, result: {
            "text_length": len(args[1]) if len(args) > 1 else (len(kwargs.get("text")) if "text" in kwargs else 0),
            "entities_count": len(result) if isinstance(result, list) else 0
        }
    )
    def extract_entity_sentiments(self, text: str) -> List[Dict[str, Any]]:
        """
        Extracts entities, maps them to tickers, and calculates sentiment 
        based on the sentences they appear in.
        """
        # Run NER
        ner_results = self.ner_pipeline(text)

        
        # Filter for ORG entities and deduplicate
        unique_entities = set()
        for entity in ner_results:
            if entity['entity_group'] == 'ORG':
                unique_entities.add(entity['word'])
        
        # Map to tickers
        mapped_entities = []
        for entity_name in unique_entities:
            # Simple matching, could be improved with fuzzy matching
            ticker = TICKER_MAPPING.get(entity_name)
            
            # Also check if the entity name is part of the key (e.g. "Apple Inc" -> "Apple")
            if not ticker:
                for key, val in TICKER_MAPPING.items():
                    if key in entity_name or entity_name in key:
                        ticker = val
                        break
            
            mapped_entities.append({
                "name": entity_name,
                "ticker": ticker
            })

        if not mapped_entities:
            return []

        # Extract sentences
        doc = self.nlp(text)
        entity_sentiments = []

        for entity_info in mapped_entities:
            entity_name = entity_info["name"]
            relevant_sentences = []
            
            for sent in doc.sents:
                if entity_name in sent.text:
                    relevant_sentences.append(sent.text)
            
            if not relevant_sentences:
                continue
                
            # Combine sentences for context
            entity_context = " ".join(relevant_sentences)
            
            # Run FinBERT on specific sentences
            sentiment = self.analyze_sentiment(entity_context)
            
            entity_sentiments.append({
                "name": entity_name,
                "ticker": entity_info["ticker"],
                "sentiment_score": sentiment["score"],
                "sentiment_label": sentiment["label"]
            })
            
        return entity_sentiments

ml_service = MLService()
