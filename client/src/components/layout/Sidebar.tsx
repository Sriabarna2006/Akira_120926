import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Radio, 
  Sparkles, 
  Compass, 
  GraduationCap, 
  Bookmark, 
  BarChart3, 
  User,
  Globe, 
  Cpu, 
  TrendingUp, 
  Landmark, 
  Leaf, 
  ShieldCheck, 
  Briefcase, 
  Flag,
  Rocket,
  HeartPulse,
  BookOpen
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  // 8 Primary Navigation Items (Exact Phase 2 Spec)
  const primaryNavItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/live', label: 'Live & Trending', icon: Radio, badge: 'Top 10' },
    { to: '/daily-brief', label: 'Daily Brief', icon: Sparkles },
    { to: '/explore', label: 'Explore', icon: Compass },
    { to: '/learn', label: 'Learn', icon: GraduationCap },
    { to: '/library', label: 'My Library', icon: Bookmark },
    { to: '/knowledge', label: 'My Knowledge', icon: BarChart3 },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  // Structured Categories
  const categories = [
    { to: '/category/world', label: 'World', icon: Globe, color: 'text-blue-500 dark:text-blue-400' },
    { to: '/category/india', label: 'India', icon: Flag, color: 'text-orange-500 dark:text-orange-400' },
    { to: '/category/tamil-nadu', label: 'Tamil Nadu', icon: Landmark, color: 'text-amber-500 dark:text-amber-400' },
    { to: '/category/ai-technology', label: 'AI & Tech', icon: Cpu, color: 'text-purple-500 dark:text-purple-400' },
    { to: '/category/economy-money', label: 'Economy', icon: TrendingUp, color: 'text-emerald-500 dark:text-emerald-400' },
    { to: '/category/government-society', label: 'Governance', icon: BookOpen, color: 'text-yellow-600 dark:text-yellow-400' },
    { to: '/category/science-environment', label: 'Science & Nature', icon: Leaf, color: 'text-teal-500 dark:text-teal-400' },
    { to: '/category/cybersecurity', label: 'Cybersecurity', icon: ShieldCheck, color: 'text-rose-500 dark:text-rose-400' },
    { to: '/category/career-industry', label: 'Career & Industry', icon: Briefcase, color: 'text-indigo-500 dark:text-indigo-400' },
    { to: '/category/space', label: 'Space & Deep Tech', icon: Rocket, color: 'text-sky-500 dark:text-cyan-400' },
    { to: '/category/health', label: 'Health & Bio', icon: HeartPulse, color: 'text-pink-500 dark:text-pink-400' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose} 
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-16 bottom-0 left-0 z-40 w-64 border-r border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#0B0F17]/95 backdrop-blur-xl p-4 flex flex-col justify-between overflow-y-auto transition-transform duration-200 ease-in-out
        lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="space-y-6">
          
          {/* Main 8-Item Navigation */}
          <div>
            <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Primary Navigation
            </div>
            <nav className="space-y-1">
              {primaryNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) => `
                    flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all
                    ${isActive 
                      ? 'bg-cyan-50 text-cyan-900 border border-cyan-300 dark:bg-gradient-to-r dark:from-cyan-500/20 dark:to-indigo-500/20 dark:text-white dark:border-cyan-500/40 shadow-sm font-semibold' 
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-white'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 shrink-0 text-cyan-600 dark:text-cyan-400" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30 animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Categories Grid/List */}
          <div>
            <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Explore Categories
            </div>
            <nav className="space-y-0.5">
              {categories.map((cat) => (
                <NavLink
                  key={cat.to}
                  to={cat.to}
                  onClick={onClose}
                  className={({ isActive }) => `
                    flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                    ${isActive 
                      ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white font-semibold' 
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/40 dark:hover:text-slate-200'}
                  `}
                >
                  <cat.icon className={`h-3.5 w-3.5 ${cat.color} shrink-0`} />
                  <span className="truncate">{cat.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

        </div>

        {/* Bottom AKIRA Philosophy & Loop Card */}
        <div className="mt-6 p-3.5 rounded-xl bg-gradient-to-br from-cyan-50 via-indigo-50 to-white dark:from-cyan-950/40 dark:via-indigo-950/30 dark:to-slate-900/80 border border-cyan-200 dark:border-cyan-500/20">
          <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-300 text-xs font-bold mb-1">
            <Sparkles className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>AKIRA Core Loop</span>
          </div>
          <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed font-mono">
            DISCOVER → UNDERSTAND → LEARN → TEST
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            "See the world. Understand it. Learn from it."
          </p>
        </div>

      </aside>
    </>
  );
};
