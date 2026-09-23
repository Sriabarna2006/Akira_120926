import { Source, SourceRegistryHealthSummary, SourceHealthStatus, SourceErrorType, FeedQuarantineRecord } from '../types/index.js';
import { query } from '../db/dbClient.js';
import { supabaseAdmin, isSupabaseConfigured } from '../db/supabase.js';

export interface SourceErrorLogEntry {
  id?: string;
  sourceId: string;
  errorType: SourceErrorType;
  errorMessage: string;
  httpStatus?: number;
  responseTimeMs: number;
  occurredAt: string;
}

// Vetted publisher directory matching 003_seed_data.sql & Phase 15-16 expansion
const DEFAULT_SOURCES: Source[] = [
  // --- REGIONAL (TAMIL NADU & SOUTH INDIA) ---
  { id: 'the-hindu-tn', name: 'The Hindu (Tamil Nadu)', url: 'https://www.thehindu.com/news/national/tamil-nadu/', feedUrl: 'https://www.thehindu.com/news/national/tamil-nadu/feeder/default.rss', regionId: 'tamil-nadu', categoryId: 'politics', country: 'India', language: 'en', tier: 1, credibilityScore: 0.95, conglomerateId: 'kasturi-sons', isActive: true, sourceType: 'REGIONAL', authorityLevel: 'REGIONAL_PRESS', consecutiveFailures: 0, healthStatus: 'HEALTHY', expectedFreshnessHours: 4, specialization: 'Tamil Nadu State Policy & Administration', failureCount: 0, updateFrequencyMinutes: 3, lastErrorType: 'NONE', quarantineStatus: 'ACTIVE', lastHttpStatus: 200, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'the-hindu-chennai', name: 'The Hindu (Chennai)', url: 'https://www.thehindu.com/news/cities/chennai/', feedUrl: 'https://www.thehindu.com/news/cities/chennai/feeder/default.rss', regionId: 'tamil-nadu', categoryId: 'infrastructure', country: 'India', language: 'en', tier: 1, credibilityScore: 0.95, conglomerateId: 'kasturi-sons', isActive: true, sourceType: 'REGIONAL', authorityLevel: 'REGIONAL_PRESS', consecutiveFailures: 0, healthStatus: 'HEALTHY', expectedFreshnessHours: 4, specialization: 'Chennai Metro & Transit Infrastructure', failureCount: 0, updateFrequencyMinutes: 3, lastErrorType: 'NONE', quarantineStatus: 'ACTIVE', lastHttpStatus: 200, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'oneindia-tamil', name: 'OneIndia Tamil', url: 'https://tamil.oneindia.com', feedUrl: 'https://tamil.oneindia.com/rss/tamil-news-fb.xml', regionId: 'tamil-nadu', categoryId: 'politics', country: 'India', language: 'ta', tier: 2, credibilityScore: 0.85, conglomerateId: 'greynium', isActive: true, sourceType: 'REGIONAL', authorityLevel: 'REGIONAL_PRESS', consecutiveFailures: 0, healthStatus: 'HEALTHY', expectedFreshnessHours: 4, specialization: 'Tamil Nadu Regional Reporting', failureCount: 0, updateFrequencyMinutes: 4, lastErrorType: 'NONE', quarantineStatus: 'ACTIVE', lastHttpStatus: 200, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'dinamalar-tn', name: 'Dinamalar', url: 'https://www.dinamalar.com', feedUrl: 'https://rss.dinamalar.com/?cat=tamilnadu', regionId: 'tamil-nadu', categoryId: 'politics', country: 'India', language: 'ta', tier: 2, credibilityScore: 0.85, conglomerateId: 'dinamalar-media', isActive: false, sourceType: 'REGIONAL', authorityLevel: 'REGIONAL_PRESS', consecutiveFailures: 5, healthStatus: 'DISABLED', expectedFreshnessHours: 4, lastErrorMessage: 'Publisher endpoint does not serve standard RSS XML (HTML/Script payload)', lastErrorType: 'XML_MALFORMED', quarantineStatus: 'QUARANTINED', lastHttpStatus: 200, specialization: 'Tamil Nadu Regional Reporting', failureCount: 5, updateFrequencyMinutes: 60, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'dinamani-tn', name: 'Dinamani', url: 'https://www.dinamani.com', feedUrl: 'https://www.dinamani.com/tamilnadu/rss', regionId: 'tamil-nadu', categoryId: 'politics', country: 'India', language: 'ta', tier: 2, credibilityScore: 0.85, conglomerateId: 'express-group', isActive: false, sourceType: 'REGIONAL', authorityLevel: 'REGIONAL_PRESS', consecutiveFailures: 5, healthStatus: 'DISABLED', expectedFreshnessHours: 4, lastErrorMessage: 'Publisher feed XML contains unescaped markup entities causing parser rejection', lastErrorType: 'XML_MALFORMED', quarantineStatus: 'QUARANTINED', lastHttpStatus: 200, specialization: 'Regional Administration & Civic Developments', failureCount: 5, updateFrequencyMinutes: 60, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'puthiya-thalaimurai', name: 'Puthiya Thalaimurai', url: 'https://www.puthiyathalaimurai.com', feedUrl: 'https://www.puthiyathalaimurai.com/rss', regionId: 'tamil-nadu', categoryId: 'politics', country: 'India', language: 'ta', tier: 2, credibilityScore: 0.84, conglomerateId: 'newgen-media', isActive: false, sourceType: 'REGIONAL', authorityLevel: 'REGIONAL_PRESS', consecutiveFailures: 5, healthStatus: 'DISABLED', expectedFreshnessHours: 4, lastErrorMessage: 'Publisher RSS endpoint discontinued (HTTP 404)', lastErrorType: 'HTTP_404', quarantineStatus: 'QUARANTINED', lastHttpStatus: 404, specialization: 'Tamil News & Public Interest', failureCount: 5, updateFrequencyMinutes: 60, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },

  // --- NATIONAL (INDIA GOVERNANCE, POLICY & ECONOMY) ---
  { id: 'the-hindu', name: 'The Hindu', url: 'https://www.thehindu.com', feedUrl: 'https://www.thehindu.com/news/national/feeder/default.rss', regionId: 'india', categoryId: 'politics', country: 'India', language: 'en', tier: 1, credibilityScore: 0.95, conglomerateId: 'kasturi-sons', isActive: true, sourceType: 'NATIONAL', authorityLevel: 'NATIONAL_PAPER', consecutiveFailures: 0, healthStatus: 'HEALTHY', expectedFreshnessHours: 3, specialization: 'National Affairs & Constitutional Policy', failureCount: 0, updateFrequencyMinutes: 3, lastErrorType: 'NONE', quarantineStatus: 'ACTIVE', lastHttpStatus: 200, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'indian-express', name: 'The Indian Express', url: 'https://indianexpress.com', feedUrl: 'https://indianexpress.com/section/india/feed/', regionId: 'india', categoryId: 'politics', country: 'India', language: 'en', tier: 1, credibilityScore: 0.94, conglomerateId: 'express-group', isActive: true, sourceType: 'NATIONAL', authorityLevel: 'NATIONAL_PAPER', consecutiveFailures: 0, healthStatus: 'HEALTHY', expectedFreshnessHours: 3, specialization: 'National Governance & Policy Analysis', failureCount: 0, updateFrequencyMinutes: 4, lastErrorType: 'NONE', quarantineStatus: 'ACTIVE', lastHttpStatus: 200, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'toi', name: 'Times of India', url: 'https://timesofindia.indiatimes.com', feedUrl: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms', regionId: 'india', categoryId: 'politics', country: 'India', language: 'en', tier: 2, credibilityScore: 0.85, conglomerateId: 'times-group', isActive: true, sourceType: 'NATIONAL', authorityLevel: 'NATIONAL_PAPER', consecutiveFailures: 0, healthStatus: 'HEALTHY', expectedFreshnessHours: 3, specialization: 'National Breaking Headlines', failureCount: 0, updateFrequencyMinutes: 3, lastErrorType: 'NONE', quarantineStatus: 'ACTIVE', lastHttpStatus: 200, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'economic-times', name: 'The Economic Times', url: 'https://economictimes.indiatimes.com', feedUrl: 'https://economictimes.indiatimes.com/rssfeedstopstories.cms', regionId: 'india', categoryId: 'economy', country: 'India', language: 'en', tier: 1, credibilityScore: 0.92, conglomerateId: 'times-group', isActive: true, sourceType: 'NATIONAL', authorityLevel: 'NATIONAL_PAPER', consecutiveFailures: 0, healthStatus: 'HEALTHY', expectedFreshnessHours: 3, specialization: 'Macroeconomics, Fiscal Policy & RBI Regulations', failureCount: 0, updateFrequencyMinutes: 3, lastErrorType: 'NONE', quarantineStatus: 'ACTIVE', lastHttpStatus: 200, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'livemint-economy', name: 'Livemint (Economy & Policy)', url: 'https://www.livemint.com', feedUrl: 'https://www.livemint.com/rss/economy', regionId: 'india', categoryId: 'economy', country: 'India', language: 'en', tier: 1, credibilityScore: 0.91, conglomerateId: 'ht-media', isActive: true, sourceType: 'NATIONAL', authorityLevel: 'NATIONAL_PAPER', consecutiveFailures: 0, healthStatus: 'HEALTHY', expectedFreshnessHours: 3, specialization: 'National Industrial Policy & Economic Indices', failureCount: 0, updateFrequencyMinutes: 4, lastErrorType: 'NONE', quarantineStatus: 'ACTIVE', lastHttpStatus: 200, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'pib-india', name: 'Press Information Bureau (PIB)', url: 'https://pib.gov.in', feedUrl: 'https://pib.gov.in/rss/RssEnglish.aspx', regionId: 'india', categoryId: 'politics', country: 'India', language: 'en', tier: 1, credibilityScore: 0.98, conglomerateId: 'gov-india', isActive: false, sourceType: 'GOVERNMENT', authorityLevel: 'OFFICIAL', consecutiveFailures: 5, healthStatus: 'DISABLED', expectedFreshnessHours: 3, lastErrorMessage: 'Endpoint blocks automated feed crawlers (HTTP 403/Forbidden)', lastErrorType: 'HTTP_403', quarantineStatus: 'QUARANTINED', lastHttpStatus: 403, specialization: 'Official Cabinet & Ministerial Disclosures', failureCount: 5, updateFrequencyMinutes: 60, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },

  // --- GLOBAL (GEOPOLITICS & INTERNATIONAL WIRES) ---
  { id: 'bbc-world', name: 'BBC News', url: 'https://www.bbc.com/news', feedUrl: 'https://feeds.bbci.co.uk/news/world/rss.xml', regionId: 'world', categoryId: 'politics', country: 'UK', language: 'en', tier: 1, credibilityScore: 0.95, conglomerateId: 'bbc', isActive: true, sourceType: 'WIRE', authorityLevel: 'TIER1_WIRE', consecutiveFailures: 0, healthStatus: 'HEALTHY', expectedFreshnessHours: 3, specialization: 'Global Geopolitics & Multilateral Accords', failureCount: 0, updateFrequencyMinutes: 3, lastErrorType: 'NONE', quarantineStatus: 'ACTIVE', lastHttpStatus: 200, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'aljazeera-world', name: 'Al Jazeera (World)', url: 'https://www.aljazeera.com', feedUrl: 'https://www.aljazeera.com/xml/rss/all.xml', regionId: 'world', categoryId: 'politics', country: 'Qatar', language: 'en', tier: 1, credibilityScore: 0.93, conglomerateId: 'aljazeera-media', isActive: true, sourceType: 'WIRE', authorityLevel: 'TIER1_WIRE', consecutiveFailures: 0, healthStatus: 'HEALTHY', expectedFreshnessHours: 3, specialization: 'Global Conflict, Diplomatic Summits & Global South Coverage', failureCount: 0, updateFrequencyMinutes: 3, lastErrorType: 'NONE', quarantineStatus: 'ACTIVE', lastHttpStatus: 200, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'dw-world', name: 'Deutsche Welle (World)', url: 'https://www.dw.com', feedUrl: 'https://rss.dw.com/xml/rss-en-all', regionId: 'world', categoryId: 'politics', country: 'Germany', language: 'en', tier: 1, credibilityScore: 0.94, conglomerateId: 'dw-media', isActive: true, sourceType: 'WIRE', authorityLevel: 'TIER1_WIRE', consecutiveFailures: 0, healthStatus: 'HEALTHY', expectedFreshnessHours: 4, specialization: 'European Union Geopolitics & Global International Affairs', failureCount: 0, updateFrequencyMinutes: 4, lastErrorType: 'NONE', quarantineStatus: 'ACTIVE', lastHttpStatus: 200, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'france24-en', name: 'France 24', url: 'https://www.france24.com', feedUrl: 'https://www.france24.com/en/rss', regionId: 'world', categoryId: 'politics', country: 'France', language: 'en', tier: 1, credibilityScore: 0.93, conglomerateId: 'france-medias', isActive: true, sourceType: 'WIRE', authorityLevel: 'TIER1_WIRE', consecutiveFailures: 0, healthStatus: 'HEALTHY', expectedFreshnessHours: 4, specialization: 'International Diplomacy, European & African Affairs', failureCount: 0, updateFrequencyMinutes: 4, lastErrorType: 'NONE', quarantineStatus: 'ACTIVE', lastHttpStatus: 200, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'reuters-world', name: 'Reuters', url: 'https://www.reuters.com', feedUrl: 'https://www.reutersagency.com/feed/?best-topics=world', regionId: 'world', categoryId: 'business', country: 'UK', language: 'en', tier: 1, credibilityScore: 0.96, conglomerateId: 'thomson-reuters', isActive: false, sourceType: 'WIRE', authorityLevel: 'TIER1_WIRE', consecutiveFailures: 5, healthStatus: 'DISABLED', expectedFreshnessHours: 3, lastErrorMessage: 'Public RSS feed discontinued by Thomson Reuters (HTTP 404)', lastErrorType: 'HTTP_404', quarantineStatus: 'QUARANTINED', lastHttpStatus: 404, specialization: 'International Markets & Diplomatic Wires', failureCount: 5, updateFrequencyMinutes: 60, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'un-news', name: 'UN News', url: 'https://news.un.org', feedUrl: 'https://news.un.org/feed/subscribe/en/news/all/rss.xml', regionId: 'world', categoryId: 'politics', country: 'Global', language: 'en', tier: 1, credibilityScore: 0.96, conglomerateId: 'un-system', isActive: false, sourceType: 'WIRE', authorityLevel: 'OFFICIAL', consecutiveFailures: 5, healthStatus: 'DISABLED', expectedFreshnessHours: 6, lastErrorMessage: 'Configured feed subscription URL returned HTTP 404', lastErrorType: 'HTTP_404', quarantineStatus: 'QUARANTINED', lastHttpStatus: 404, specialization: 'International Law, Humanitarian & Climate Treaties', failureCount: 5, updateFrequencyMinutes: 60, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },

  // --- SPECIALIST (AI, CYBERSECURITY, SCIENCE & CLIMATE) ---
  { id: 'mit-tech-review', name: 'MIT Technology Review', url: 'https://www.technologyreview.com', feedUrl: 'https://www.technologyreview.com/feed/', regionId: 'world', categoryId: 'technology', country: 'US', language: 'en', tier: 1, credibilityScore: 0.96, conglomerateId: 'mit', isActive: true, sourceType: 'SPECIALIST', authorityLevel: 'PEER_REVIEWED', consecutiveFailures: 0, healthStatus: 'HEALTHY', expectedFreshnessHours: 6, specialization: 'Frontier AI, Biotech & Clean Computing', failureCount: 0, updateFrequencyMinutes: 6, lastErrorType: 'NONE', quarantineStatus: 'ACTIVE', lastHttpStatus: 200, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'arxiv-ai', name: 'ArXiv (CS.AI Frontiers)', url: 'https://arxiv.org', feedUrl: 'https://rss.arxiv.org/rss/cs.AI', regionId: 'world', categoryId: 'technology', country: 'US', language: 'en', tier: 1, credibilityScore: 0.97, conglomerateId: 'cornell-university', isActive: true, sourceType: 'SPECIALIST', authorityLevel: 'PEER_REVIEWED', consecutiveFailures: 0, healthStatus: 'HEALTHY', expectedFreshnessHours: 12, specialization: 'Peer AI Research & Algorithm Architectures', failureCount: 0, updateFrequencyMinutes: 12, lastErrorType: 'NONE', quarantineStatus: 'ACTIVE', lastHttpStatus: 200, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'techcrunch', name: 'TechCrunch', url: 'https://techcrunch.com', feedUrl: 'https://techcrunch.com/feed/', regionId: 'world', categoryId: 'technology', country: 'US', language: 'en', tier: 2, credibilityScore: 0.87, conglomerateId: 'yahoo', isActive: true, sourceType: 'SPECIALIST', authorityLevel: 'SPECIALIST', consecutiveFailures: 0, healthStatus: 'HEALTHY', expectedFreshnessHours: 3, specialization: 'Startups, Venture Deals & Tech Ecosystem', failureCount: 0, updateFrequencyMinutes: 4, lastErrorType: 'NONE', quarantineStatus: 'ACTIVE', lastHttpStatus: 200, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'the-verge', name: 'The Verge', url: 'https://www.theverge.com', feedUrl: 'https://www.theverge.com/rss/index.xml', regionId: 'world', categoryId: 'technology', country: 'US', language: 'en', tier: 2, credibilityScore: 0.86, conglomerateId: 'vox-media', isActive: true, sourceType: 'SPECIALIST', authorityLevel: 'SPECIALIST', consecutiveFailures: 0, healthStatus: 'HEALTHY', expectedFreshnessHours: 4, specialization: 'Consumer Electronics & Digital Platforms', failureCount: 0, updateFrequencyMinutes: 4, lastErrorType: 'NONE', quarantineStatus: 'ACTIVE', lastHttpStatus: 200, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'bleepingcomputer', name: 'BleepingComputer', url: 'https://www.bleepingcomputer.com', feedUrl: 'https://www.bleepingcomputer.com/feed/', regionId: 'world', categoryId: 'security', country: 'US', language: 'en', tier: 1, credibilityScore: 0.93, conglomerateId: 'bleeping-computer', isActive: true, sourceType: 'SPECIALIST', authorityLevel: 'SPECIALIST', consecutiveFailures: 0, healthStatus: 'HEALTHY', expectedFreshnessHours: 4, specialization: 'Zero-Day Threats, CVE Advisories & Ransomware', failureCount: 0, updateFrequencyMinutes: 4, lastErrorType: 'NONE', quarantineStatus: 'ACTIVE', lastHttpStatus: 200, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'sciencedaily', name: 'ScienceDaily', url: 'https://www.sciencedaily.com', feedUrl: 'https://www.sciencedaily.com/rss/top/science.xml', regionId: 'world', categoryId: 'science', country: 'US', language: 'en', tier: 1, credibilityScore: 0.95, conglomerateId: 'sciencedaily', isActive: true, sourceType: 'SPECIALIST', authorityLevel: 'PEER_REVIEWED', consecutiveFailures: 0, healthStatus: 'HEALTHY', expectedFreshnessHours: 6, specialization: 'Peer-Reviewed Scientific Discoveries', failureCount: 0, updateFrequencyMinutes: 6, lastErrorType: 'NONE', quarantineStatus: 'ACTIVE', lastHttpStatus: 200, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'sciencedaily-earth', name: 'ScienceDaily (Earth & Climate)', url: 'https://www.sciencedaily.com', feedUrl: 'https://www.sciencedaily.com/rss/earth_climate.xml', regionId: 'world', categoryId: 'environment', country: 'US', language: 'en', tier: 1, credibilityScore: 0.94, conglomerateId: 'sciencedaily', isActive: true, sourceType: 'SPECIALIST', authorityLevel: 'PEER_REVIEWED', consecutiveFailures: 0, healthStatus: 'HEALTHY', expectedFreshnessHours: 6, specialization: 'Earth Climate Science & Environmental Resilience', failureCount: 0, updateFrequencyMinutes: 6, lastErrorType: 'NONE', quarantineStatus: 'ACTIVE', lastHttpStatus: 200, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'the-guardian-env', name: 'The Guardian (Environment)', url: 'https://www.theguardian.com/environment', feedUrl: 'https://www.theguardian.com/environment/rss', regionId: 'world', categoryId: 'environment', country: 'UK', language: 'en', tier: 1, credibilityScore: 0.93, conglomerateId: 'guardian-media', isActive: true, sourceType: 'SPECIALIST', authorityLevel: 'TIER1_WIRE', consecutiveFailures: 0, healthStatus: 'HEALTHY', expectedFreshnessHours: 4, specialization: 'Global Climate Policy, Biodiversity & Energy Transition', failureCount: 0, updateFrequencyMinutes: 4, lastErrorType: 'NONE', quarantineStatus: 'ACTIVE', lastHttpStatus: 200, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'nasa-news', name: 'NASA Breaking News', url: 'https://www.nasa.gov', feedUrl: 'https://www.nasa.gov/rss/dyn/breaking_news.rss', regionId: 'world', categoryId: 'science', country: 'US', language: 'en', tier: 1, credibilityScore: 0.98, conglomerateId: 'gov-usa', isActive: true, sourceType: 'GOVERNMENT', authorityLevel: 'OFFICIAL', consecutiveFailures: 0, healthStatus: 'HEALTHY', expectedFreshnessHours: 6, specialization: 'Space Science, Propulsion & Astrophysics', failureCount: 0, updateFrequencyMinutes: 6, lastErrorType: 'NONE', quarantineStatus: 'ACTIVE', lastHttpStatus: 200, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'down-to-earth', name: 'Down To Earth (Environment)', url: 'https://www.downtoearth.org.in', feedUrl: 'https://www.downtoearth.org.in/rss/all', regionId: 'india', categoryId: 'environment', country: 'India', language: 'en', tier: 1, credibilityScore: 0.94, conglomerateId: 'cse-india', isActive: false, sourceType: 'SPECIALIST', authorityLevel: 'SPECIALIST', consecutiveFailures: 5, healthStatus: 'DISABLED', expectedFreshnessHours: 6, lastErrorMessage: 'Publisher feed endpoint returned HTTP 404', lastErrorType: 'HTTP_404', quarantineStatus: 'QUARANTINED', lastHttpStatus: 404, specialization: 'Ecological Policy, Renewable Energy & Climate Science', failureCount: 5, updateFrequencyMinutes: 60, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },

  // --- MULTI-DOMAIN SPECIALIST EXPANSION (HEALTH, SPORTS, EDUCATION, ENERGY, BUSINESS) ---
  { id: 'sciencedaily-health', name: 'ScienceDaily (Health & Medicine)', url: 'https://www.sciencedaily.com/news/health_medicine/', feedUrl: 'https://www.sciencedaily.com/rss/health_medicine.xml', regionId: 'world', categoryId: 'health', country: 'US', language: 'en', tier: 1, credibilityScore: 0.95, conglomerateId: 'sciencedaily', isActive: true, sourceType: 'SPECIALIST', authorityLevel: 'PEER_REVIEWED', consecutiveFailures: 0, healthStatus: 'HEALTHY', expectedFreshnessHours: 6, specialization: 'Clinical Medicine, Public Health & Therapeutics', failureCount: 0, updateFrequencyMinutes: 6, lastErrorType: 'NONE', quarantineStatus: 'ACTIVE', lastHttpStatus: 200, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'the-hindu-sport', name: 'The Hindu (Sport)', url: 'https://www.thehindu.com/sport/', feedUrl: 'https://www.thehindu.com/sport/feeder/default.rss', regionId: 'india', categoryId: 'sports', country: 'India', language: 'en', tier: 1, credibilityScore: 0.94, conglomerateId: 'kasturi-sons', isActive: true, sourceType: 'NATIONAL', authorityLevel: 'NATIONAL_PAPER', consecutiveFailures: 0, healthStatus: 'HEALTHY', expectedFreshnessHours: 4, specialization: 'Cricket, International Tournaments & Indian Athletics', failureCount: 0, updateFrequencyMinutes: 4, lastErrorType: 'NONE', quarantineStatus: 'ACTIVE', lastHttpStatus: 200, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'indian-express-education', name: 'The Indian Express (Education)', url: 'https://indianexpress.com/section/education/', feedUrl: 'https://indianexpress.com/section/education/feed/', regionId: 'india', categoryId: 'education', country: 'India', language: 'en', tier: 1, credibilityScore: 0.93, conglomerateId: 'express-group', isActive: true, sourceType: 'NATIONAL', authorityLevel: 'NATIONAL_PAPER', consecutiveFailures: 0, healthStatus: 'HEALTHY', expectedFreshnessHours: 6, specialization: 'Higher Education, Competitive Exams & Academic Policy', failureCount: 0, updateFrequencyMinutes: 6, lastErrorType: 'NONE', quarantineStatus: 'ACTIVE', lastHttpStatus: 200, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'economic-times-energy', name: 'The Economic Times (Energy & Power)', url: 'https://economictimes.indiatimes.com/industry/energy', feedUrl: 'https://economictimes.indiatimes.com/industry/energy/rssfeedstopstories.cms', regionId: 'india', categoryId: 'energy', country: 'India', language: 'en', tier: 1, credibilityScore: 0.92, conglomerateId: 'times-group', isActive: true, sourceType: 'NATIONAL', authorityLevel: 'NATIONAL_PAPER', consecutiveFailures: 0, healthStatus: 'HEALTHY', expectedFreshnessHours: 4, specialization: 'Power Grid, Renewable Transition & Hydrocarbons', failureCount: 0, updateFrequencyMinutes: 4, lastErrorType: 'NONE', quarantineStatus: 'ACTIVE', lastHttpStatus: 200, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'bbc-business', name: 'BBC News (Business & Economy)', url: 'https://www.bbc.com/news/business', feedUrl: 'https://feeds.bbci.co.uk/news/business/rss.xml', regionId: 'world', categoryId: 'business', country: 'UK', language: 'en', tier: 1, credibilityScore: 0.95, conglomerateId: 'bbc', isActive: true, sourceType: 'WIRE', authorityLevel: 'TIER1_WIRE', consecutiveFailures: 0, healthStatus: 'HEALTHY', expectedFreshnessHours: 4, specialization: 'Global Trade, Central Banks & Corporate Finance', failureCount: 0, updateFrequencyMinutes: 4, lastErrorType: 'NONE', quarantineStatus: 'ACTIVE', lastHttpStatus: 200, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'bbc-technology', name: 'BBC News (Technology)', url: 'https://www.bbc.com/news/technology', feedUrl: 'https://feeds.bbci.co.uk/news/technology/rss.xml', regionId: 'world', categoryId: 'technology', country: 'UK', language: 'en', tier: 1, credibilityScore: 0.95, conglomerateId: 'bbc', isActive: true, sourceType: 'WIRE', authorityLevel: 'TIER1_WIRE', consecutiveFailures: 0, healthStatus: 'HEALTHY', expectedFreshnessHours: 4, specialization: 'Global Tech Regulation, Cyber Infrastructure & Platforms', failureCount: 0, updateFrequencyMinutes: 4, lastErrorType: 'NONE', quarantineStatus: 'ACTIVE', lastHttpStatus: 200, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
];

let inMemorySources: Source[] = [...DEFAULT_SOURCES];
let inMemoryErrorLogs: SourceErrorLogEntry[] = [];
let inMemoryQuarantine: Map<string, FeedQuarantineRecord> = new Map();

export interface SourceFilterParams {
  regionId?: string;
  categoryId?: string;
  tier?: number;
  healthStatus?: SourceHealthStatus;
  includeInactive?: boolean;
}

export class SourceRepository {
  /**
   * Computes source health status dynamically based on operational signals.
   */
  public static calculateHealthStatus(source: Source): SourceHealthStatus {
    if (!source.isActive) return 'DISABLED';
    if (source.quarantineStatus === 'QUARANTINED') return 'QUARANTINED';

    const consecutiveFails = source.consecutiveFailures || 0;
    if (consecutiveFails >= 5) return 'FAILING';

    const now = Date.now();
    const freshnessThresholdHours = source.expectedFreshnessHours || 6;
    const lastSuccessMs = source.lastSuccessfulFetch ? new Date(source.lastSuccessfulFetch).getTime() : 0;
    const isStale = lastSuccessMs > 0 && (now - lastSuccessMs) > (freshnessThresholdHours * 3600 * 1000);

    if (isStale) return 'STALE';
    if (consecutiveFails > 0) return 'DEGRADED';
    return 'HEALTHY';
  }

  static async findAll(params: SourceFilterParams = {}): Promise<Source[]> {
    const { regionId, categoryId, tier, healthStatus, includeInactive = false } = params;

    try {
      const conditions: string[] = [];
      const values: any[] = [];
      let idx = 1;

      if (!includeInactive) {
        conditions.push(`is_active = true`);
      }
      if (regionId) {
        conditions.push(`region_id = $${idx++}`);
        values.push(regionId);
      }
      if (categoryId) {
        conditions.push(`category_id = $${idx++}`);
        values.push(categoryId);
      }
      if (tier) {
        conditions.push(`tier = $${idx++}`);
        values.push(tier);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const sql = `
        SELECT 
          id, name, url, feed_url AS "feedUrl", region_id AS "regionId", 
          category_id AS "categoryId", country, language, tier, credibility_score AS "credibilityScore", 
          conglomerate_id AS "conglomerateId", is_active AS "isActive", 
          source_type AS "sourceType", authority_level AS "authorityLevel",
          consecutive_failures AS "consecutiveFailures", health_status AS "healthStatus",
          expected_freshness_hours AS "expectedFreshnessHours",
          last_successful_fetch AS "lastSuccessfulFetch", last_failed_fetch AS "lastFailedFetch", 
          last_error_message AS "lastErrorMessage", last_error_type AS "lastErrorType",
          quarantine_status AS "quarantineStatus", last_http_status AS "lastHttpStatus",
          articles_ingested_count AS "articlesIngestedCount",
          events_produced_count AS "eventsProducedCount", response_time_ms AS "responseTimeMs",
          failure_count AS "failureCount", update_frequency_minutes AS "updateFrequencyMinutes", 
          created_at AS "createdAt", updated_at AS "updatedAt"
        FROM public.sources
        ${whereClause}
        ORDER BY tier ASC, name ASC;
      `;
      const res = await query<Source>(sql, values);
      if (res.rows && res.rows.length > 0) {
        return res.rows.map((s) => ({
          ...s,
          healthStatus: this.calculateHealthStatus(s),
        }));
      }
    } catch (err) {
      console.warn('[SourceRepository] DB query failed, using fallback:', (err as Error).message);
    }

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        let q = supabaseAdmin.from('sources').select('*');
        if (!includeInactive) q = q.eq('is_active', true);
        if (regionId) q = q.eq('region_id', regionId);
        if (categoryId) q = q.eq('category_id', categoryId);
        if (tier) q = q.eq('tier', tier);

        const { data, error } = await q.order('tier', { ascending: true });
        if (!error && data && data.length > 0) {
          return data.map((s) => {
            const mapped: Source = {
              id: s.id,
              name: s.name,
              url: s.url,
              feedUrl: s.feed_url,
              regionId: s.region_id,
              categoryId: s.category_id,
              country: s.country || 'Global',
              language: s.language || 'en',
              tier: s.tier,
              credibilityScore: s.credibility_score,
              conglomerateId: s.conglomerate_id,
              isActive: s.is_active,
              sourceType: s.source_type || 'NATIONAL',
              authorityLevel: s.authority_level || 'SPECIALIST',
              consecutiveFailures: s.consecutive_failures || 0,
              healthStatus: s.health_status || 'HEALTHY',
              expectedFreshnessHours: s.expected_freshness_hours || 6,
              lastSuccessfulFetch: s.last_successful_fetch,
              lastFailedFetch: s.last_failed_fetch,
              lastErrorMessage: s.last_error_message,
              lastErrorType: s.last_error_type || 'NONE',
              quarantineStatus: s.quarantine_status || 'ACTIVE',
              lastHttpStatus: s.last_http_status || 200,
              articlesIngestedCount: s.articles_ingested_count || 0,
              eventsProducedCount: s.events_produced_count || 0,
              responseTimeMs: s.response_time_ms || 0,
              failureCount: s.failure_count || 0,
              updateFrequencyMinutes: s.update_frequency_minutes || 3,
              createdAt: s.created_at,
              updatedAt: s.updated_at,
            };
            return {
              ...mapped,
              healthStatus: this.calculateHealthStatus(mapped),
            };
          });
        }
      } catch (err) {
        console.warn('[SourceRepository] Supabase query notice:', (err as Error).message);
      }
    }

    let results = inMemorySources.map((s) => ({
      ...s,
      healthStatus: this.calculateHealthStatus(s),
    }));

    if (!includeInactive) results = results.filter((s) => s.isActive);
    if (regionId) results = results.filter((s) => s.regionId === regionId);
    if (categoryId) results = results.filter((s) => s.categoryId === categoryId);
    if (tier) results = results.filter((s) => s.tier === tier);
    if (healthStatus) results = results.filter((s) => s.healthStatus === healthStatus);
    return results;
  }

  static async findById(id: string): Promise<Source | null> {
    try {
      const sql = `
        SELECT 
          id, name, url, feed_url AS "feedUrl", region_id AS "regionId", 
          category_id AS "categoryId", country, language, tier, credibility_score AS "credibilityScore", 
          conglomerate_id AS "conglomerateId", is_active AS "isActive", 
          source_type AS "sourceType", authority_level AS "authorityLevel",
          consecutive_failures AS "consecutiveFailures", health_status AS "healthStatus",
          expected_freshness_hours AS "expectedFreshnessHours",
          last_successful_fetch AS "lastSuccessfulFetch", last_failed_fetch AS "lastFailedFetch", 
          last_error_message AS "lastErrorMessage", last_error_type AS "lastErrorType",
          quarantine_status AS "quarantineStatus", last_http_status AS "lastHttpStatus",
          articles_ingested_count AS "articlesIngestedCount",
          events_produced_count AS "eventsProducedCount", response_time_ms AS "responseTimeMs",
          failure_count AS "failureCount", update_frequency_minutes AS "updateFrequencyMinutes", 
          created_at AS "createdAt", updated_at AS "updatedAt"
        FROM public.sources
        WHERE id = $1
        LIMIT 1;
      `;
      const res = await query<Source>(sql, [id]);
      if (res.rows && res.rows.length > 0) {
        const s = res.rows[0];
        return {
          ...s,
          healthStatus: this.calculateHealthStatus(s),
        };
      }
    } catch (err) {
      console.warn('[SourceRepository] DB findById error:', (err as Error).message);
    }

    const found = inMemorySources.find((s) => s.id === id);
    if (found) {
      return {
        ...found,
        healthStatus: this.calculateHealthStatus(found),
      };
    }
    return null;
  }

  static async create(source: Omit<Source, 'createdAt' | 'updatedAt'>): Promise<Source> {
    const rawScore = typeof source.credibilityScore === 'number' ? source.credibilityScore : 0.85;
    const normalizedScore = rawScore > 1.0 ? Math.min(1.0, Math.max(0.0, rawScore / 100)) : Math.min(1.0, Math.max(0.0, rawScore));

    const newSource: Source = {
      ...source,
      credibilityScore: normalizedScore,
      country: source.country || 'Global',
      language: source.language || 'en',
      sourceType: source.sourceType || 'NATIONAL',
      authorityLevel: source.authorityLevel || 'SPECIALIST',
      consecutiveFailures: source.consecutiveFailures || 0,
      healthStatus: source.healthStatus || 'HEALTHY',
      expectedFreshnessHours: source.expectedFreshnessHours || 6,
      articlesIngestedCount: source.articlesIngestedCount || 0,
      eventsProducedCount: source.eventsProducedCount || 0,
      responseTimeMs: source.responseTimeMs || 0,
      lastErrorType: source.lastErrorType || 'NONE',
      quarantineStatus: source.quarantineStatus || 'ACTIVE',
      lastHttpStatus: source.lastHttpStatus || 200,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const sql = `
        INSERT INTO public.sources (
          id, name, url, feed_url, region_id, category_id, country, language, tier, 
          credibility_score, conglomerate_id, is_active, source_type, authority_level,
          consecutive_failures, health_status, expected_freshness_hours, specialization, 
          update_frequency_minutes, last_error_type, quarantine_status, last_http_status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          url = EXCLUDED.url,
          feed_url = EXCLUDED.feed_url,
          region_id = EXCLUDED.region_id,
          category_id = EXCLUDED.category_id,
          country = EXCLUDED.country,
          language = EXCLUDED.language,
          tier = EXCLUDED.tier,
          credibility_score = EXCLUDED.credibility_score,
          is_active = EXCLUDED.is_active,
          source_type = EXCLUDED.source_type,
          authority_level = EXCLUDED.authority_level,
          specialization = EXCLUDED.specialization,
          last_error_type = EXCLUDED.last_error_type,
          quarantine_status = EXCLUDED.quarantine_status,
          last_http_status = EXCLUDED.last_http_status,
          updated_at = NOW()
        RETURNING 
          id, name, url, feed_url AS "feedUrl", region_id AS "regionId", 
          category_id AS "categoryId", country, language, tier, credibility_score AS "credibilityScore", 
          conglomerate_id AS "conglomerateId", is_active AS "isActive", 
          source_type AS "sourceType", authority_level AS "authorityLevel",
          consecutive_failures AS "consecutiveFailures", health_status AS "healthStatus",
          expected_freshness_hours AS "expectedFreshnessHours",
          last_successful_fetch AS "lastSuccessfulFetch", last_failed_fetch AS "lastFailedFetch", 
          last_error_message AS "lastErrorMessage", last_error_type AS "lastErrorType",
          quarantine_status AS "quarantineStatus", last_http_status AS "lastHttpStatus",
          articles_ingested_count AS "articlesIngestedCount",
          events_produced_count AS "eventsProducedCount", response_time_ms AS "responseTimeMs",
          failure_count AS "failureCount", update_frequency_minutes AS "updateFrequencyMinutes", 
          created_at AS "createdAt", updated_at AS "updatedAt";
      `;
      const res = await query<Source>(sql, [
        newSource.id,
        newSource.name,
        newSource.url,
        newSource.feedUrl || null,
        newSource.regionId || null,
        newSource.categoryId || null,
        newSource.country,
        newSource.language,
        newSource.tier,
        newSource.credibilityScore,
        newSource.conglomerateId || null,
        newSource.isActive,
        newSource.sourceType,
        newSource.authorityLevel,
        newSource.consecutiveFailures,
        newSource.healthStatus,
        newSource.expectedFreshnessHours,
        newSource.specialization || null,
        newSource.updateFrequencyMinutes || 3,
        newSource.lastErrorType,
        newSource.quarantineStatus,
        newSource.lastHttpStatus,
      ]);
      if (res.rows && res.rows.length > 0) {
        return res.rows[0];
      }
    } catch (err) {
      console.warn('[SourceRepository] DB insert error:', (err as Error).message);
    }

    inMemorySources = inMemorySources.filter((s) => s.id !== newSource.id);
    inMemorySources.push(newSource);
    return newSource;
  }

  /**
   * Records a source fetch failure into source_error_logs and updates source health.
   */
  static async recordSourceError(
    sourceId: string,
    errorType: SourceErrorType,
    errorMessage: string,
    httpStatus: number = 0,
    responseTimeMs: number = 0
  ): Promise<void> {
    const now = new Date().toISOString();

    try {
      await query(
        `INSERT INTO public.source_error_logs (source_id, error_type, error_message, http_status, response_time_ms, occurred_at)
         VALUES ($1, $2, $3, $4, $5, $6);`,
        [sourceId, errorType, errorMessage, httpStatus, responseTimeMs, now]
      );
    } catch (err) {
      console.warn('[SourceRepository] Failed to insert source_error_logs:', (err as Error).message);
    }

    inMemoryErrorLogs.unshift({
      sourceId,
      errorType,
      errorMessage,
      httpStatus,
      responseTimeMs,
      occurredAt: now,
    });
    if (inMemoryErrorLogs.length > 200) {
      inMemoryErrorLogs.pop();
    }

    await this.updateSourceHealth(sourceId, {
      success: false,
      error: errorMessage,
      errorType,
      httpStatus,
      responseTimeMs,
    });
  }

  /**
   * Quarantines a source due to repeated or unrecoverable fetch errors.
   */
  static async quarantineSource(
    sourceId: string,
    reason: string,
    retryIntervalMinutes: number = 60
  ): Promise<void> {
    const now = new Date();
    const nextRetryAt = new Date(now.getTime() + retryIntervalMinutes * 60 * 1000).toISOString();

    try {
      await query(
        `INSERT INTO public.source_quarantine (source_id, quarantined_at, quarantine_reason, retry_interval_minutes, next_retry_at, consecutive_quarantine_count, updated_at)
         VALUES ($1, $2, $3, $4, $5, 1, $2)
         ON CONFLICT (source_id) DO UPDATE SET
           quarantined_at = EXCLUDED.quarantined_at,
           quarantine_reason = EXCLUDED.quarantine_reason,
           retry_interval_minutes = EXCLUDED.retry_interval_minutes,
           next_retry_at = EXCLUDED.next_retry_at,
           consecutive_quarantine_count = public.source_quarantine.consecutive_quarantine_count + 1,
           updated_at = NOW();`,
        [sourceId, now.toISOString(), reason, retryIntervalMinutes, nextRetryAt]
      );

      await query(
        `UPDATE public.sources SET quarantine_status = 'QUARANTINED', health_status = 'QUARANTINED', updated_at = NOW() WHERE id = $1;`,
        [sourceId]
      );
    } catch (err) {
      console.warn('[SourceRepository] DB quarantine error:', (err as Error).message);
    }

    const currentRecord = inMemoryQuarantine.get(sourceId);
    inMemoryQuarantine.set(sourceId, {
      sourceId,
      quarantinedAt: now.toISOString(),
      quarantineReason: reason,
      retryIntervalMinutes,
      nextRetryAt,
      consecutiveQuarantineCount: (currentRecord?.consecutiveQuarantineCount || 0) + 1,
    });

    const localSource = inMemorySources.find((s) => s.id === sourceId);
    if (localSource) {
      localSource.quarantineStatus = 'QUARANTINED';
      localSource.healthStatus = 'QUARANTINED';
      localSource.updatedAt = now.toISOString();
    }
  }

  /**
   * Restores a source from quarantine back to active probing state.
   */
  static async restoreFromQuarantine(sourceId: string): Promise<void> {
    try {
      await query(`DELETE FROM public.source_quarantine WHERE source_id = $1;`, [sourceId]);
      await query(
        `UPDATE public.sources SET quarantine_status = 'ACTIVE', consecutive_failures = 0, health_status = 'HEALTHY', updated_at = NOW() WHERE id = $1;`,
        [sourceId]
      );
    } catch (err) {
      console.warn('[SourceRepository] DB restore quarantine error:', (err as Error).message);
    }

    inMemoryQuarantine.delete(sourceId);
    const localSource = inMemorySources.find((s) => s.id === sourceId);
    if (localSource) {
      localSource.quarantineStatus = 'ACTIVE';
      localSource.consecutiveFailures = 0;
      localSource.healthStatus = 'HEALTHY';
      localSource.updatedAt = new Date().toISOString();
    }
  }

  /**
   * Get all currently quarantined sources
   */
  static async getQuarantinedSources(): Promise<FeedQuarantineRecord[]> {
    try {
      const res = await query<FeedQuarantineRecord>(`
        SELECT 
          source_id AS "sourceId",
          quarantined_at AS "quarantinedAt",
          quarantine_reason AS "quarantineReason",
          retry_interval_minutes AS "retryIntervalMinutes",
          next_retry_at AS "nextRetryAt",
          consecutive_quarantine_count AS "consecutiveQuarantineCount"
        FROM public.source_quarantine
        ORDER BY quarantined_at DESC;
      `);
      if (res.rows && res.rows.length > 0) {
        return res.rows;
      }
    } catch (err) {
      console.warn('[SourceRepository] DB getQuarantinedSources notice:', (err as Error).message);
    }

    return Array.from(inMemoryQuarantine.values());
  }

  /**
   * Updates source health, consecutive failures, response time, and ingested article counts.
   */
  static async updateSourceHealth(
    id: string,
    stats: {
      success: boolean;
      error?: string;
      errorType?: SourceErrorType;
      httpStatus?: number;
      articlesCount?: number;
      eventsCount?: number;
      responseTimeMs?: number;
    }
  ): Promise<void> {
    const now = new Date().toISOString();
    const {
      success,
      error,
      errorType = 'NONE',
      httpStatus = 200,
      articlesCount = 0,
      eventsCount = 0,
      responseTimeMs = 0,
    } = stats;

    try {
      if (success) {
        const sql = `
          UPDATE public.sources 
          SET 
            last_successful_fetch = $1, 
            consecutive_failures = 0,
            failure_count = 0, 
            last_error_message = NULL,
            last_error_type = 'NONE',
            last_http_status = $2,
            articles_ingested_count = articles_ingested_count + $3,
            events_produced_count = events_produced_count + $4,
            response_time_ms = $5,
            health_status = 'HEALTHY',
            quarantine_status = 'ACTIVE',
            updated_at = $1
          WHERE id = $6;
        `;
        await query(sql, [now, httpStatus, articlesCount, eventsCount, responseTimeMs, id]);
      } else {
        const sql = `
          UPDATE public.sources 
          SET 
            last_failed_fetch = $1, 
            consecutive_failures = consecutive_failures + 1,
            failure_count = failure_count + 1, 
            last_error_message = $2,
            last_error_type = $3,
            last_http_status = $4,
            response_time_ms = $5,
            health_status = CASE 
              WHEN consecutive_failures + 1 >= 5 THEN 'FAILING' 
              ELSE 'DEGRADED' 
            END,
            updated_at = $1
          WHERE id = $6;
        `;
        await query(sql, [now, error || 'Fetch error', errorType, httpStatus, responseTimeMs, id]);
      }
    } catch (err) {
      console.warn('[SourceRepository] updateSourceHealth DB error:', (err as Error).message);
    }

    const localSource = inMemorySources.find((s) => s.id === id);
    if (localSource) {
      if (success) {
        localSource.lastSuccessfulFetch = now;
        localSource.consecutiveFailures = 0;
        localSource.failureCount = 0;
        localSource.lastErrorMessage = undefined;
        localSource.lastErrorType = 'NONE';
        localSource.lastHttpStatus = httpStatus;
        localSource.articlesIngestedCount = (localSource.articlesIngestedCount || 0) + articlesCount;
        localSource.eventsProducedCount = (localSource.eventsProducedCount || 0) + eventsCount;
        localSource.responseTimeMs = responseTimeMs;
        localSource.healthStatus = 'HEALTHY';
        localSource.quarantineStatus = 'ACTIVE';
      } else {
        localSource.lastFailedFetch = now;
        localSource.consecutiveFailures = (localSource.consecutiveFailures || 0) + 1;
        localSource.failureCount = (localSource.failureCount || 0) + 1;
        localSource.lastErrorMessage = error;
        localSource.lastErrorType = errorType;
        localSource.lastHttpStatus = httpStatus;
        localSource.responseTimeMs = responseTimeMs;
        localSource.healthStatus = localSource.consecutiveFailures >= 5 ? 'FAILING' : 'DEGRADED';
      }
      localSource.updatedAt = now;
    }
  }

  /**
   * Compatibility wrapper for updateFetchStatus
   */
  static async updateFetchStatus(id: string, success: boolean, failureReason?: string): Promise<void> {
    return this.updateSourceHealth(id, { success, error: failureReason });
  }

  /**
   * Generates a comprehensive source health report for observability.
   */
  static async getSourceHealthReport(): Promise<SourceRegistryHealthSummary> {
    const sources = await this.findAll({ includeInactive: true });
    const now = Date.now();

    let healthy = 0;
    let degraded = 0;
    let stale = 0;
    let failing = 0;
    let disabled = 0;
    const staleList: SourceRegistryHealthSummary['staleSourceList'] = [];

    for (const source of sources) {
      const status = this.calculateHealthStatus(source);
      if (status === 'DISABLED' || status === 'QUARANTINED') disabled++;
      else if (status === 'FAILING') failing++;
      else if (status === 'STALE') stale++;
      else if (status === 'DEGRADED') degraded++;
      else healthy++;

      if (status === 'STALE' || status === 'FAILING' || status === 'QUARANTINED') {
        const lastSuccessMs = source.lastSuccessfulFetch ? new Date(source.lastSuccessfulFetch).getTime() : 0;
        const staleHours = lastSuccessMs > 0 ? (now - lastSuccessMs) / (3600 * 1000) : 999;
        staleList.push({
          id: source.id,
          name: source.name,
          lastSuccessfulFetch: source.lastSuccessfulFetch,
          staleDurationHours: Math.round(staleHours * 10) / 10,
          healthStatus: status,
        });
      }
    }

    return {
      totalSources: sources.length,
      activeSources: sources.filter((s) => s.isActive).length,
      healthySources: healthy,
      degradedSources: degraded,
      staleSources: stale,
      failingSources: failing,
      disabledSources: disabled,
      staleSourceList: staleList,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Identifies sources exceeding configured freshness thresholds.
   */
  static async findStaleSources(maxAgeHours: number = 6): Promise<Source[]> {
    const sources = await this.findAll({ includeInactive: false });
    const now = Date.now();

    return sources.filter((s) => {
      const threshold = s.expectedFreshnessHours || maxAgeHours;
      if (!s.lastSuccessfulFetch) return true;
      const ageHours = (now - new Date(s.lastSuccessfulFetch).getTime()) / (3600 * 1000);
      return ageHours > threshold;
    });
  }
}
