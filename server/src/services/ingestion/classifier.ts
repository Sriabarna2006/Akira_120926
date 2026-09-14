/**
 * Deterministic Region & Category Classification Engine
 *
 * Strict Rules:
 * 1. Region != Category.
 * 2. Tamil Nadu is a first-class priority region.
 * 3. Categorization maps to standard database categories.
 */

export interface ClassificationResult {
  regionId: string;
  categoryId: string;
}

// ---------------------------------------------------------------------------
// REGION DICTIONARIES
// ---------------------------------------------------------------------------

const TAMIL_NADU_KEYWORDS = [
  'tamil nadu', 'tamilnadu', 'chennai', 'coimbatore', 'madurai', 'trichy',
  'tiruchirappalli', 'salem', 'tirunelveli', 'erode', 'vellore', 'thanjavur',
  'hosur', 'kanchipuram', 'thoothukudi', 'dindigul', 'cuddalore', 'nagapattinam',
  'stalin', 'm.k. stalin', 'edappadi', 'palaniswami', 'cmrl', 'chennai metro',
  'tangedco', 'anna university', 'madras high court', 'fort st george', 'dipr tamil nadu',
  'tnpcb', 'tneb', 'tnstc', 'koyambedu', 'guindy', 'siruseri', 'omr', 'ennore',
  'marina beach', 'adityanar', 'dinamalar', 'dinamani', 'tidel park'
];

const INDIA_KEYWORDS = [
  'india', 'indian', 'delhi', 'new delhi', 'mumbai', 'bengaluru', 'bangalore',
  'hyderabad', 'kolkata', 'pune', 'ahmedabad', 'noida', 'gurugram', 'chandigarh',
  'parliament', 'lok sabha', 'rajya sabha', 'supreme court of india', 'rbi',
  'reserve bank of india', 'isro', 'modi', 'narendra modi', 'niti aayog',
  'sebi', 'upi', 'aadhaar', 'vande bharat', 'drdo', 'union cabinet',
  'central government', 'finmin', 'pib india', 'rupee', 'bse', 'nse', 'sensex', 'nifty'
];

// ---------------------------------------------------------------------------
// CATEGORY DICTIONARIES (Mapped to public.categories ids)
// ---------------------------------------------------------------------------

