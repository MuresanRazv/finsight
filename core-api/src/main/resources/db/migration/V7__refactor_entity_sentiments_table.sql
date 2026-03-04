TRUNCATE TABLE entity_sentiments;

ALTER TABLE entity_sentiments
DROP CONSTRAINT IF EXISTS entity_sentiments_article_url_fkey;

ALTER TABLE entity_sentiments
    ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ADD COLUMN IF NOT EXISTS article_processed_at TIMESTAMP WITH TIME ZONE NOT NULL;

ALTER TABLE entity_sentiments DROP CONSTRAINT IF EXISTS entity_sentiments_pkey;
ALTER TABLE entity_sentiments ADD PRIMARY KEY (id, processed_at);

SELECT create_hypertable('entity_sentiments', 'processed_at', if_not_exists => true);

CREATE INDEX IF NOT EXISTS idx_entity_sentiments_article_lookup
    ON entity_sentiments (article_url, article_processed_at);

CREATE INDEX IF NOT EXISTS idx_ticker_time
    ON entity_sentiments (ticker, processed_at DESC);