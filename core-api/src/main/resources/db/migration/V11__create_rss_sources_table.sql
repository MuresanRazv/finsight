CREATE TABLE rss_sources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    url VARCHAR(255) NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    item_selector VARCHAR(50) DEFAULT 'item',
    title_selector VARCHAR(50) DEFAULT 'title',
    link_selector VARCHAR(50) DEFAULT 'link',
    link_attribute VARCHAR(50),
    description_selector VARCHAR(50) DEFAULT 'description',
    pub_date_selector VARCHAR(50) DEFAULT 'pubDate',
    pub_date_format VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
