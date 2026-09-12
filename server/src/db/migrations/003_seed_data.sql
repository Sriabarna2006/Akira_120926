-- ==============================================================================
-- AKIRA SEED DATA v1.1
-- Migration: 003_seed_data.sql
-- Description: Seeds canonical regions, core categories, and initial vetted sources.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SEED REGIONS (Tamil Nadu first-class, India, World)
-- ------------------------------------------------------------------------------
INSERT INTO public.regions (id, name, slug, description, tier, is_active)
VALUES
    ('tamil-nadu', 'Tamil Nadu', 'tamil-nadu', 'State-level governance, economy, infrastructure, and culture in Tamil Nadu', 1, true),
    ('india', 'India', 'india', 'National governance, policy, macroeconomic developments, and major events across India', 1, true),
    ('world', 'World', 'world', 'Global geopolitics, international economics, science, and world developments', 1, true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description;

-- ------------------------------------------------------------------------------
-- 2. SEED CATEGORIES (Standardized 15 Categories)
-- ------------------------------------------------------------------------------
INSERT INTO public.categories (id, name, slug, icon, color, description, is_active)
VALUES
    ('politics', 'Politics & Policy', 'politics', 'Landmark', '#3B82F6', 'Governance, legislation, constitutional affairs, and elections', true),
    ('economy', 'Economy & Finance', 'economy', 'TrendingUp', '#10B981', 'Macroeconomics, fiscal policy, inflation, banking, and trade', true),
    ('business', 'Business & Markets', 'business', 'Briefcase', '#6366F1', 'Corporate developments, startups, industry growth, and markets', true),
    ('technology', 'Technology & AI', 'technology', 'Cpu', '#8B5CF6', 'Artificial intelligence, semiconductors, software, and digital innovation', true),
    ('science', 'Science & Space', 'science', 'Atom', '#EC4899', 'Space exploration, astrophysics, biotechnology, and fundamental research', true),
    ('infrastructure', 'Infrastructure & Cities', 'infrastructure', 'Building2', '#F59E0B', 'Urban transit, metro rail, highway corridors, and smart cities', true),
    ('education', 'Education & Research', 'education', 'GraduationCap', '#14B8A6', 'Higher education, literacy initiatives, academic research, and policy', true),
    ('health', 'Healthcare & Medicine', 'health', 'HeartPulse', '#EF4444', 'Public health, medical breakthroughs, pharma, and epidemic tracking', true),
    ('environment', 'Environment & Climate', 'environment', 'Leaf', '#22C55E', 'Renewable energy, climate transition, conservation, and ecology', true),
    ('weather', 'Weather & Monsoons', 'weather', 'CloudRain', '#06B6D4', 'Monsoon forecasts, weather phenomena, and natural disaster advisories', true),
    ('security', 'Defense & Security', 'security', 'Shield', '#64748B', 'National security, defense technology, diplomacy, and strategic affairs', true),
    ('transportation', 'Transit & Logistics', 'transportation', 'Navigation', '#F97316', 'Railways, aviation, maritime shipping, and EV mobility corridors', true),
    ('sports', 'Sports & Athletics', 'sports', 'Trophy', '#EAB308', 'Major tournaments, athletics, cricket, and sports science', true),
    ('entertainment', 'Culture & Cinema', 'entertainment', 'Film', '#A855F7', 'Cinema, literature, cultural heritage, and creative arts', true),
    ('other', 'General & Society', 'other', 'Globe', '#94A3B8', 'Public interest announcements, civic developments, and human interest', true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    description = EXCLUDED.description;

-- ------------------------------------------------------------------------------
-- 3. SEED SOURCES (Initial Vetted Publisher Directory)
-- ------------------------------------------------------------------------------
INSERT INTO public.sources (id, name, url, feed_url, region_id, category_id, tier, credibility_score, conglomerate_id, is_active)
VALUES
    ('the-hindu', 'The Hindu', 'https://www.thehindu.com', 'https://www.thehindu.com/news/national/feeder/default.rss', 'india', 'politics', 1, 0.95, 'kasturi-sons', true),
    ('the-hindu-tn', 'The Hindu (Tamil Nadu)', 'https://www.thehindu.com/news/national/tamil-nadu/', 'https://www.thehindu.com/news/national/tamil-nadu/feeder/default.rss', 'tamil-nadu', 'politics', 1, 0.95, 'kasturi-sons', true),
    ('toi', 'Times of India', 'https://timesofindia.indiatimes.com', 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms', 'india', 'politics', 2, 0.85, 'times-group', true),
    ('bbc-world', 'BBC News', 'https://www.bbc.com/news', 'https://feeds.bbci.co.uk/news/world/rss.xml', 'world', 'politics', 1, 0.95, 'bbc', true),
    ('reuters-world', 'Reuters', 'https://www.reuters.com', 'https://www.reutersagency.com/feed/?best-topics=world', 'world', 'business', 1, 0.95, 'thomson-reuters', true),
    ('economic-times', 'The Economic Times', 'https://economictimes.indiatimes.com', 'https://economictimes.indiatimes.com/rssfeedstopstories.cms', 'india', 'economy', 1, 0.90, 'times-group', true),
    ('dinamalar-tn', 'Dinamalar', 'https://www.dinamalar.com', 'https://rss.dinamalar.com/?cat=tamilnadu', 'tamil-nadu', 'politics', 2, 0.85, 'dinamalar-media', true),
    ('dinamani-tn', 'Dinamani', 'https://www.dinamani.com', 'https://www.dinamani.com/tamilnadu/rss', 'tamil-nadu', 'politics', 2, 0.85, 'express-group', true),
    ('techcrunch', 'TechCrunch', 'https://techcrunch.com', 'https://techcrunch.com/feed/', 'world', 'technology', 2, 0.85, 'yahoo', true),
    ('pib-india', 'Press Information Bureau (PIB)', 'https://pib.gov.in', 'https://pib.gov.in/rss/RssEnglish.aspx', 'india', 'politics', 1, 0.98, 'gov-india', true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    url = EXCLUDED.url,
    feed_url = EXCLUDED.feed_url,
    tier = EXCLUDED.tier,
    credibility_score = EXCLUDED.credibility_score;
