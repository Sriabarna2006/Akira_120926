import Parser from 'rss-parser';

export type RegionType = 'Tamil Nadu' | 'India' | 'World';
export type ImportanceLabelType = 'BREAKING' | 'TRENDING' | 'IMPORTANT';

export interface CorroboratingSource {
  name: string;
  url: string;
  publishedAt: string;
  tier: number;
}

export interface CanonicalEvent {
  id: string;
  title: string;
  summary: string;
  region: RegionType;
  category: string;
  importanceLabel: ImportanceLabelType;
  importanceScore: number;
  trendScore: number;
  finalRankScore: number;
  whyItMatters: string;
  estimatedReadTime: string;
  relatedConcepts: string[];
  sources: CorroboratingSource[];
  firstPublishedAt: string;
  lastUpdatedAt: string;
  sourceCount: number;
}

interface FeedConfig {
  name: string;
  url: string;
  defaultRegion: RegionType;
  defaultCategory: string;
  tier: number;
}

const RSS_FEEDS: FeedConfig[] = [
  // 🇮🇳 Tamil Nadu (First-class state coverage)
  { name: 'The Hindu (Tamil Nadu)', url: 'https://www.thehindu.com/news/national/tamil-nadu/feeder/default.rss', defaultRegion: 'Tamil Nadu', defaultCategory: 'Government & Society', tier: 1 },
  { name: 'The Hindu (Chennai)', url: 'https://www.thehindu.com/news/cities/chennai/feeder/default.rss', defaultRegion: 'Tamil Nadu', defaultCategory: 'Government & Society', tier: 1 },

  // 🇮🇳 India National
  { name: 'The Hindu (National)', url: 'https://www.thehindu.com/news/national/feeder/default.rss', defaultRegion: 'India', defaultCategory: 'India', tier: 1 },
  { name: 'Indian Express', url: 'https://indianexpress.com/section/india/feed/', defaultRegion: 'India', defaultCategory: 'India', tier: 1 },
  { name: 'Economic Times (India)', url: 'https://economictimes.indiatimes.com/rssfeedstopstories.cms', defaultRegion: 'India', defaultCategory: 'Economy & Money', tier: 1 },

  // 🌍 World
  { name: 'BBC World', url: 'http://feeds.bbci.co.uk/news/world/rss.xml', defaultRegion: 'World', defaultCategory: 'World', tier: 1 },
  { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', defaultRegion: 'World', defaultCategory: 'World', tier: 1 },

  // 💻 AI & Technology
  { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', defaultRegion: 'World', defaultCategory: 'AI & Technology', tier: 1 },
  { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', defaultRegion: 'World', defaultCategory: 'AI & Technology', tier: 1 },
  { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', defaultRegion: 'World', defaultCategory: 'AI & Technology', tier: 2 },

  // 💰 Economy & Markets
  { name: 'CNBC Markets', url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114', defaultRegion: 'World', defaultCategory: 'Economy & Money', tier: 1 },

  // 🛡️ Cybersecurity & 🔬 Science
  { name: 'BleepingComputer', url: 'https://www.bleepingcomputer.com/feed/', defaultRegion: 'World', defaultCategory: 'Cybersecurity', tier: 1 },
  { name: 'ScienceDaily', url: 'https://www.sciencedaily.com/rss/top/science.xml', defaultRegion: 'World', defaultCategory: 'Science & Environment', tier: 1 },
];

class NewsIngestionService {
  private parser: Parser;
  private eventsMap: Map<string, CanonicalEvent> = new Map();
  private lastSyncTime: Date | null = null;
  private isSyncing = false;

  constructor() {
    this.parser = new Parser({
      timeout: 9000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      }
    });

    this.seedInitialEvents();
    this.syncAllFeeds().catch(err => console.warn('[NewsSync] Initial sync notice:', err.message));

    // Auto-refresh background polling every 3 minutes
    setInterval(() => {
      this.syncAllFeeds().catch(err => console.warn('[NewsSync] Auto-refresh notice:', err.message));
    }, 3 * 60 * 1000);
  }

  private cleanHtml(rawText?: string): string {
    if (!rawText) return '';
    return rawText
      .replace(/<[^>]*>?/gm, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private detectRegion(title: string, summary: string, defaultRegion: RegionType): RegionType {
    const text = `${title} ${summary}`.toLowerCase();

    // Specific Tamil Nadu keywords
    if (
      text.includes('tamil nadu') || 
      text.includes('chennai') || 
      text.includes('coimbatore') || 
      text.includes('madurai') || 
      text.includes('trichy') || 
      text.includes('salem') || 
      text.includes('tirunelveli') ||
      text.includes('stalin') ||
      text.includes('cmrl') ||
      text.includes('tangedco') ||
      text.includes('anna university') ||
      text.includes('madras')
    ) {
      return 'Tamil Nadu';
    }

    // Specific India national keywords
    if (
      text.includes('india') || 
      text.includes('delhi') || 
      text.includes('mumbai') || 
      text.includes('bengaluru') || 
      text.includes('hyderabad') || 
      text.includes('parliament') || 
      text.includes('supreme court of india') || 
      text.includes('rbi') || 
      text.includes('isro') || 
      text.includes('modi') ||
      text.includes('loksabha') ||
      text.includes('rajyasabha') ||
      text.includes('upi') ||
      text.includes('rupee')
    ) {
      return 'India';
    }

    return defaultRegion;
  }

  private detectCategory(title: string, summary: string, fallback: string): string {
    const text = `${title} ${summary}`.toLowerCase();

    if (text.includes('ai ') || text.includes('artificial intelligence') || text.includes('chip') || text.includes('semiconductor') || text.includes('model') || text.includes('llm') || text.includes('gpu') || text.includes('software')) {
      return 'AI & Technology';
    }
    if (text.includes('cyber') || text.includes('malware') || text.includes('hacker') || text.includes('vulnerability') || text.includes('breach') || text.includes('zero-day') || text.includes('ransomware')) {
      return 'Cybersecurity';
    }
    if (text.includes('inflation') || text.includes('interest rate') || text.includes('stock') || text.includes('gdp') || text.includes('economy') || text.includes('bank') || text.includes('rupee') || text.includes('dollar') || text.includes('market') || text.includes('budget')) {
      return 'Economy & Money';
    }
    if (text.includes('climate') || text.includes('carbon') || text.includes('space') || text.includes('isro') || text.includes('nasa') || text.includes('energy') || text.includes('monsoon') || text.includes('species') || text.includes('water')) {
      return 'Science & Environment';
    }
    if (text.includes('scheme') || text.includes('government') || text.includes('cabinet') || text.includes('court') || text.includes('police') || text.includes('policy') || text.includes('transport') || text.includes('metro') || text.includes('infrastructure')) {
      return 'Government & Society';
    }

    return fallback;
  }

  // Multi-source clustering: check if text matches an existing active event
  private findMatchingEvent(title: string, summary: string, region: RegionType): CanonicalEvent | null {
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length > 3);
    const incomingWords = new Set([...normalize(title), ...normalize(summary).slice(0, 10)]);

    for (const event of this.eventsMap.values()) {
      if (event.region !== region) continue;

      const eventWords = new Set([...normalize(event.title), ...normalize(event.summary).slice(0, 10)]);
      let intersection = 0;
      for (const word of incomingWords) {
        if (eventWords.has(word)) intersection++;
      }

      const union = new Set([...incomingWords, ...eventWords]).size;
      const jaccard = union > 0 ? intersection / union : 0;

      // Match threshold: > 0.40 word overlap within 18 hours
      const timeDiff = Math.abs(Date.now() - new Date(event.firstPublishedAt).getTime());
      if (jaccard >= 0.40 && timeDiff <= 18 * 3600 * 1000) {
        return event;
      }
    }
    return null;
  }

  private calculateScores(
    title: string,
    summary: string,
    region: RegionType,
    publishedAt: string,
    sourceCount: number
  ): { importanceLabel: ImportanceLabelType; importanceScore: number; trendScore: number; finalRankScore: number; whyItMatters: string; concepts: string[] } {
    const text = `${title} ${summary}`.toLowerCase();
    const hoursAgo = Math.max(0, (Date.now() - new Date(publishedAt).getTime()) / 3600000);

    // 1. Recency Decay (halving every 9 hours)
    const recencyScore = Math.max(10, Math.min(100, Math.round(100 * Math.exp(-0.08 * hoursAgo))));

    // 2. Systemic Importance Score (0 to 100)
    let importanceScore = 45;
    const concepts: string[] = [];

    if (text.includes('scheme') || text.includes('cabinet') || text.includes('metro') || text.includes('infrastructure') || text.includes('budget')) {
      importanceScore += 25;
      concepts.push('Public Policy', 'State Infrastructure', 'Civic Administration');
    }
    if (text.includes('inflation') || text.includes('interest rate') || text.includes('monetary policy') || text.includes('repo')) {
      importanceScore += 30;
      concepts.push('Inflation', 'Monetary Policy', 'Interest Rates');
    }
    if (text.includes('zero-day') || text.includes('critical vulnerability') || text.includes('cyber') || text.includes('data breach')) {
      importanceScore += 28;
      concepts.push('Vulnerability Management', 'Cloud Security', 'Zero-Day Exploits');
    }
    if (text.includes('ai act') || text.includes('semiconductor') || text.includes('frontier model') || text.includes('generative ai')) {
      importanceScore += 25;
      concepts.push('AI Governance', 'Hardware Supply Chains', 'Foundational Models');
    }
    if (text.includes('summit') || text.includes('treaty') || text.includes('sanction') || text.includes('ceasefire')) {
      importanceScore += 22;
      concepts.push('Geopolitics', 'International Relations', 'Trade Agreements');
    }

    importanceScore = Math.min(98, Math.max(35, importanceScore));

    // 3. Trend Velocity (Source corroboration & freshness)
    const trendScore = Math.min(100, Math.round(sourceCount * 25 + (hoursAgo < 4 ? 30 : hoursAgo < 8 ? 15 : 0)));

    // 4. Regional Relevance Weight
    let regionalBonus = 15;
    if (region === 'Tamil Nadu') regionalBonus = 25; // First-class state boost
    else if (region === 'India') regionalBonus = 20;

    // 5. Final Mathematical Rank Score
    // Rank = 0.30*R + 0.30*I + 0.25*T + G
    const finalRankScore = Math.round(
      0.30 * recencyScore + 
      0.30 * importanceScore + 
      0.25 * trendScore + 
      regionalBonus
    );

    // Label Determination
    let importanceLabel: ImportanceLabelType = 'IMPORTANT';
    if (hoursAgo <= 3 && (importanceScore >= 70 || sourceCount >= 2)) {
      importanceLabel = 'BREAKING';
    } else if (sourceCount >= 2 || trendScore >= 65) {
      importanceLabel = 'TRENDING';
    } else if (importanceScore >= 75) {
      importanceLabel = 'IMPORTANT';
    }

    const whyItMatters = this.generateWhyItMatters(title, text, region);

    if (concepts.length === 0) {
      concepts.push('Regional Governance', 'Macro Systems', 'Public Policy');
    }

    return { importanceLabel, importanceScore, trendScore, finalRankScore, whyItMatters, concepts };
  }

  private generateWhyItMatters(title: string, text: string, region: RegionType): string {
    if (region === 'Tamil Nadu') {
      return 'Directly impacts state governance, public infrastructure delivery, industrial employment, and civic welfare in Tamil Nadu.';
    }
    if (text.includes('ai') || text.includes('tech') || text.includes('semiconductor')) {
      return 'Influences industry adoption standards, algorithm safety compliance, and next-generation technical capabilities.';
    }
    if (text.includes('rate') || text.includes('bank') || text.includes('inflation') || text.includes('economy')) {
      return 'Directly impacts consumer borrowing costs, corporate investments, currency valuations, and overall cost of living.';
    }
    if (text.includes('security') || text.includes('vulnerability') || text.includes('breach')) {
      return 'Signals active cyber attack vectors requiring urgent architectural defensive patching and mitigation.';
    }
    return 'Shapes institutional decision-making and alters real-world operational conditions across the domain.';
  }

  public async syncAllFeeds(): Promise<{ newCount: number; totalEvents: number }> {
    if (this.isSyncing) {
      return { newCount: 0, totalEvents: this.eventsMap.size };
    }

    this.isSyncing = true;
    let newCount = 0;
    console.log('[NewsSync] Pulling multi-source feeds across TN, India, World, Tech, Econ...');

    const feedPromises = RSS_FEEDS.map(async (feed) => {
      try {
        const parsed = await this.parser.parseURL(feed.url);
        if (!parsed || !parsed.items) return;

        for (const item of parsed.items.slice(0, 15)) {
          if (!item.title || !item.link) continue;

          const title = this.cleanHtml(item.title);
          const rawSummary = item.contentSnippet || item.content || item.summary || item['content:encoded'] || '';
          const summary = this.cleanHtml(rawSummary).slice(0, 320) || 'Click to view full real-world event breakdown and AI context.';
          const originalUrl = item.link.trim();
          const publishedAt = item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString();

          const region = this.detectRegion(title, summary, feed.defaultRegion);
          const category = this.detectCategory(title, summary, feed.defaultCategory);

          // Check if this incoming article corroborates an existing canonical event
          const existingEvent = this.findMatchingEvent(title, summary, region);

          if (existingEvent) {
            // Check if source already attached
            const alreadyHasSource = existingEvent.sources.some(s => s.name === feed.name || s.url === originalUrl);
            if (!alreadyHasSource) {
              existingEvent.sources.push({
                name: feed.name,
                url: originalUrl,
                publishedAt,
                tier: feed.tier
              });
              existingEvent.sourceCount = existingEvent.sources.length;
              existingEvent.lastUpdatedAt = new Date().toISOString();

              // Re-calculate scores with multi-source boost
              const reScored = this.calculateScores(
                existingEvent.title,
                existingEvent.summary,
                existingEvent.region,
                existingEvent.firstPublishedAt,
                existingEvent.sourceCount
              );

              existingEvent.importanceLabel = reScored.importanceLabel;
              existingEvent.importanceScore = Math.max(existingEvent.importanceScore, reScored.importanceScore);
              existingEvent.trendScore = reScored.trendScore;
              existingEvent.finalRankScore = reScored.finalRankScore;
            }
          } else {
            // Create new canonical event
            const rawId = `${title.toLowerCase().trim()}_${originalUrl}`;
            let hash = 0;
            for (let i = 0; i < rawId.length; i++) {
              hash = (hash << 5) - hash + rawId.charCodeAt(i);
              hash |= 0;
            }
            const id = `event-${Math.abs(hash).toString(36)}`;

            if (!this.eventsMap.has(id)) {
              const { importanceLabel, importanceScore, trendScore, finalRankScore, whyItMatters, concepts } = this.calculateScores(
                title,
                summary,
                region,
                publishedAt,
                1
              );

              const wordCount = (summary || title).split(/\s+/).length;
              const estimatedReadTime = `${Math.max(2, Math.ceil(wordCount / 60))} min read`;

              const newEvent: CanonicalEvent = {
                id,
                title,
                summary,
                region,
                category,
                importanceLabel,
                importanceScore,
                trendScore,
                finalRankScore,
                whyItMatters,
                estimatedReadTime,
                relatedConcepts: concepts,
                sources: [
                  {
                    name: feed.name,
                    url: originalUrl,
                    publishedAt,
                    tier: feed.tier
                  }
                ],
                firstPublishedAt: publishedAt,
                lastUpdatedAt: publishedAt,
                sourceCount: 1
              };

              this.eventsMap.set(id, newEvent);
              newCount++;
            }
          }
        }
      } catch (err: any) {
        console.warn(`[NewsSync] Feed ${feed.name} skipped:`, err.message);
      }
    });

    await Promise.allSettled(feedPromises);
    this.lastSyncTime = new Date();
    this.isSyncing = false;
    console.log(`[NewsSync] Ingestion completed. Added ${newCount} new canonical events. Total events: ${this.eventsMap.size}`);

    return { newCount, totalEvents: this.eventsMap.size };
  }

  // DYNAMIC TOP 10 RANKING ENGINE WITH DIVERSITY DAMPENING
  public getTop10LiveEvents(regionFilter?: string): CanonicalEvent[] {
    let list = Array.from(this.eventsMap.values());

    if (regionFilter && regionFilter !== 'ALL') {
      const reg = regionFilter.toLowerCase().replace('-', ' ');
      list = list.filter(e => e.region.toLowerCase().includes(reg));
    }

    // Sort initially by finalRankScore descending
    list.sort((a, b) => b.finalRankScore - a.finalRankScore);

    // Apply diversity dampening: No single category or region should take more than 3 slots in the Top 5
    const selectedTop10: CanonicalEvent[] = [];
    const categoryCounts: Record<string, number> = {};

    for (const event of list) {
      if (selectedTop10.length >= 10) break;

      const cat = event.category;
      const currentCatCount = categoryCounts[cat] || 0;

      // If category already has 3 stories, skip unless we need to fill remainder
      if (currentCatCount >= 3 && list.length > 10) {
        continue;
      }

      selectedTop10.push(event);
      categoryCounts[cat] = currentCatCount + 1;
    }

    // Fill remaining if needed
    if (selectedTop10.length < 10 && list.length > selectedTop10.length) {
      for (const event of list) {
        if (!selectedTop10.some(e => e.id === event.id)) {
          selectedTop10.push(event);
          if (selectedTop10.length >= 10) break;
        }
      }
    }

    return selectedTop10;
  }

  public getAllEvents(params?: { region?: string; category?: string; label?: string; search?: string; limit?: number }): {
    events: CanonicalEvent[];
    total: number;
    lastSyncTime: string;
    isSyncing: boolean;
  } {
    let list = Array.from(this.eventsMap.values());

    // Sort by publication time descending
    list.sort((a, b) => new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime());

    if (params?.region && params.region !== 'ALL') {
      const reg = params.region.toLowerCase().replace('-', ' ');
      list = list.filter(e => e.region.toLowerCase().includes(reg));
    }

    if (params?.category && params.category !== 'ALL') {
      const cat = params.category.toLowerCase().replace('-', ' ');
      list = list.filter(e => e.category.toLowerCase().includes(cat));
    }

    if (params?.label && params.label !== 'ALL') {
      list = list.filter(e => e.importanceLabel === params.label);
    }

    if (params?.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      list = list.filter(e => 
        e.title.toLowerCase().includes(q) || 
        e.summary.toLowerCase().includes(q) || 
        e.sources.some(s => s.name.toLowerCase().includes(q)) ||
        e.relatedConcepts.some(c => c.toLowerCase().includes(q))
      );
    }

    const total = list.length;
    if (params?.limit && params.limit > 0) {
      list = list.slice(0, params.limit);
    }

    return {
      events: list,
      total,
      lastSyncTime: this.lastSyncTime ? this.lastSyncTime.toISOString() : new Date().toISOString(),
      isSyncing: this.isSyncing
    };
  }

  public getEventById(id: string): CanonicalEvent | undefined {
    return this.eventsMap.get(id);
  }

  private seedInitialEvents() {
    const seeds: CanonicalEvent[] = [
      {
        id: 'event-tn-1',
        title: 'Tamil Nadu Cabinet Clears Mega Infrastructure & Electric Mobility Corridor Policy',
        summary: 'State government approves capital investment framework expanding metro transit links across Chennai and Hosur EV manufacturing hub.',
        region: 'Tamil Nadu',
        category: 'Government & Society',
        importanceLabel: 'BREAKING',
        importanceScore: 94,
        trendScore: 88,
        finalRankScore: 98,
        whyItMatters: 'Accelerates high-speed regional transit corridors and strengthens clean mobility industrial employment in Tamil Nadu.',
        estimatedReadTime: '3 min read',
        relatedConcepts: ['Public Infrastructure', 'Clean Energy Policy', 'Industrial Corridors'],
        sources: [
          { name: 'The Hindu (Tamil Nadu)', url: 'https://www.thehindu.com/news/national/tamil-nadu/', publishedAt: new Date(Date.now() - 3600000 * 1).toISOString(), tier: 1 },
          { name: 'DIPR Tamil Nadu', url: 'https://www.tn.gov.in', publishedAt: new Date(Date.now() - 3600000 * 2).toISOString(), tier: 1 }
        ],
        firstPublishedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        lastUpdatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
        sourceCount: 2
      },
      {
        id: 'event-in-1',
        title: 'Reserve Bank of India & Global Central Banks Shift Monetary Policy Stance',
        summary: 'Monetary policy committee calibrates benchmark repo corridor to balance headline inflation targets with industrial capital investments.',
        region: 'India',
        category: 'Economy & Money',
        importanceLabel: 'IMPORTANT',
        importanceScore: 92,
        trendScore: 85,
        finalRankScore: 95,
        whyItMatters: 'Directly dictates borrowing costs for personal home loans, commercial lines of credit, and consumer inflation rates.',
        estimatedReadTime: '3 min read',
        relatedConcepts: ['Inflation', 'Monetary Policy', 'Interest Rates', 'Central Banking'],
        sources: [
          { name: 'Economic Times', url: 'https://economictimes.indiatimes.com', publishedAt: new Date(Date.now() - 3600000 * 2).toISOString(), tier: 1 },
          { name: 'Reuters Markets', url: 'https://reuters.com', publishedAt: new Date(Date.now() - 3600000 * 3).toISOString(), tier: 1 }
        ],
        firstPublishedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
        lastUpdatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        sourceCount: 2
      },
      {
        id: 'event-wd-1',
        title: 'European Union Enforces Landmark AI Act with Tiered Algorithmic Audits',
        summary: 'First legally binding global AI governance statute takes effect, requiring transparency registries and risk audits for foundational models.',
        region: 'World',
        category: 'AI & Technology',
        importanceLabel: 'TRENDING',
        importanceScore: 90,
        trendScore: 82,
        finalRankScore: 92,
        whyItMatters: 'Sets the worldwide benchmark for generative AI legal liability, bias prevention, and algorithmic transparency.',
        estimatedReadTime: '4 min read',
        relatedConcepts: ['AI Governance', 'Algorithmic Auditing', 'Compliance Frameworks'],
        sources: [
          { name: 'TechCrunch', url: 'https://techcrunch.com', publishedAt: new Date(Date.now() - 3600000 * 4).toISOString(), tier: 1 },
          { name: 'BBC World', url: 'https://bbc.com', publishedAt: new Date(Date.now() - 3600000 * 5).toISOString(), tier: 1 }
        ],
        firstPublishedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        lastUpdatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        sourceCount: 2
      }
    ];

    seeds.forEach(s => this.eventsMap.set(s.id, s));
    this.lastSyncTime = new Date();
  }
}

export const newsIngestionService = new NewsIngestionService();
