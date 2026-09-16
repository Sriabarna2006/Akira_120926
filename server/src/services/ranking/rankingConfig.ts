/**
 * AKIRA Phase 5: Trend Detection, Importance Scoring & Live Ranking Configuration
 * Centralized constants, weights, thresholds, decay factors, and keyword dictionaries.
 * Deterministic and transparent with no hidden magic numbers.
 */

export const RANKING_CONFIG = {
  // 1. Trend Score Weights (Sum = 1.0)
  TREND_WEIGHTS: {
    VELOCITY: 0.35,
    COVERAGE: 0.25,
    RECENCY: 0.20,
    FRESHNESS: 0.10,
    SPREAD: 0.10,
  },

  // 2. Final Rank Score Weights (Sum = 1.0)
  FINAL_RANK_WEIGHTS: {
    TREND: 0.40,
    IMPORTANCE: 0.35,
    RECENCY: 0.15,
    REGIONAL_RELEVANCE: 0.10,
  },

  // 3. Velocity Calculation Windows & Parameters
  VELOCITY: {
    CURRENT_WINDOW_HOURS: 6,
    PREVIOUS_WINDOW_HOURS: 6,
    MIN_OBSERVATION_COUNT: 2,
    DEFAULT_BASE_SCORE: 50,
  },

  // 4. Coverage Independent Source Points
  COVERAGE_SCORES: {
    ONE_SOURCE: 25,
    TWO_SOURCES: 50,
    THREE_SOURCES: 75,
    FOUR_PLUS_SOURCES: 100,
  },

  // 5. Recency Exponential Decay Parameters: R = 100 * e^(-lambda * h)
  RECENCY: {
    LAMBDA: 0.10, // h=0 -> 100, h=2 -> ~82, h=6 -> ~55, h=12 -> ~30, h=24 -> ~9
  },

  // 6. Freshness Step Thresholds (in hours)
  FRESHNESS_THRESHOLDS: [
    { maxHours: 1, score: 100 },
    { maxHours: 3, score: 75 },
    { maxHours: 6, score: 50 },
    { maxHours: 12, score: 25 },
  ],
  FRESHNESS_DEFAULT_SCORE: 0,

  // 7. Status Label Thresholds
  THRESHOLDS: {
    BREAKING_MIN_IMPORTANCE: 70,
    BREAKING_MIN_FRESHNESS: 75, // Updated within 3 hours
    BREAKING_MIN_RECENCY: 70,
    
    TRENDING_RISING_MIN: 40,
    TRENDING_ACTIVE_MIN: 60,
    TRENDING_HIGH_MIN: 80,

    IMPORTANT_MIN: 75,
  },

  // 8. Eligibility Window (in hours)
  LIVE_ELIGIBILITY_MAX_HOURS: 48,
  STALE_EVENT_THRESHOLD_HOURS: 36,

  // 9. Refresh Schedulers
  REFRESH_INTERVAL_MINUTES: 5,

  // 10. Diversity Controls
  DIVERSITY: {
    MAX_PER_CATEGORY_IN_TOP_10: 3,
    MAX_PER_SOURCE_CONGLOMERATE: 3,
  },

  // 11. Category Importance Baseline (0-100)
  CATEGORY_IMPORTANCE_BASELINES: {
    security: 85,
    health: 82,
    economy: 80,
    infrastructure: 78,
    weather: 76,
    politics: 75,
    environment: 74,
    science: 72,
    transportation: 72,
    technology: 70,
    education: 68,
    business: 65,
    other: 50,
    sports: 45,
    entertainment: 40,
  } as Record<string, number>,

  // 12. Regional Relevance Baseline Scores
  REGIONAL_BASELINES: {
    'tamil-nadu': 85,
    india: 80,
    world: 75,
  } as Record<string, number>,

  // 13. Deterministic High-Impact Keywords for Importance Evaluation
  HIGH_IMPACT_KEYWORDS: {
    criticalEmergency: [
      'earthquake', 'cyclone', 'flood', 'landslide', 'emergency', 'tsunami',
      'curfew', 'outbreak', 'epidemic', 'red alert', 'evacuation', 'casualty',
      'death toll', 'disaster management', 'ndrf', 'sdrf'
    ],
    governanceAndPolicy: [
      'cabinet', 'parliament', 'assembly', 'ordinance', 'supreme court',
      'high court', 'verdict', 'gazette', 'chief minister', 'prime minister',
      'governor', 'treaty', 'bilateral', 'g20', 'united nations', 'dipr'
    ],
    economicAndFinancial: [
      'interest rate', 'rbi', 'repo rate', 'inflation', 'gdp', 'fiscal deficit',
      'budget', 'monetary policy', 'central bank', 'sebi', 'tariff', 'sovereign'
    ],
    infrastructureAndTransit: [
      'metro rail', 'expressway', 'corridor', 'airport', 'port', 'semiconductor fab',
      'power grid', 'clean energy', 'ev policy', 'water reservoir', 'desalination'
    ],
    scienceAndBreakthroughs: [
      'isro', 'nasa', 'satellite', 'lunar', 'quantum computing', 'fusion',
      'vaccine trial', 'particle physics', 'sub-2nm', 'clinical trial'
    ]
  }
};
