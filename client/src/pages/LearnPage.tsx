import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { GraduationCap, BookOpen, CheckCircle2, Sparkles } from 'lucide-react';

export const LearnPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const activeConceptSlug = searchParams.get('concept') || 'monetary-policy';
  const [activeTab, setActiveTab] = useState<'overview' | 'prerequisites' | 'deep-dive'>('overview');

  const concepts = [
    {
      id: 'monetary-policy',
      title: 'Monetary Policy',
      category: 'Economy & Money',
      definition: 'The strategy and tools used by a country\'s central bank to control the overall money supply and achieve sustainable economic growth.',
      prerequisites: [
        { id: 'inflation', title: 'Inflation', desc: 'The generalized rise in goods/services prices.' },
        { id: 'interest-rates', title: 'Interest Rates', desc: 'The cost of capital and reward for saving.' },
        { id: 'central-bank', title: 'Central Bank', desc: 'The apex regulatory monetary authority.' }
      ],
      keyTakeaways: [
        'Expansionary Policy: Lowers rates to boost hiring and business activity.',
        'Contractionary Policy: Raises rates to tame runaway consumer inflation.',
        'Transmission Lag: Takes 6–18 months for interest rate changes to fully permeate the real economy.'
      ]
    },
    {
      id: 'ai-governance',
      title: 'AI Governance & Compliance',
      category: 'AI & Technology',
      definition: 'The legal, ethical, and operational framework ensuring artificial intelligence systems are safe, explainable, unbiased, and aligned with human values.',
      prerequisites: [
        { id: 'machine-learning', title: 'Machine Learning Basics', desc: 'How neural networks learn patterns from data.' },
        { id: 'data-privacy', title: 'Data Privacy Regulations', desc: 'GDPR, DPDP Act, and user consent principles.' }
      ],
      keyTakeaways: [
        'Risk-Based Classification: Systems are audited based on potential societal harm.',
        'Algorithmic Transparency: High-stakes models must provide audit logs.',
        'Copyright & Training Data: Legal liability around web-scraped training datasets.'
      ]
    },
    {
      id: 'zero-day-exploit',
      title: 'Zero-Day Vulnerabilities',
      category: 'Cybersecurity',
      definition: 'A software security flaw unknown to the vendor, meaning there are "zero days" between disclosure and the availability of a protective patch.',
      prerequisites: [
        { id: 'threat-actor', title: 'Threat Vectors', desc: 'Common routes malicious actors use to penetrate systems.' },
        { id: 'patch-management', title: 'Patch Management', desc: 'The lifecycle of developing and deploying security fixes.' }
      ],
      keyTakeaways: [
        'Asymmetric Advantage: Attackers can exploit undefended systems before patches exist.',
        'Responsible Disclosure: Ethical researchers notify vendors before public release.',
        'Defense in Depth: Layered security mitigates impact even when zero-days occur.'
      ]
    }
  ];

  const currentConcept = concepts.find(c => c.id === activeConceptSlug) || concepts[0];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
          <GraduationCap className="h-4 w-4" />
          <span>Interactive Concept Library</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          Learn the Foundation Behind the News
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Master the core building blocks so you never feel lost reading real-world developments.
        </p>
      </div>

      {/* Concept Selector Pills */}
      <div className="flex flex-wrap gap-2">
        {concepts.map((concept) => (
          <Link
            key={concept.id}
            to={`/learn?concept=${concept.id}`}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              currentConcept.id === concept.id
                ? 'bg-brand-600 text-white shadow-glow-purple'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>{concept.title}</span>
          </Link>
        ))}
      </div>

      {/* Main Concept Detail Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/10 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
              {currentConcept.category}
            </span>
            <h2 className="text-2xl font-bold text-white mt-1.5">{currentConcept.title}</h2>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'overview' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('prerequisites')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'prerequisites' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Prerequisites
            </button>
          </div>
        </div>

        {/* Definition */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-white/5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-300 block mb-1">
            Definition in Plain English:
          </span>
          <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
            {currentConcept.definition}
          </p>
        </div>

        {/* Prerequisites Stepper */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>Learning Pathway & Prerequisites</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {currentConcept.prerequisites.map((req, i) => (
              <div key={req.id} className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">
                  Step {i + 1}
                </span>
                <h4 className="text-sm font-bold text-white">{req.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{req.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Key Takeaways */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Key Takeaways</span>
          </h3>

          <div className="space-y-2">
            {currentConcept.keyTakeaways.map((item, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-slate-900/40 border border-white/5 text-xs sm:text-sm text-slate-300 flex items-start gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
