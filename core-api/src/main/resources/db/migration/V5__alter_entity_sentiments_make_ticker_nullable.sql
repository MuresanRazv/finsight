-- Make the 'ticker' column in the 'entity_sentiments' table nullable
ALTER TABLE entity_sentiments
    ALTER COLUMN ticker DROP NOT NULL;

-- Drop the index on the 'ticker' column as it's no longer necessary for a nullable field
DROP INDEX IF EXISTS idx_ticker;
