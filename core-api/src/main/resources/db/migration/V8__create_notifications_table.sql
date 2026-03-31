CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES _user(id),
    ticker VARCHAR(50) NOT NULL,
    article_url VARCHAR(255) NOT NULL,
    article_processed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    sentiment_score DOUBLE PRECISION NOT NULL,
    sentiment_label VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notification_article FOREIGN KEY (article_url, article_processed_at) REFERENCES articles (url, processed_at)
);