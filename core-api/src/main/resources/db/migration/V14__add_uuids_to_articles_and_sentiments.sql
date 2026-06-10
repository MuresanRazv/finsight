-- Add UUID column to articles table with random uuid default
ALTER TABLE articles
    ADD COLUMN IF NOT EXISTS uuid UUID NOT NULL DEFAULT gen_random_uuid();

-- Create index on uuid column of articles
CREATE INDEX IF NOT EXISTS idx_articles_uuid ON articles(uuid);

-- Add UUID column to entity_sentiments table with random uuid default
ALTER TABLE entity_sentiments
    ADD COLUMN IF NOT EXISTS uuid UUID NOT NULL DEFAULT gen_random_uuid();

-- Create index on uuid column of entity_sentiments
CREATE INDEX IF NOT EXISTS idx_entity_sentiments_uuid ON entity_sentiments(uuid);

-- Add article_uuid column to user_article_processing_requests table (nullable, references article uuid logically)
ALTER TABLE user_article_processing_requests
    ADD COLUMN IF NOT EXISTS article_uuid UUID;

-- Create index on article_uuid column of user_article_processing_requests
CREATE INDEX IF NOT EXISTS idx_processing_requests_article_uuid ON user_article_processing_requests(article_uuid);
