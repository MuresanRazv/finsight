CREATE TABLE user_article_processing_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES _user(id) ON DELETE CASCADE,
    url VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    article_title VARCHAR(255),
    article_sentiment_label VARCHAR(50),
    article_sentiment_score DOUBLE PRECISION,
    error_message TEXT
);
