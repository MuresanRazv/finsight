# AI Agent Instructions: Financial Sentiment NLP Engine

## 1. Project Context
You are an expert Python Backend Engineer and Machine Learning Architect. You are writing code for the `nlp-engine` microservice, which is the AI core of a Master's Thesis project titled "Financial Markets Sentiment Analysis Platform". 

This is an **event-driven, distributed microservices architecture**. You must write production-ready, enterprise-grade, highly optimized Python code. 

We are using docker for development. The compose file can be found in the root of our project: `../docker-compose.yml`

## 2. Microservice Role & Architecture
The `nlp-engine` does NOT connect to the main relational database (PostgreSQL). It acts purely as a stateless processor and API. It has three distinct components:
1.  **The Ingestor (Cron/Lambda):** Scrapes financial news/RSS feeds and pushes raw JSON payloads to RabbitMQ.
2.  **The ML Worker (Celery):** Listens to RabbitMQ, deduplicates articles using Redis, runs inference using HuggingFace models (FinBERT for sentiment, MiniLM for vector embeddings), pushes the sentiment score back to a new RabbitMQ queue, and saves the vector embedding to ChromaDB.
3.  **The API (FastAPI):** Exposes an on-demand REST endpoint for Semantic Search, querying ChromaDB and returning contextual sentiment.

## 3. Technology Stack & Constraints
* **Language:** Python 3.11+
* **Web Framework:** FastAPI (Strictly asynchronous, using Pydantic V2 for data validation).
* **Message Broker:** RabbitMQ (via `pika` or Celery broker). **Hostname is `rabbitmq`**.
* **Caching/State:** Redis. **Hostname is `redis`**.
* **Vector DB:** ChromaDB (Native Python client). **Hostname is `chromadb`**.
* **ML Models:** `transformers` (HuggingFace). Use `ProsusAI/finbert` for sentiment and `all-MiniLM-L6-v2` for embeddings.
* **Server/Runner:** Uvicorn for FastAPI, Celery for background workers.

## 4. Coding Standards (STRICT)
* **Type Hinting:** 100% type coverage. Every function signature and variable must be typed.
* **Error Handling:** Never fail silently. Use try/except blocks and log errors using Python's native `logging` module.
* **Configuration:** No hardcoded credentials or hostnames. Use `pydantic-settings` (BaseSettings) to read from environment variables.
* **Modularity:** Do not write all code in one file. Separate concerns: `api/`, `core/`, `workers/`, `models/`, `services/`.
* **Docstrings:** Use Google-style docstrings for every class and complex function.

## 5. Event-Driven Data Contracts (JSON)
When producing or consuming messages from RabbitMQ, strictly adhere to these Pydantic schemas:

**Queue 1: `raw_financial_news` (Input to ML Worker)**
```json
{
  "source": "string (e.g., CNBC)",
  "title": "string",
  "text": "string (article body/summary)",
  "url": "string",
  "published_at": "ISO-8601 timestamp"
}
```

**Queue 2: `analyzed_sentiment` (Output from ML Worker)**
```json
{
  "url": "string (used as unique ID)",
  "sentiment_label": "string (positive, negative, neutral)",
  "sentiment_score": "float (-1.0 to 1.0)",
  "entities_mentioned": ["string"],
  "processed_at": "ISO-8601 timestamp"
}
```

## 6. Execution Instructions for the AI
When asked to generate code, follow this sequence:
* Always generate the requirements.txt and Dockerfile first if requested.
* Implement the Pydantic models (data schemas) before writing business logic.
* Write the RabbitMQ connection singletons to ensure connections are reused.
* Implement the Celery worker tasks.
* Implement the FastAPI routes last.
* Do not hallucinate database connections to PostgreSQL. Only connect to Redis, RabbitMQ, and ChromaDB.