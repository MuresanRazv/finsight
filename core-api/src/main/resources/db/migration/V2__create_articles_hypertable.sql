-- Convert the articles table to a TimescaleDB hypertable
-- The 'if_not_exists => true' flag prevents errors on subsequent runs
SELECT create_hypertable('articles', 'processed_at', if_not_exists => true);
