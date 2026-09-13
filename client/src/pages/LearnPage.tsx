import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  GraduationCap, 
  BookOpen, 
  CheckCircle2, 
  Layers, 
  GitBranch, 
  ArrowRight, 
  Lightbulb
} from 'lucide-react';
import { Concept, MultiLevelExplanation } from '../types';
import { Badge, MasteryBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export const LearnPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const activeSlug = searchParams.get('concept') || 'monetary-policy';
  const [activeTab, setActiveTab] = useState<'overview' | 'prerequisites' | 'multi-level' | 'key-takeaways'>('overview');
  const [explanationLevel, setExplanationLevel] = useState<keyof MultiLevelExplanation>('student');

  // Hardcoded rich concept dataset for Phase 2 frontend foundation
  const concepts: Concept[] = [
    {
      id: 'monetary-policy',
      title: 'Monetary Policy',
      slug: 'monetary-policy',
      category: 'Economy & Money',
      shortDefinition: 'The strategic framework and operational tools used by a nation’s central bank to control the supply of money, credit availability, and benchmark interest rates.',
      fullExplanation: 'Monetary policy is the primary macroeconomic steering wheel used by central banks (such as the RBI or the Federal Reserve) to promote maximum sustainable employment while keeping consumer price inflation near a stable target (typically 2–4%). When inflation accelerates, central banks employ contractionary policy by increasing policy rates. Conversely, during slowdowns, expansionary rate cuts stimulate lending and commercial investment.',
      prerequisites: [
        { id: 'inflation', title: 'Inflation', description: 'The continuous, generalized increase in aggregate prices of goods and services over time.' },
        { id: 'interest-rates', title: 'Interest Rates', description: 'The cost of borrowing money and the return on capital lent or deposited.' },
        { id: 'central-bank', title: 'Central Bank', description: 'The apex financial and monetary institution governing a country’s banking system.' }
      ],
      keyTakeaways: [
        'Expansionary Policy: Decreases borrowing costs to encourage business capital investment and consumer spending.',
        'Contractionary Policy: Increases interest rates to restrain aggregate demand and tame rapid inflation.',
        'Transmission Lag: Policy changes take between 6 to 18 months to fully propagate through credit markets and the real economy.',
      ],
      multiLevelExplanations: {
        verySimple: 'Think of monetary policy as a thermostat for the country’s money. If the economy gets too hot with high prices, the central bank turns on the AC (raises rates). If it gets too cold and slow, they turn on the heater (lowers rates).',
        beginner: 'Monetary policy is how a central bank manages how much money flows in the country. By making loans cheaper or more expensive, they control how much people and companies spend.',
        student: 'The central bank adjusts the benchmark repo/discount rate and reserve requirements. A higher rate raises commercial lending rates, reducing aggregate demand (AD) and curbing demand-pull inflation.',
        technical: 'Operating via open market operations (OMO), liquidity adjustment facilities (LAF), and repo corridor calibration, monetary transmission modulates the term structure of interest rates, broad money supply (M3), and yield curves.',
        deepDive: 'Examines dynamic stochastic general equilibrium (DSGE) frameworks, Taylor Rule interest rate targets, quantitative tightening balance-sheet dynamics, and cross-border currency parity adjustments.',
      },
      masteryStatus: 'DEVELOPING',
    },
    {
      id: 'ai-governance',
      title: 'AI Governance & Compliance',
      slug: 'ai-governance',
      category: 'AI & Technology',
      shortDefinition: 'The legal, institutional, and technical rules governing artificial intelligence systems to guarantee safety, algorithmic transparency, copyright compliance, and non-discrimination.',
      fullExplanation: 'AI governance encompasses regulations such as the EU AI Act and India’s DPDP guidelines that categorize artificial intelligence deployments into risk tiers (Unacceptable, High-Risk, Minimal). High-risk models in healthcare, law enforcement, and biometric surveillance require mandatory safety audits, data provenance verification, and human oversight fail-safes.',
      prerequisites: [
        { id: 'machine-learning', title: 'Machine Learning Basics', description: 'How deep neural networks discover statistical representations from training corpora.' },
        { id: 'data-privacy', title: 'Data Privacy & Ethics', description: 'Principles governing user consent, biometric storage, and unauthorized web scraping.' }
      ],
      keyTakeaways: [
        'Risk-Tiered Audits: Systems are audited based on potential societal harm rather than sheer model parameter count.',
        'Algorithmic Transparency: High-stakes automated decisions must provide explainable audit logs.',
        'Data Provenance: Developers must disclose copyrighted materials included in training datasets.',
      ],
      multiLevelExplanations: {
        verySimple: 'AI Governance is the rulebook for smart computers. Just like cars need speed limits and seatbelts, AI systems need safety checks so they do not hurt people or steal information.',
        beginner: 'It is the set of laws that requires tech companies to test their AI tools for bias, safety, and privacy before releasing them to the public.',
        student: 'A regulatory architecture classifying models into risk categories. High-risk systems must pass independent third-party audits and provide transparent data provenance.',
        technical: 'Involves model alignment protocols (RLHF, DPO), automated red-teaming for adversarial prompt injection, differential privacy preservation, and compliance reporting under ISO/IEC 42001.',
        deepDive: 'Explores constitutional AI architectures, jurisdictional divergence between EU risk-based frameworks and US executive directives, and liability frameworks for open-source weights.',
      },
      masteryStatus: 'STRONG',
    },
    {
      id: 'zero-day-exploit',
      title: 'Zero-Day Vulnerabilities',
      slug: 'zero-day-exploit',
      category: 'Cybersecurity',
      shortDefinition: 'A software vulnerability unknown to the software creator or vendor, leaving zero days of defense between discovery and initial exploitation.',
      fullExplanation: 'A zero-day exploit targets previously undisclosed software flaws before security patches or detection signatures are created. Because defensive mechanisms cannot rely on known vulnerability databases (CVEs), systems must rely on defense-in-depth, least privilege access, and runtime behavioral anomaly detection.',
      prerequisites: [
        { id: 'threat-actor', title: 'Threat Vectors', description: 'Attack pathways utilized by malicious actors to infiltrate target systems.' },
        { id: 'patch-management', title: 'Patch Management', description: 'The operational engineering cycle of testing and deploying software fixes.' }
      ],
      keyTakeaways: [
        'Asymmetric Advantage: Attackers have an advantage until the vendor develops and distributes a verified patch.',
        'Responsible Disclosure: Ethical security researchers disclose flaws privately to vendors under a 90-day patch window.',
        'Zero Trust Defense: Network segmentation and strict identity authentication limit the blast radius of zero-day exploits.',
      ],
      multiLevelExplanations: {
        verySimple: 'A zero-day is like a secret back door in a house that the builder does not know about, but a burglar finds. The builder has had "zero days" to install a lock.',
        beginner: 'A software bug that hackers discover before the developers do, meaning there is no update or fix ready to block the attack.',
        student: 'An unpatched vulnerability in an OS or application. Mitigation requires heuristic monitoring, sandboxing, and zero-trust authentication while the vendor writes a patch.',
        technical: 'Exploitation involves memory corruption (heap spraying, buffer overflows), return-oriented programming (ROP chains), or privilege escalation bypassing ASLR and DEP.',
        deepDive: 'Analyzes vulnerability brokers, memory-safe language migration (Rust in kernel spaces), hardware-enforced pointer authentication, and automated fuzzer suites.',
      },
      masteryStatus: 'NEEDS_LEARNING',
    },
  ];

  const currentConcept = concepts.find((c) => c.slug === activeSlug || c.id === activeSlug) || concepts[0];

  // Learning Paths (Section 10 requirement)
  const learningPaths = [
    {
      id: 'path-macro',
      title: 'Global Macroeconomics & Monetary System',
      category: 'Economy',
      stepCount: 6,
      concepts: ['Inflation', 'Interest Rates', 'Central Bank', 'Monetary Policy', 'Yield Curves'],
    },
    {
      id: 'path-ai-safety',
      title: 'AI Safety, Alignment & Global Law',
      category: 'AI & Tech',
      stepCount: 5,
      concepts: ['Neural Weights', 'Training Corpora', 'AI Governance', 'Algorithmic Audits'],
    },
    {
      id: 'path-cloud-sec',
      title: 'Enterprise Cyber Defense & Identity',
      category: 'Security',
      stepCount: 4,
      concepts: ['OAuth Tokens', 'Zero-Day Flaws', 'Zero Trust', 'Cloud IAM'],
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* 1. Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-50 via-white to-indigo-50 dark:from-purple-950/60 dark:via-slate-900 dark:to-indigo-950/60 border border-purple-200 dark:border-purple-500/30 shadow-sm dark:shadow-glass">
        <div className="flex items-center gap-2 text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider mb-2">
          <GraduationCap className="w-4 h-4" />
          <span>Interactive Concept Library</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Learn the Fundamentals Behind Real-World News
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed mt-2">
          Master the core building blocks so you understand why events happen, how mechanisms function, and what could occur next.
        </p>
      </div>

      {/* 2. Concept Selector Pills */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
          Select Concept To Study:
        </span>
        <div className="flex flex-wrap gap-2">
          {concepts.map((concept) => (
            <Link
              key={concept.id}
              to={`/learn?concept=${concept.slug}`}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 border ${
                currentConcept.id === concept.id
                  ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/25'
                  : 'bg-white text-slate-700 hover:text-slate-950 border-slate-200 hover:border-slate-300 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-white dark:border-white/5 dark:hover:border-white/20'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{concept.title}</span>
              {concept.masteryStatus && (
                <MasteryBadge status={concept.masteryStatus} size="xs" />
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* 3. Main Concept Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111827]/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-glass space-y-6">
        
        {/* Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="concept" size="sm">{currentConcept.category}</Badge>
              {currentConcept.masteryStatus && (
                <MasteryBadge status={currentConcept.masteryStatus} size="sm" />
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {currentConcept.title}
            </h2>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/5">
            {(['overview', 'multi-level', 'prerequisites', 'key-takeaways'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  activeTab === tab
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-transparent'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {tab.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/5 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Plain English Definition</span>
              </span>
              <p className="text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed">
                {currentConcept.shortDefinition}
              </p>
            </div>

            {currentConcept.fullExplanation && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Detailed Explanation
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {currentConcept.fullExplanation}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: 5-Tier Adaptive Multi-Level Explanations */}
        {activeTab === 'multi-level' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-slate-200 dark:border-white/5">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold mr-2">Explanation Depth:</span>
              {(['verySimple', 'beginner', 'student', 'technical', 'deepDive'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setExplanationLevel(lvl)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                    explanationLevel === lvl
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-white dark:border-white/5'
                  }`}
                >
                  {lvl.replace(/([A-Z])/g, ' $1')}
                </button>
              ))}
            </div>

            <div className="p-5 rounded-2xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-500/20 space-y-2">
              <span className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider block">
                {explanationLevel.replace(/([A-Z])/g, ' $1')} Perspective:
              </span>
              <p className="text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
                {currentConcept.multiLevelExplanations?.[explanationLevel]}
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Prerequisites Pathway */}
        {activeTab === 'prerequisites' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>Prerequisite Foundations</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {currentConcept.prerequisites.map((req, idx) => (
                <div key={req.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/5 space-y-1.5">
                  <span className="text-[10px] font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider block">
                    STEP {idx + 1}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{req.title}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{req.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Key Takeaways */}
        {activeTab === 'key-takeaways' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Key Takeaways & Mental Models</span>
            </h3>

            <div className="space-y-2.5">
              {currentConcept.keyTakeaways?.map((takeaway, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 flex items-start gap-3 text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span>{takeaway}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* 4. Structured Learning Paths (Section 10 Requirement) */}
      <div className="space-y-4 pt-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <span>Curated Learning Pathways</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {learningPaths.map((path) => (
            <div key={path.id} className="p-5 rounded-2xl bg-white dark:bg-[#111827]/70 border border-slate-200 dark:border-white/10 hover:border-purple-500/30 shadow-sm dark:shadow-glass transition-all flex flex-col justify-between space-y-4">
              <div>
                <Badge variant="concept" size="xs">{path.category}</Badge>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-2 mb-1">{path.title}</h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">{path.stepCount} interconnected steps</span>

                <div className="flex flex-wrap gap-1.5 mt-3">
                  {path.concepts.map((c, i) => (
                    <span key={i} className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-white/5">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <Button size="xs" variant="secondary" className="w-full" rightIcon={<ArrowRight className="w-3 h-3" />}>
                Start Pathway
              </Button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
