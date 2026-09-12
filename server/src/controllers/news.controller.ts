import { Request, Response } from 'express';

export const getDailyBrief = async (req: Request, res: Response) => {
  try {
    const briefs = [
      {
        id: 'story-1',
        title: 'Reserve Bank & Central Banks Shift Monetary Policy Stance Amid Global Inflation Shifts',
        summary: 'Major central banks announce calibrated interest rate adjustments to balance inflation reduction with economic growth targets.',
        category: 'Economy & Money',
        source: 'Financial Times / Reuters',
        originalUrl: 'https://www.reuters.com/markets/rates-bonds/',
        publishedAt: new Date().toISOString(),
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

    res.json({
      success: true,
      data: briefs,
      meta: {
        totalEventsParsed: 640,
        highImpactSelected: briefs.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to retrieve daily brief' });
  }
};

export const getArticleById = async (req: Request, res: Response) => {
  const { id } = req.params;

  res.json({
    success: true,
    data: {
      id,
      title: 'Reserve Bank & Central Banks Shift Monetary Policy Stance Amid Global Inflation Shifts',
      category: 'Economy & Money',
      source: 'Financial Times & Reuters Wire',
      originalUrl: 'https://www.reuters.com/markets/rates-bonds/',
      publishedAt: '2 hours ago',
      importanceLevel: 'MUST_KNOW',
      importanceScore: 92,
      breakdown: {
        whatHappened: 'Major central banks across key emerging and developed economies have signaled a transition in interest rate policy, adjusting repo rates and statutory reserve targets.',
        whyDidItHappen: 'Post-supply-chain stabilization, combined with shifting commodity import costs and currency liquidity fluctuations, prompted rate re-calibrations.',
        whyDoesItMatter: 'Directly dictates borrowing costs for personal home loans, commercial lines of credit, and overall consumer inflation rates.',
        whoIsAffected: [
          'Homeowners and car loan borrowers (monthly EMI adjustments)',
          'Small and Medium Enterprises (working capital borrowing rates)',
          'Equity and Bond Market Investors (asset price valuation shifts)'
        ],
        whatCouldHappenNext: [
          'Commercial retail banks may recalibrate fixed deposit (FD) yields within 7 business days.',
          'Slight appreciation or stabilization in domestic currency against major trade baskets.'
        ],
        background: 'Following unprecedented global rate hikes in previous years to curb post-pandemic inflation spikes, central banks entered a holding phase.'
      }
    }
  });
};
