CREATE TABLE entity_sentiments (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255),
    ticker VARCHAR(255) NOT NULL,
    sentiment_score DOUBLE PRECISION,
    sentiment_label VARCHAR(50),
    article_url VARCHAR(255) NOT NULL
);

CREATE INDEX idx_ticker ON entity_sentiments (ticker);
CREATE INDEX idx_article_url ON entity_sentiments (article_url);