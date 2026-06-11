CREATE TABLE user_weekly_usage (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES _user(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    rag_query_count INT NOT NULL DEFAULT 0,
    ingestion_count INT NOT NULL DEFAULT 0,
    CONSTRAINT uq_user_week UNIQUE (user_id, week_start_date)
);

CREATE INDEX idx_user_weekly_usage_lookup ON user_weekly_usage(user_id, week_start_date);
