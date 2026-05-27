# AI Agent Instructions: FinSight Core API (Spring Boot)

## 1. Project Context
You are an expert Enterprise Java Architect. You are writing code for the `core-api` microservice, which is the central orchestrator of a Master's Thesis project titled "FinSight: Distributed Financial Sentiment Platform".

This is an **event-driven, polyglot microservices architecture**. You must write production-ready, highly optimized Java code using modern Spring Boot patterns.

## 2. Microservice Role & Architecture
The `core-api` acts as the API Gateway, WebSocket Server, and Data Manager. It does NOT perform machine learning. Its responsibilities are:
1.  **Message Consumption:** Listen to the `analyzed_sentiment` RabbitMQ queue.
2.  **Data Persistence:** Save the incoming sentiment payloads into a TimescaleDB/PostgreSQL database using Spring Data JPA.
3.  **Real-Time Streaming:** Broadcast the newly saved sentiment data to connected frontend clients (Next.js) via WebSockets (STOMP).
4.  **Authentication:** Manage user accounts, watchlists, and issue JWT tokens via Spring Security.
5.  **Proxying:** Forward semantic search queries to the Python FastAPI service.

## 3. Technology Stack & Constraints
* **Language:** Java 21 (Use Records, Switch Expressions, and modern syntax).
* **Framework:** Spring Boot 3.2+
* **Build Tool:** Maven (`pom.xml`).
* **Database:** PostgreSQL (with TimescaleDB extension). Connect via standard `org.postgresql.Driver`. **Hostname is `timescaledb`**.
* **Message Broker:** RabbitMQ (Spring AMQP). **Hostname is `rabbitmq`**.
* **Real-time:** Spring WebSockets + STOMP.
* **Security:** Spring Security 6.x + JWT (Stateless authentication).

## 4. Coding Standards (STRICT)
* **Architecture:** Strictly enforce the Controller -> Service -> Repository pattern. Do not put business logic in Controllers.
* **DTOs:** Never expose JPA Entities directly via REST or WebSockets. Always map Entities to DTOs (use Java `record` types for DTOs).
* **Configuration:** No hardcoded credentials. Use `application.yml` referencing environment variables (e.g., `${DB_HOST:localhost}`).
* **Lombok:** Use Lombok (`@Data`, `@RequiredArgsConstructor`, `@Builder`, `@Slf4j`) to eliminate boilerplate code.
* **Error Handling:** Use a `@ControllerAdvice` global exception handler to return standardized JSON error responses.

## 5. Event-Driven Data Contracts (Incoming JSON)
When consuming messages from RabbitMQ (`analyzed_sentiment` queue), strictly map the incoming JSON to this DTO structure:

```json
{
  "url": "string (unique ID/PK)",
  "overall_sentiment_score": 0.82,
  "overall_sentiment_label": "BULLISH",
  "entities": [
    {
      "name": "Apple",
      "ticker": "AAPL",
      "sentiment_score": 0.95,
      "sentiment_label": "BULLISH"
    }
  ],
  "semantic_vector_id": "string",
  "processed_at": "2026-02-25T14:30:00Z"
}
```

## 6. Execution Instructions for the AI
When asked to generate code, follow this strict sequence:

* Generate the pom.xml, Dockerfile, and application.yml first.
* Create the JPA Entities (Article, EntitySentiment) and their Spring Data Repositories.
* Create the Java Records (DTOs) representing the RabbitMQ payload.
* Implement the RabbitMQ Listener Service to save data to the DB.
* Implement the WebSocket configuration and broadcast logic.
* Implement the REST Controllers and Spring Security last.
* Do not hallucinate connections to Redis or ChromaDB; those belong strictly to the Python NLP engine.