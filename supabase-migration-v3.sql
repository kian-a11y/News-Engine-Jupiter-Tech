-- Migration v3: Add alternative_sources for deduplication tracking
ALTER TABLE news_items ADD COLUMN IF NOT EXISTS alternative_sources jsonb DEFAULT '[]';
