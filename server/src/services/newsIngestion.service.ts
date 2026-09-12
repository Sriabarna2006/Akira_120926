import Parser from 'rss-parser';

export interface IngestedArticle {
  id: string;
  title: string;
  summary: string;
  contentSnippet?: string;
  category: string;
  source: string;
  originalUrl: string;
  publishedAt: string;
  importanceLevel: 'MUST_KNOW' | 'IMPORTANT' | 'INTERESTING';
  importanceScore: number;
  whyItMatters: string;
  estimatedReadTime: string;
  relatedConcepts: string[];
}

interface FeedConfig {
  name: string;
  url: string;
  defaultCategory: string;
  tier: number;
}

const RSS_FEEDS: FeedConfig[] = [
  { name: 'BBC World', url: 'http://feeds.bbci.co.uk/news/world/rss.xml', defaultCategory: 'World', tier: 1 },
  { name: 'The Hindu', url: 'https://www.thehindu.com/news/national/feeder/default.rss', defaultCategory: 'India', tier: 1 },
  { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', defaultCategory: 'AI & Technology', tier: 1 },
  { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', defaultCategory: 'AI & Technology', tier: 1 },
  { name: 'CNBC Markets', url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114', defaultCategory: 'Economy & Money', tier: 1 },
  { name: 'BleepingComputer', url: 'https://www.bleepingcomputer.com/feed/', defaultCategory: 'Cybersecurity', tier: 1 },
  { name: 'ScienceDaily', url: 'https://www.sciencedaily.com/rss/top/science.xml', defaultCategory: 'Science & Environment', tier: 1 },
  { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', defaultCategory: 'AI & Technology', tier: 2 },
];

class NewsIngestionService {
  private parser: Parser;
  private articlesMap: Map<string, IngestedArticle> = new Map();
  private lastSyncTime: Date | null = null;
  private isSyncing = false;

  constructor() {
    this.parser = new Parser({
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      }
    });

    // Populate with initial high-quality seed articles immediately
    this.seedInitialArticles();

    // Trigger initial background sync
    this.syncAllFeeds().catch(err => console.warn('[NewsSync] Initial sync notice:', err.message));

    // Schedule background auto-refresh every 5 minutes
    setInterval(() => {
      this.syncAllFeeds().catch(err => console.warn('[NewsSync] Auto-sync notice:', err.message));
    }, 5 * 60 * 1000);
  }

  private cleanHtml(rawText?: string): string {
    if (!rawText) return '';
    return rawText
      .replace(/<[^>]*>?/gm, '') // Strip HTML tags
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private generateArticleId(title: string, link: string): string {
    const raw = `${title.toLowerCase().trim()}_${link.trim()}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `news-${Math.abs(hash).toString(36)}`;
  }

  private detectCategory(title: string, summary: string, fallback: string): string {
    const text = `${title} ${summary}`.toLowerCase();

    if (text.includes('ai ') || text.includes('artificial intelligence') || text.includes('chip') || text.includes('semiconductor') || text.includes('software') || text.includes('robot') || text.includes('model') || text.includes('llm') || text.includes('gpu')) {
      return 'AI & Technology';
    }
    if (text.includes('cyber') || text.includes('malware') || text.includes('hacker') || text.includes('vulnerability') || text.includes('breach') || text.includes('ransomware') || text.includes('zero-day') || text.includes('patch')) {
      return 'Cybersecurity';
    }
    if (text.includes('inflation') || text.includes('interest rate') || text.includes('market') || text.includes('stock') || text.includes('bank') || text.includes('gdp') || text.includes('economy') || text.includes('dollar') || text.includes('rupee') || text.includes('fed') || text.includes('treasury')) {
      return 'Economy & Money';
    }
    if (text.includes('india') || text.includes('delhi') || text.includes('mumbai') || text.includes('parliament') || text.includes('supreme court of india') || text.includes('rbi')) {
      return 'India';
    }
    if (text.includes('climate') || text.includes('carbon') || text.includes('space') || text.includes('nasa') || text.includes('isro') || text.includes('telescope') || text.includes('planet') || text.includes('energy') || text.includes('species')) {
      return 'Science & Environment';
    }
    if (text.includes('election') || text.includes('government') || text.includes('policy') || text.includes('treaty') || text.includes('sanction') || text.includes('un ') || text.includes('nato')) {
      return 'Government & Society';
    }

    return fallback;
  }

  private calculateImportance(title: string, summary: string, tier: number): { level: 'MUST_KNOW' | 'IMPORTANT' | 'INTERESTING'; score: number; whyItMatters: string; concepts: string[] } {
    const text = `${title} ${summary}`.toLowerCase();
    let score = tier === 1 ? 55 : 40;
    const concepts: string[] = [];

    // High Impact keywords
    if (text.includes('inflation') || text.includes('interest rate') || text.includes('monetary policy') || text.includes('central bank')) {
      score += 30;
      concepts.push('Inflation', 'Monetary Policy', 'Interest Rates');
    }
    if (text.includes('zero-day') || text.includes('critical vulnerability') || text.includes('global outage') || text.includes('ransomware')) {
      score += 28;
      concepts.push('Vulnerability Management', 'Cloud Security', 'Zero-Day Exploits');
    }
    if (text.includes('ai act') || text.includes('regulation') || text.includes('frontier model') || text.includes('semiconductor')) {
      score += 26;
      concepts.push('AI Governance', 'Hardware Supply Chains', 'Foundational Models');
    }
    if (text.includes('treaty') || text.includes('summit') || text.includes('sanction') || text.includes('election')) {
      score += 22;
      concepts.push('Geopolitics', 'International Law', 'Economic Sanctions');
    }
    if (text.includes('discovery') || text.includes('breakthrough') || text.includes('quantum') || text.includes('fusion')) {
      score += 20;
      concepts.push('Scientific Method', 'Clean Energy', 'Quantum Mechanics');
    }

    // Cap score at 98
    score = Math.min(98, Math.max(35, score));

    let level: 'MUST_KNOW' | 'IMPORTANT' | 'INTERESTING' = 'INTERESTING';
    if (score >= 78) {
      level = 'MUST_KNOW';
    } else if (score >= 58) {
      level = 'IMPORTANT';
    }

    const whyItMatters = this.generateWhyItMatters(title, text, level);

    if (concepts.length === 0) {
      concepts.push('Global Systems', 'Current Affairs', 'Policy Analysis');
    }

    return { level, score, whyItMatters, concepts };
  }

  private generateWhyItMatters(title: string, text: string, level: string): string {
    if (text.includes('ai') || text.includes('tech') || text.includes('model')) {
      return 'Influences industry adoption standards, algorithm safety compliance, and future developer tooling.';
    }
    if (text.includes('rate') || text.includes('bank') || text.includes('inflation') || text.includes('economy')) {
      return 'Directly impacts consumer borrowing costs, corporate investments, currency valuations, and cost of living.';
    }
    if (text.includes('security') || text.includes('vulnerability') || text.includes('breach')) {
      return 'Signals active cyber attack vectors requiring urgent architectural defensive patching and mitigation.';
    }
    if (text.includes('climate') || text.includes('energy') || text.includes('science')) {
      return 'Shapes long-term sustainable infrastructure planning and next-generation technological capabilities.';
    }
    return 'Shapes institutional decision-making and alters real-world operational conditions across the domain.';
  }

  public async syncAllFeeds(): Promise<{ newCount: number; totalCount: number }> {
    if (this.isSyncing) {
      return { newCount: 0, totalCount: this.articlesMap.size };
    }

    this.isSyncing = true;
    let newCount = 0;
    console.log('[NewsSync] Starting live RSS ingestion from', RSS_FEEDS.length, 'sources...');

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
          const id = this.generateArticleId(title, originalUrl);

          if (!this.articlesMap.has(id)) {
            const category = this.detectCategory(title, summary, feed.defaultCategory);
            const { level, score, whyItMatters, concepts } = this.calculateImportance(title, summary, feed.tier);
            
            const publishedAt = item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString();
            const wordCount = (summary || title).split(/\s+/).length;
            const estimatedReadTime = `${Math.max(2, Math.ceil(wordCount / 60))} min read`;

            const article: IngestedArticle = {
              id,
              title,
              summary,
              contentSnippet: summary,
              category,
              source: feed.name,
              originalUrl,
              publishedAt,
              importanceLevel: level,
              importanceScore: score,
              whyItMatters,
              estimatedReadTime,
              relatedConcepts: concepts
            };

            this.articlesMap.set(id, article);
            newCount++;
          }
        }
      } catch (err: any) {
        console.warn(`[NewsSync] Feed ${feed.name} skipped:`, err.message);
      }
    });

    await Promise.allSettled(feedPromises);
    this.lastSyncTime = new Date();
    this.isSyncing = false;
    console.log(`[NewsSync] Ingestion completed. Added ${newCount} new articles. Total in database: ${this.articlesMap.size}`);

    return { newCount, totalCount: this.articlesMap.size };
  }

  public getAllArticles(params?: { category?: string; importance?: string; search?: string; limit?: number }): {
    articles: IngestedArticle[];
    total: number;
    lastSyncTime: string;
    isSyncing: boolean;
  } {
    let list = Array.from(this.articlesMap.values());

    // Sort by publication time descending (newest first)
    list.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    // Filters
    if (params?.category && params.category !== 'ALL') {
      const catQuery = params.category.toLowerCase().replace('-', ' ');
      list = list.filter(a => a.category.toLowerCase().includes(catQuery) || catQuery.includes(a.category.toLowerCase()));
    }

    if (params?.importance && params.importance !== 'ALL') {
      list = list.filter(a => a.importanceLevel === params.importance);
    }

    if (params?.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      list = list.filter(a => a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q) || a.relatedConcepts.some(c => c.toLowerCase().includes(q)));
    }

    const total = list.length;
    if (params?.limit && params.limit > 0) {
      list = list.slice(0, params.limit);
    }

    return {
      articles: list,
      total,
      lastSyncTime: this.lastSyncTime ? this.lastSyncTime.toISOString() : new Date().toISOString(),
      isSyncing: this.isSyncing
    };
  }

  public getArticleById(id: string): IngestedArticle | undefined {
    return this.articlesMap.get(id);
  }

  private seedInitialArticles() {
    const seeds: IngestedArticle[] = [
      {
        id: 'story-1',
        title: 'Reserve Bank & Central Banks Shift Monetary Policy Stance Amid Global Inflation Shifts',
        summary: 'Major central banks announce calibrated interest rate adjustments to balance inflation reduction with economic growth targets.',
        category: 'Economy & Money',
        source: 'Financial Times / Reuters',
        originalUrl: 'https://www.reuters.com/markets/rates-bonds/',
        publishedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        importanceLevel: 'MUST_KNOW',
        importanceScore: 92,
        whyItMatters: 'Directly impacts home loan EMIs, business borrowing costs, currency exchange rates, and consumer purchasing power.',
        estimatedReadTime: '3 min read',
        relatedConcepts: ['Inflation', 'Interest Rates', 'Monetary Policy', 'Central Banking']
      },
      {
        id: 'story-2',
        title: 'EU Enforces Comprehensive AI Act: What High-Risk AI Classification Means for Tech',
        summary: 'The landmark European AI framework enters legal enforcement, requiring strict audits for biometric identification and generative foundational models.',
        category: 'AI & Technology',
        source: 'MIT Technology Review',
        originalUrl: 'https://technologyreview.com',
        publishedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        importanceLevel: 'MUST_KNOW',
        importanceScore: 89,
        whyItMatters: 'Sets the first legally binding global standard for generative AI compliance, data privacy, and algorithm transparency.',
        estimatedReadTime: '4 min read',
        relatedConcepts: ['AI Governance', 'Algorithmic Auditing', 'Compliance Frameworks']
      },
      {
        id: 'story-3',
        title: 'Critical Zero-Day Vulnerability Discovered in Cloud Identity Infrastructure',
        summary: 'Security researchers unveil a token forging vulnerability allowing cross-tenant privilege escalation in multi-cloud SSO identity providers.',
        category: 'Cybersecurity',
        source: 'Wired Security',
        originalUrl: 'https://wired.com',
        publishedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
        importanceLevel: 'IMPORTANT',
        importanceScore: 78,
        whyItMatters: 'Requires immediate enterprise patching to prevent unauthorized session hijacking across global cloud deployments.',
        estimatedReadTime: '2 min read',
        relatedConcepts: ['OAuth / JWT Tokens', 'Zero-Day Exploits', 'SSO Architecture']
      }
    ];

    seeds.forEach(s => this.articlesMap.set(s.id, s));
    this.lastSyncTime = new Date();
  }
}

export const newsIngestionService = new NewsIngestionService();
