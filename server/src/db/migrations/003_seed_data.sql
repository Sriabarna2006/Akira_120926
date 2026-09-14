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
    ('the-hindu-chennai', 'The Hindu (Chennai)', 'https://www.thehindu.com/news/cities/chennai/', 'https://www.thehindu.com/news/cities/chennai/feeder/default.rss', 'tamil-nadu', 'infrastructure', 1, 0.95, 'kasturi-sons', true),
    ('toi', 'Times of India', 'https://timesofindia.indiatimes.com', 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms', 'india', 'politics', 2, 0.85, 'times-group', true),
    ('bbc-world', 'BBC News', 'https://www.bbc.com/news', 'https://feeds.bbci.co.uk/news/world/rss.xml', 'world', 'politics', 1, 0.95, 'bbc', true),
    ('reuters-world', 'Reuters', 'https://www.reuters.com', 'https://www.reutersagency.com/feed/?best-topics=world', 'world', 'business', 1, 0.95, 'thomson-reuters', true),
    ('economic-times', 'The Economic Times', 'https://economictimes.indiatimes.com', 'https://economictimes.indiatimes.com/rssfeedstopstories.cms', 'india', 'economy', 1, 0.90, 'times-group', true),
    ('dinamalar-tn', 'Dinamalar', 'https://www.dinamalar.com', 'https://rss.dinamalar.com/?cat=tamilnadu', 'tamil-nadu', 'politics', 2, 0.85, 'dinamalar-media', true),
    ('dinamani-tn', 'Dinamani', 'https://www.dinamani.com', 'https://www.dinamani.com/tamilnadu/rss', 'tamil-nadu', 'politics', 2, 0.85, 'express-group', true),
    ('techcrunch', 'TechCrunch', 'https://techcrunch.com', 'https://techcrunch.com/feed/', 'world', 'technology', 2, 0.85, 'yahoo', true),
    ('the-verge', 'The Verge', 'https://www.theverge.com', 'https://www.theverge.com/rss/index.xml', 'world', 'technology', 2, 0.85, 'vox-media', true),
    ('sciencedaily', 'ScienceDaily', 'https://www.sciencedaily.com', 'https://www.sciencedaily.com/rss/top/science.xml', 'world', 'science', 1, 0.95, 'sciencedaily', true),
    ('bleepingcomputer', 'BleepingComputer', 'https://www.bleepingcomputer.com', 'https://www.bleepingcomputer.com/feed/', 'world', 'security', 1, 0.92, 'bleeping-computer', true),
    ('pib-india', 'Press Information Bureau (PIB)', 'https://pib.gov.in', 'https://pib.gov.in/rss/RssEnglish.aspx', 'india', 'politics', 1, 0.98, 'gov-india', true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    url = EXCLUDED.url,
    feed_url = EXCLUDED.feed_url,
    tier = EXCLUDED.tier,
    credibility_score = EXCLUDED.credibility_score;

-- ------------------------------------------------------------------------------
-- 4. SEED SAMPLE DEVELOPMENT CANONICAL EVENTS (Clearly marked development data)
-- ------------------------------------------------------------------------------
INSERT INTO public.canonical_events (
    id, title, summary, region_id, category_id, urgency_label, 
    importance_score, velocity_score, final_rank_score, why_it_matters, 
    first_published_at, last_updated_at, source_count, lifecycle_status, metadata
)
VALUES
    (
        'evt_tn_ev_hub_2026',
        'Tamil Nadu Cabinet Clears Mega Infrastructure & Electric Mobility Corridor Policy',
        'State government approves capital investment framework expanding metro transit links across Chennai and Hosur EV manufacturing hub.',
        'tamil-nadu',
        'infrastructure',
        'IMPORTANT',
        94, 90, 96,
        'Accelerates high-speed regional transit corridors and strengthens clean mobility industrial employment in Tamil Nadu.',
        NOW() - INTERVAL '4 hours',
        NOW() - INTERVAL '1 hour',
        2,
        'OFFICIAL_CONFIRMATION',
        '{"is_dev_sample": true, "environment": "development"}'::jsonb
    ),
    (
        'evt_macro_rates_2026',
        'Reserve Bank of India & Global Central Banks Shift Monetary Policy Stance',
        'Major central banks announce calibrated interest rate adjustments to balance inflation reduction with economic growth targets.',
        'india',
        'economy',
        'IMPORTANT',
        92, 88, 94,
        'Directly shapes retail borrowing costs, investment decisions, and capital market valuations across sectors.',
        NOW() - INTERVAL '6 hours',
        NOW() - INTERVAL '2 hours',
        2,
        'OFFICIAL_CONFIRMATION',
        '{"is_dev_sample": true, "environment": "development"}'::jsonb
    ),
    (
        'evt_ai_semiconductor_2026',
        'Next-Generation Semiconductor Consortium Announces Global Fab Initiative',
        'Leading chipmakers and research universities unveil sub-2nm architectural standard for high-throughput AI accelerator silicon.',
        'world',
        'technology',
        'IMPORTANT',
        88, 82, 90,
        'Defines standard architectures for data center AI workloads and next-generation sovereign computing infrastructure.',
        NOW() - INTERVAL '8 hours',
        NOW() - INTERVAL '3 hours',
        2,
        'NEW_DEVELOPMENT',
        '{"is_dev_sample": true, "environment": "development"}'::jsonb
    )
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    summary = EXCLUDED.summary,
    region_id = EXCLUDED.region_id,
    category_id = EXCLUDED.category_id,
    why_it_matters = EXCLUDED.why_it_matters,
    final_rank_score = EXCLUDED.final_rank_score;

-- ------------------------------------------------------------------------------
-- 5. SEED SAMPLE DEVELOPMENT EVENT SOURCES
-- ------------------------------------------------------------------------------
INSERT INTO public.event_sources (id, event_id, source_id, source_name, title, url, snippet, published_at, tier)
VALUES
    (
        'a0000000-0000-0000-0000-000000000001',
        'evt_tn_ev_hub_2026',
        'the-hindu-tn',
        'The Hindu (Tamil Nadu)',
        'TN Cabinet gives nod to industrial corridor expansion and EV battery parks',
        'https://www.thehindu.com/news/national/tamil-nadu/ev-corridor-policy-2026',
        'The State Cabinet on Monday approved a dedicated infrastructure fund to boost EV manufacturing clusters in Hosur and Coimbatore.',
        NOW() - INTERVAL '4 hours',
        1
    ),
    (
        'a0000000-0000-0000-0000-000000000002',
        'evt_tn_ev_hub_2026',
        'toi',
        'Times of India',
        'Tamil Nadu launches multi-modal transit links for industrial hubs',
        'https://timesofindia.indiatimes.com/city/chennai/tn-transit-ev-policy-2026',
        'New rail and expressway linkages cleared to integrate industrial corridors across the state.',
        NOW() - INTERVAL '3 hours',
        2
    ),
    (
        'a0000000-0000-0000-0000-000000000003',
        'evt_macro_rates_2026',
        'economic-times',
        'The Economic Times',
        'RBI signals calibrated transition in monetary liquidity policy',
        'https://economictimes.indiatimes.com/news/economy/policy/rbi-monetary-policy-2026',
        'Central bank outlines steady glidepath for headline inflation while maintaining financial stability.',
        NOW() - INTERVAL '6 hours',
        1
    ),
    (
        'a0000000-0000-0000-0000-000000000004',
        'evt_ai_semiconductor_2026',
        'techcrunch',
        'TechCrunch',
        'Semiconductor giants form new alliance for sub-2nm AI accelerator hardware',
        'https://techcrunch.com/2026/09/12/sub-2nm-ai-hardware-consortium',
        'Consortium aims to standardize ultra-low latency optical interconnects for next-generation neural processors.',
        NOW() - INTERVAL '8 hours',
        2
    )
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    snippet = EXCLUDED.snippet;

-- ------------------------------------------------------------------------------
-- 6. SEED SAMPLE DEVELOPMENT ARTICLES
-- ------------------------------------------------------------------------------
INSERT INTO public.articles (
    id, source_id, event_id, title, url, content_snippet, published_at, region_id, category_id
)
VALUES
    (
        'art_tn_ev_hindu_01',
        'the-hindu-tn',
        'evt_tn_ev_hub_2026',
        'TN Cabinet gives nod to industrial corridor expansion and EV battery parks',
        'https://www.thehindu.com/news/national/tamil-nadu/ev-corridor-policy-2026',
        'The State Cabinet on Monday approved a dedicated infrastructure fund to boost EV manufacturing clusters in Hosur and Coimbatore.',
        NOW() - INTERVAL '4 hours',
        'tamil-nadu',
        'infrastructure'
    ),
    (
        'art_tn_ev_toi_01',
        'toi',
        'evt_tn_ev_hub_2026',
        'Tamil Nadu launches multi-modal transit links for industrial hubs',
        'https://timesofindia.indiatimes.com/city/chennai/tn-transit-ev-policy-2026',
        'New rail and expressway linkages cleared to integrate industrial corridors across the state.',
        NOW() - INTERVAL '3 hours',
        'tamil-nadu',
        'infrastructure'
    ),
    (
        'art_macro_et_01',
        'economic-times',
        'evt_macro_rates_2026',
        'RBI signals calibrated transition in monetary liquidity policy',
        'https://economictimes.indiatimes.com/news/economy/policy/rbi-monetary-policy-2026',
        'Central bank outlines steady glidepath for headline inflation while maintaining financial stability.',
        NOW() - INTERVAL '6 hours',
        'india',
        'economy'
    ),
    (
        'art_ai_tc_01',
        'techcrunch',
        'evt_ai_semiconductor_2026',
        'Semiconductor giants form new alliance for sub-2nm AI accelerator hardware',
        'https://techcrunch.com/2026/09/12/sub-2nm-ai-hardware-consortium',
        'Consortium aims to standardize ultra-low latency optical interconnects for next-generation neural processors.',
        NOW() - INTERVAL '8 hours',
        'world',
        'technology'
    )
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    content_snippet = EXCLUDED.content_snippet;
