-- Add default source flag to RssSource configuration
ALTER TABLE rss_sources ADD COLUMN is_default BOOLEAN DEFAULT FALSE;

-- Add source column to Article to track ingestion source
ALTER TABLE articles ADD COLUMN source VARCHAR(255);

-- Add source column to manual processing requests
ALTER TABLE user_article_processing_requests ADD COLUMN source VARCHAR(255);

-- Seed preconfigured default feeds
INSERT INTO rss_sources (name, url, is_enabled, is_default, item_selector, title_selector, link_selector, description_selector, pub_date_selector)
VALUES 
('CNBC', 'https://www.cnbc.com/id/10000664/device/rss/rss.html', true, true, 'item', 'title', 'link', 'description', 'pubDate'),
('Yahoo Finance', 'https://finance.yahoo.com/news/rssindex', true, true, 'item', 'title', 'link', 'description', 'pubDate'),
('Investing.com', 'https://www.investing.com/rss/news.rss', true, true, 'item', 'title', 'link', 'description', 'pubDate'),
('MarketWatch', 'http://feeds.marketwatch.com/marketwatch/topstories/', true, true, 'item', 'title', 'link', 'description', 'pubDate'),
('Reuters', 'https://ir.thomsonreuters.com/rss/news-releases.xml?items=15', true, true, 'item', 'title', 'link', 'description', 'pubDate'),
('WSJ', 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml', true, true, 'item', 'title', 'link', 'description', 'pubDate'),
('Financial Times', 'https://www.ft.com/?format=rss', true, true, 'item', 'title', 'link', 'description', 'pubDate'),
('Seeking Alpha', 'https://seekingalpha.com/market_currents.xml', true, true, 'item', 'title', 'link', 'description', 'pubDate'),
('Benzinga', 'https://www.benzinga.com/analyst-ratings/feed', true, true, 'item', 'title', 'link', 'description', 'pubDate'),
('NewsAPI', 'https://newsapi.org/v2/everything', true, true, 'item', 'title', 'link', 'description', 'pubDate')
ON CONFLICT (name) DO UPDATE SET is_default = true, url = EXCLUDED.url;
