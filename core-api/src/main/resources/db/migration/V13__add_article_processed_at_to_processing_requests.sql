ALTER TABLE user_article_processing_requests
    ADD COLUMN IF NOT EXISTS article_processed_at TIMESTAMPTZ;
