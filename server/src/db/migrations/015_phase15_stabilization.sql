-- ============================================================================
-- AKIRA PHASE 15: STABILIZATION, SCHEMA HARMONIZATION & FK INTEGRITY
-- Migration: 015_phase15_stabilization.sql
-- ============================================================================

-- 1. Ensure all health, telemetry, and regional columns exist on public.sources
ALTER TABLE public.sources ADD COLUMN IF NOT EXISTS health_status VARCHAR(30) NOT NULL DEFAULT 'HEALTHY';
ALTER TABLE public.sources ADD COLUMN IF NOT EXISTS consecutive_failures INT NOT NULL DEFAULT 0;
ALTER TABLE public.sources ADD COLUMN IF NOT EXISTS expected_freshness_hours INT NOT NULL DEFAULT 6;
ALTER TABLE public.sources ADD COLUMN IF NOT EXISTS last_error_message TEXT;
ALTER TABLE public.sources ADD COLUMN IF NOT EXISTS articles_ingested_count INT NOT NULL DEFAULT 0;
ALTER TABLE public.sources ADD COLUMN IF NOT EXISTS events_produced_count INT NOT NULL DEFAULT 0;
ALTER TABLE public.sources ADD COLUMN IF NOT EXISTS response_time_ms INT NOT NULL DEFAULT 0;
ALTER TABLE public.sources ADD COLUMN IF NOT EXISTS authority_level VARCHAR(50) DEFAULT 'SPECIALIST';
ALTER TABLE public.sources ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Global';
ALTER TABLE public.sources ADD COLUMN IF NOT EXISTS language VARCHAR(20) DEFAULT 'en';
ALTER TABLE public.sources ADD COLUMN IF NOT EXISTS specialization TEXT;

-- 2. Ensure credibility_score constraint is safe (0.0 to 1.0 range)
ALTER TABLE public.sources DROP CONSTRAINT IF EXISTS sources_credibility_score_check;
ALTER TABLE public.sources ADD CONSTRAINT sources_credibility_score_check CHECK (credibility_score >= 0.0 AND credibility_score <= 1.0);

