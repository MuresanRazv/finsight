from transformers import pipeline
from sentence_transformers import SentenceTransformer
import logging
import spacy
from typing import List, Dict, Any

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
        # Load FinBERT for sentiment analysis
        self.sentiment_pipeline = pipeline(
            "sentiment-analysis", 
            model="ProsusAI/finbert", 
            truncation=True, 
            max_length=512
        )
        
        # Load BERT-NER for entity recognition
        self.ner_pipeline = pipeline(
            "ner", 
            model="dslim/bert-base-NER", 
            aggregation_strategy="simple"
        )
        
        # Load MiniLM for vector embeddings
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Load Spacy for sentence segmentation
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            logger.warning("Spacy model 'en_core_web_sm' not found. Downloading...")
            from spacy.cli import download
            download("en_core_web_sm")
            self.nlp = spacy.load("en_core_web_sm")
            
        logger.info("ML models loaded successfully")

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

    def generate_embedding(self, text: str) -> List[float]:
        """
        Generates vector embedding for the given text using MiniLM.
        Returns a list of floats.
        """
        embedding = self.embedding_model.encode(text)
        return embedding.tolist()

    def extract_entity_sentiments(self, text: str) -> List[Dict[str, Any]]:
        """
        Extracts entities, maps them to tickers, and calculates sentiment 
        based on the sentences they appear in.
        """
        # Step A: Run NER
        ner_results = self.ner_pipeline(text)
        
        # Filter for ORG entities and deduplicate
        unique_entities = set()
        for entity in ner_results:
            if entity['entity_group'] == 'ORG':
                unique_entities.add(entity['word'])
        
        # Step B: Map to tickers
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

        # Step C: Extract sentences
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
            
            # Step D: Run FinBERT on specific sentences
            sentiment = self.analyze_sentiment(entity_context)
            
            entity_sentiments.append({
                "name": entity_name,
                "ticker": entity_info["ticker"],
                "sentiment_score": sentiment["score"],
                "sentiment_label": sentiment["label"]
            })
            
        return entity_sentiments

ml_service = MLService()
