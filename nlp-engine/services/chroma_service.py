import chromadb
from chromadb.config import Settings
from core.config import settings
import logging

logger = logging.getLogger(__name__)

class ChromaService:
    """
    Service for interacting with ChromaDB.
    """
    def __init__(self):
        self.client = chromadb.HttpClient(host=settings.CHROMADB_HOST, port=settings.CHROMADB_PORT)
        self.collection = self.client.get_or_create_collection(name="financial_news")
        logger.info("Connected to ChromaDB")

    def add_document(self, document_id: str, text: str, embedding: list, metadata: dict):
        """
        Adds a document to the ChromaDB collection.
        """
        self.collection.add(
            ids=[document_id],
            documents=[text],
            embeddings=[embedding],
            metadatas=[metadata]
        )
        logger.info(f"Added document {document_id} to ChromaDB")

    def query_documents(self, query_embedding: list, n_results: int = 5):
        """
        Queries the ChromaDB collection for similar documents.
        """
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results
        )
        return results

chroma_service = ChromaService()
