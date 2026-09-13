import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Compass, 
  Globe, 
  Flag, 
  Landmark, 
  Cpu, 
  TrendingUp, 
  Landmark as PoliticsIcon, 
  Leaf, 
  GraduationCap, 
  HeartPulse, 
  ShieldCheck, 
  Rocket, 
  Briefcase,
  Layers,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { SearchBar } from '../components/common/SearchBar';

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  accentBg: string;
  conceptCount: number;
}

export const ExplorePage: React.FC = () => {
  // Comprehensive 14 categories matching Section 9 spec
  const categories: CategoryItem[] = [
    {
      id: 'cat-world',
      name: 'World Affairs',
      slug: 'world',
      description: 'Geopolitics, global alliances, multi-lateral diplomacy, and international trade.',
      icon: Globe,
      color: 'text-blue-600 dark:text-blue-400',
      accentBg: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20',
      conceptCount: 24,
    },
    {
      id: 'cat-india',
      name: 'India & National Policy',
      slug: 'india',
      description: 'Federal governance, parliamentary legislation, national infrastructure, and welfare.',
      icon: Flag,
      color: 'text-orange-600 dark:text-orange-400',
      accentBg: 'bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20',
      conceptCount: 32,
    },
    {
      id: 'cat-tn',
      name: 'Tamil Nadu & Regional',
      slug: 'tamil-nadu',
      description: 'State industrial corridors, electronics manufacturing, education initiatives, and urban growth.',
      icon: Landmark,
      color: 'text-amber-600 dark:text-amber-400',
      accentBg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20',
      conceptCount: 18,
    },
    {
      id: 'cat-ai',
      name: 'AI & Machine Learning',
      slug: 'ai-technology',
      description: 'Generative models, neural architectures, AI governance, and cognitive robotics.',
      icon: Cpu,
      color: 'text-purple-600 dark:text-purple-400',
      accentBg: 'bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20',
      conceptCount: 45,
    },
    {
      id: 'cat-tech',
      name: 'Technology & Hardware',
      slug: 'technology',
      description: 'Semiconductor fabs, quantum computing, consumer electronics, and telecom networks.',
      icon: Layers,
      color: 'text-cyan-600 dark:text-cyan-400',
      accentBg: 'bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20',
      conceptCount: 28,
    },
    {
      id: 'cat-economy',
      name: 'Economy & Monetary Policy',
      slug: 'economy-money',
      description: 'Central banks, interest rate corridors, inflation indices, and currency mechanisms.',
      icon: TrendingUp,
      color: 'text-emerald-600 dark:text-emerald-400',
      accentBg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20',
      conceptCount: 36,
    },
    {
      id: 'cat-business',
      name: 'Business & Markets',
      slug: 'business',
      description: 'Corporate earnings, venture financing, supply chain logistics, and market equities.',
      icon: Briefcase,
      color: 'text-indigo-600 dark:text-indigo-400',
      accentBg: 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20',
      conceptCount: 22,
    },
    {
      id: 'cat-politics',
      name: 'Politics & Governance',
      slug: 'government-society',
      description: 'Constitutional law, democratic institutions, civic rights, and judicial rulings.',
      icon: PoliticsIcon,
      color: 'text-yellow-600 dark:text-yellow-400',
      accentBg: 'bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/20',
      conceptCount: 20,
    },
    {
      id: 'cat-science',
      name: 'Science & Environment',
      slug: 'science-environment',
      description: 'Climate science, renewable energy transition, biodiversity, and material physics.',
      icon: Leaf,
      color: 'text-teal-600 dark:text-teal-400',
      accentBg: 'bg-teal-50 dark:bg-teal-500/10 border-teal-200 dark:border-teal-500/20',
      conceptCount: 26,
    },
    {
      id: 'cat-security',
      name: 'Cybersecurity & Defense',
      slug: 'cybersecurity',
      description: 'Zero-day vulnerabilities, cryptographic protocols, cloud identity, and cyber defense.',
      icon: ShieldCheck,
      color: 'text-rose-600 dark:text-rose-400',
      accentBg: 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20',
      conceptCount: 19,
    },
    {
      id: 'cat-space',
      name: 'Space & Deep Tech',
      slug: 'space',
      description: 'Orbital launch vehicles, planetary science, satellite communication, and space tech.',
      icon: Rocket,
      color: 'text-sky-600 dark:text-sky-400',
      accentBg: 'bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/20',
      conceptCount: 15,
    },
    {
      id: 'cat-health',
      name: 'Health & BioTech',
      slug: 'health',
      description: 'Genomics, public healthcare policy, pharmaceutical innovations, and immunology.',
      icon: HeartPulse,
      color: 'text-pink-600 dark:text-pink-400',
      accentBg: 'bg-pink-50 dark:bg-pink-500/10 border-pink-200 dark:border-pink-500/20',
      conceptCount: 17,
    },
    {
      id: 'cat-education',
      name: 'Education & Learning',
      slug: 'education',
      description: 'EdTech models, cognitive learning frameworks, academic research, and skill training.',
      icon: GraduationCap,
      color: 'text-lime-600 dark:text-lime-400',
      accentBg: 'bg-lime-50 dark:bg-lime-500/10 border-lime-200 dark:border-lime-500/20',
      conceptCount: 14,
    },
  ];

  const popularConceptPills = [
    { name: 'Monetary Policy', slug: 'monetary-policy', category: 'Economy' },
    { name: 'AI Governance', slug: 'ai-governance', category: 'AI & Tech' },
    { name: 'Zero-Day Exploits', slug: 'zero-day-exploit', category: 'Security' },
    { name: 'Semiconductor Fabs', slug: 'semiconductor-fabs', category: 'Hardware' },
    { name: 'Carbon Credits', slug: 'carbon-credits', category: 'Environment' },
    { name: 'Inflation Indices', slug: 'inflation-indices', category: 'Economy' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* 1. Header & Exploration Mission */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-50 via-white to-cyan-50 dark:from-indigo-950/60 dark:via-slate-900 dark:to-cyan-950/60 border border-indigo-200 dark:border-indigo-500/30 shadow-sm dark:shadow-glass">
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider mb-2">
          <Compass className="w-4 h-4" />
          <span>Knowledge Discovery Engine</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Explore by Topic, Region & Concept
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed mt-2">
          Discover real-world developments categorized by domain. Dive directly into concepts, regional streams, or industry topics.
        </p>

        {/* Integrated Search Bar */}
        <div className="mt-6 max-w-xl">
          <SearchBar placeholder="Search any topic, domain, region, or concept..." />
        </div>
      </div>

      {/* 2. Popular Concepts Cloud */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#111827]/60 border border-slate-200 dark:border-white/10 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Popular Concepts to Learn</span>
          </div>
          <Link to="/learn" className="text-xs font-bold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300">
            View Concept Library →
          </Link>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {popularConceptPills.map((c) => (
            <Link
              key={c.slug}
              to={`/learn?concept=${c.slug}`}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-200 dark:hover:text-white dark:border-white/5 transition-all group font-semibold text-xs"
            >
              <span>{c.name}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-300 font-normal">({c.category})</span>
            </Link>
          ))}
        </div>
      </div>

      {/* 3. Comprehensive Categories Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>All Domains & Knowledge Verticals</span>
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">({categories.length} Categories)</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.id}
                to={`/category/${cat.slug}`}
                className="group flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-[#111827]/70 backdrop-blur-xl border border-slate-200 dark:border-white/10 hover:border-cyan-500/40 hover:-translate-y-1 transition-all duration-200 shadow-sm dark:shadow-glass"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className={`p-2.5 rounded-xl ${cat.accentBg} ${cat.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                      {cat.conceptCount} concepts
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors mb-1.5">
                    {cat.name}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                    {cat.description}
                  </p>
                </div>

                <div className="pt-4 mt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                  <span>Explore Domain</span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

    </div>
  );
};