-- 3. Ensure foreign key constraint on articles table is safe with ON DELETE SET NULL
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'articles_source_id_fkey'
  ) THEN
    ALTER TABLE public.articles 
    ADD CONSTRAINT articles_source_id_fkey 
    FOREIGN KEY (source_id) REFERENCES public.sources(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 4. Upsert/seed all current verified sources so source_id FKs never fail
INSERT INTO public.sources (id, name, url, feed_url, region_id, category_id, tier, credibility_score, conglomerate_id, is_active, health_status, expected_freshness_hours, country, language)
VALUES 
  ('the-hindu-tn', 'The Hindu (Tamil Nadu)', 'https://www.thehindu.com/news/national/tamil-nadu/', 'https://www.thehindu.com/news/national/tamil-nadu/feeder/default.rss', 'tamil-nadu', 'politics', 1, 0.95, 'kasturi-sons', true, 'HEALTHY', 4, 'India', 'en'),
  ('the-hindu-chennai', 'The Hindu (Chennai)', 'https://www.thehindu.com/news/cities/chennai/', 'https://www.thehindu.com/news/cities/chennai/feeder/default.rss', 'tamil-nadu', 'infrastructure', 1, 0.95, 'kasturi-sons', true, 'HEALTHY', 4, 'India', 'en'),
  ('oneindia-tamil', 'OneIndia Tamil', 'https://tamil.oneindia.com', 'https://tamil.oneindia.com/rss/tamil-news-fb.xml', 'tamil-nadu', 'politics', 2, 0.85, 'greynium', true, 'HEALTHY', 4, 'India', 'ta'),
  ('the-hindu', 'The Hindu', 'https://www.thehindu.com', 'https://www.thehindu.com/news/national/feeder/default.rss', 'india', 'politics', 1, 0.95, 'kasturi-sons', true, 'HEALTHY', 3, 'India', 'en'),
  ('indian-express', 'The Indian Express', 'https://indianexpress.com', 'https://indianexpress.com/section/india/feed/', 'india', 'politics', 1, 0.94, 'express-group', true, 'HEALTHY', 3, 'India', 'en'),
  ('toi', 'Times of India', 'https://timesofindia.indiatimes.com', 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms', 'india', 'politics', 2, 0.85, 'times-group', true, 'HEALTHY', 3, 'India', 'en'),
  ('economic-times', 'The Economic Times', 'https://economictimes.indiatimes.com', 'https://economictimes.indiatimes.com/rssfeedstopstories.cms', 'india', 'economy', 1, 0.92, 'times-group', true, 'HEALTHY', 3, 'India', 'en'),
  ('livemint-economy', 'Livemint (Economy & Policy)', 'https://www.livemint.com', 'https://www.livemint.com/rss/economy', 'india', 'economy', 1, 0.91, 'ht-media', true, 'HEALTHY', 3, 'India', 'en'),
  ('bbc-world', 'BBC News', 'https://www.bbc.com/news', 'https://feeds.bbci.co.uk/news/world/rss.xml', 'world', 'politics', 1, 0.95, 'bbc', true, 'HEALTHY', 3, 'UK', 'en'),
  ('aljazeera-world', 'Al Jazeera (World)', 'https://www.aljazeera.com', 'https://www.aljazeera.com/xml/rss/all.xml', 'world', 'politics', 1, 0.93, 'aljazeera-media', true, 'HEALTHY', 3, 'Qatar', 'en'),
  ('dw-world', 'Deutsche Welle (World)', 'https://www.dw.com', 'https://rss.dw.com/xml/rss-en-all', 'world', 'politics', 1, 0.94, 'dw-media', true, 'HEALTHY', 4, 'Germany', 'en'),
  ('france24-en', 'France 24', 'https://www.france24.com', 'https://www.france24.com/en/rss', 'world', 'politics', 1, 0.93, 'france-medias', true, 'HEALTHY', 4, 'France', 'en'),
  ('mit-tech-review', 'MIT Technology Review', 'https://www.technologyreview.com', 'https://www.technologyreview.com/feed/', 'world', 'technology', 1, 0.96, 'mit', true, 'HEALTHY', 6, 'US', 'en'),
  ('arxiv-ai', 'ArXiv (CS.AI Frontiers)', 'https://arxiv.org', 'https://rss.arxiv.org/rss/cs.AI', 'world', 'technology', 1, 0.97, 'cornell-university', true, 'HEALTHY', 12, 'US', 'en'),
  ('techcrunch', 'TechCrunch', 'https://techcrunch.com', 'https://techcrunch.com/feed/', 'world', 'technology', 2, 0.87, 'yahoo', true, 'HEALTHY', 3, 'US', 'en'),
  ('the-verge', 'The Verge', 'https://www.theverge.com', 'https://www.theverge.com/rss/index.xml', 'world', 'technology', 2, 0.86, 'vox-media', true, 'HEALTHY', 4, 'US', 'en'),
  ('bleepingcomputer', 'BleepingComputer', 'https://www.bleepingcomputer.com', 'https://www.bleepingcomputer.com/feed/', 'world', 'security', 1, 0.93, 'bleeping-computer', true, 'HEALTHY', 4, 'US', 'en'),
  ('sciencedaily', 'ScienceDaily', 'https://www.sciencedaily.com', 'https://www.sciencedaily.com/rss/top/science.xml', 'world', 'science', 1, 0.95, 'sciencedaily', true, 'HEALTHY', 6, 'US', 'en'),
  ('sciencedaily-earth', 'ScienceDaily (Earth & Climate)', 'https://www.sciencedaily.com', 'https://www.sciencedaily.com/rss/earth_climate.xml', 'world', 'environment', 1, 0.94, 'sciencedaily', true, 'HEALTHY', 6, 'US', 'en'),
  ('the-guardian-env', 'The Guardian (Environment)', 'https://www.theguardian.com/environment', 'https://www.theguardian.com/environment/rss', 'world', 'environment', 1, 0.93, 'guardian-media', true, 'HEALTHY', 4, 'UK', 'en'),
  ('nasa-news', 'NASA Breaking News', 'https://www.nasa.gov', 'https://www.nasa.gov/rss/dyn/breaking_news.rss', 'world', 'science', 1, 0.98, 'gov-usa', true, 'HEALTHY', 6, 'US', 'en')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  url = EXCLUDED.url,
  feed_url = EXCLUDED.feed_url,
  region_id = EXCLUDED.region_id,
  category_id = EXCLUDED.category_id,
  tier = EXCLUDED.tier,
  credibility_score = EXCLUDED.credibility_score,
  is_active = EXCLUDED.is_active,
  country = EXCLUDED.country,
  language = EXCLUDED.language,
  updated_at = NOW();
