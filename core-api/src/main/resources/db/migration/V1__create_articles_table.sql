CREATE TABLE articles (
    url VARCHAR(255) NOT NULL,
    overall_sentiment_score DOUBLE PRECISION NOT NULL,
    overall_sentiment_label VARCHAR(50) NOT NULL,
    semantic_vector_id VARCHAR(255),
    processed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (url, processed_at)
);