const CATEGORY_RULES: { categoryId: string; keywords: string[] }[] = [
  {
    categoryId: 'technology',
    keywords: [
      'ai', 'artificial intelligence', 'machine learning', 'deep learning', 'llm',
      'neural network', 'chatgpt', 'openai', 'semiconductor', 'chipmaker', 'silicon',
      'gpu', 'processor', 'quantum computing', 'supercomputer', 'software', 'algorithm',
      'cyber', 'cloud computing', 'datacenter', 'hardware', 'sub-2nm', 'tsmc', 'nvidia'
    ],
  },
  {
    categoryId: 'security',
    keywords: [
      'cybersecurity', 'malware', 'ransomware', 'zero-day', 'hacker', 'vulnerability',
      'data breach', 'phishing', 'spyware', 'defense', 'military', 'army', 'navy',
      'air force', 'missile', 'border security', 'intelligence agency', 'national security'
    ],
  },
  {
    categoryId: 'economy',
    keywords: [
      'inflation', 'interest rate', 'monetary policy', 'repo rate', 'rbi', 'central bank',
      'gdp', 'fiscal deficit', 'recession', 'macroeconomics', 'tax revenue', 'gst',
      'currency', 'rupee value', 'forex reserves', 'treasury', 'sovereign debt', 'budget'
    ],
  },
  {
    categoryId: 'business',
    keywords: [
      'stock market', 'shares', 'equity', 'ipo', 'quarterly earnings', 'revenue', 'profit',
      'startup', 'venture capital', 'funding round', 'acquisition', 'merger', 'corporate',
      'ceo', 'bse', 'nse', 'wall street', 'nasdaq', 'investors', 'unicorn', 'valuation'
    ],
  },
  {
    categoryId: 'science',
    keywords: [
      'space', 'isro', 'nasa', 'astronomy', 'chandrayaan', 'gaganyaan', 'telescope',
      'james webb', 'black hole', 'physics', 'quantum', 'biotechnology', 'genetics',
      'crispr', 'laboratory', 'scientific discovery', 'geology', 'planet', 'cosmic'
    ],
  },
  {
    categoryId: 'infrastructure',
    keywords: [
      'metro', 'transit corridor', 'cmrl', 'expressway', 'highway', 'smart city',
      'flyover', 'bridge', 'port', 'harbour', 'airport terminal', 'urban planning',
      'water treatment', 'power grid', 'sewage system', 'corridor expansion', 'battery park'
    ],
  },
  {
    categoryId: 'transportation',
    keywords: [
      'railway', 'train', 'vande bharat', 'electric vehicle', 'ev battery', 'ev charging',
      'aviation', 'airline', 'flight', 'shipping vessel', 'bus fleet', 'logistics',
      'freight', 'road transport', 'traffic regulation'
    ],
  },
  {
    categoryId: 'environment',
    keywords: [
      'climate change', 'global warming', 'carbon emission', 'renewable energy', 'solar power',
      'wind farm', 'green hydrogen', 'conservation', 'wildlife sanctuary', 'biodiversity',
      'forest cover', 'pollution', 'air quality', 'ecology', 'net zero'
    ],
  },
  {
    categoryId: 'weather',
    keywords: [
      'monsoon', 'heavy rain', 'rainfall', 'cyclone', 'imd', 'storm', 'heatwave',
      'flood', 'drought', 'weather forecast', 'precipitation', 'thunderstorm'
    ],
  },
  {
    categoryId: 'health',
    keywords: [
      'healthcare', 'hospital', 'medicine', 'doctor', 'vaccine', 'virus', 'epidemic',
      'outbreak', 'clinical trial', 'who', 'pharma', 'disease', 'medical research',
      'public health', 'mental health'
    ],
  },
  {
    categoryId: 'education',
    keywords: [
      'education', 'university', 'college', 'school', 'student', 'teacher', 'neet',
      'ugc', 'cbse', 'higher education', 'scholarship', 'academic', 'literacy',
      'admissions', 'curriculum', 'exam'
    ],
  },
  {
    categoryId: 'politics',
    keywords: [
      'election', 'parliament', 'assembly', 'cabinet', 'minister', 'chief minister',
      'prime minister', 'bill passed', 'legislation', 'court ruling', 'supreme court',
      'high court', 'governance', 'policy reform', 'political party', 'civic administration'
    ],
  },
  {
    categoryId: 'sports',
    keywords: [
      'cricket', 'ipl', 'bcci', 'football', 'fifa', 'olympics', 'chess', 'badminton',
      'tennis', 'grand slam', 'athletics', 'tournament', 'championship', 'medal'
    ],
  },
  {
    categoryId: 'entertainment',
    keywords: [
      'cinema', 'movie', 'film', 'box office', 'actor', 'actress', 'director',
      'music', 'soundtrack', 'oscars', 'filmfare', 'ott platform', 'streaming'
    ],
  },
];

/**
 * Classifies an article into a Region and Category based on title, content snippet, and source defaults.
 */
export function classifyArticle(
  title: string,
  contentSnippet?: string,
  defaultRegion = 'world',
  defaultCategory = 'other'
): ClassificationResult {
  const combinedText = `${title} ${contentSnippet || ''}`.toLowerCase();

  // 1. REGION CLASSIFICATION (Hierarchical Priority: Tamil Nadu -> India -> World)
  let regionId = defaultRegion;

  // Check Tamil Nadu first (First-Class Region)
  const isTamilNadu = TAMIL_NADU_KEYWORDS.some((kw) => {
    const regex = new RegExp(`\\b${kw.replace('.', '\\.')}\\b`, 'i');
    return regex.test(combinedText);
  });

  if (isTamilNadu) {
    regionId = 'tamil-nadu';
  } else {
    // Check India National
    const isIndia = INDIA_KEYWORDS.some((kw) => {
      const regex = new RegExp(`\\b${kw.replace('.', '\\.')}\\b`, 'i');
      return regex.test(combinedText);
    });

    if (isIndia) {
      regionId = 'india';
    } else if (defaultRegion === 'tamil-nadu' || defaultRegion === 'india') {
      regionId = defaultRegion;
    } else {
      regionId = 'world';
    }
  }

  // 2. CATEGORY CLASSIFICATION
  let categoryId = defaultCategory;
  let highestMatchCount = 0;

  for (const rule of CATEGORY_RULES) {
    let matchCount = 0;
    for (const kw of rule.keywords) {
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      if (regex.test(combinedText)) {
        matchCount++;
      }
    }

    if (matchCount > highestMatchCount) {
      highestMatchCount = matchCount;
      categoryId = rule.categoryId;
    }
  }

  // If no strong keyword matches, fallback to source defaultCategory if valid, else 'other'
  if (highestMatchCount === 0 && defaultCategory) {
    categoryId = defaultCategory;
  }

  return {
    regionId,
    categoryId: categoryId || 'other',
  };
}
