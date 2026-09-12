import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Flame, 
  Compass, 
  GraduationCap, 
  Bookmark, 
  BarChart3, 
  Globe, 
  Cpu, 
  TrendingUp, 
  ShieldCheck, 
  Landmark, 
  Leaf, 
  Briefcase, 
  Flag,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const mainNavItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/daily-brief', label: 'Daily Brief', icon: Flame, badge: 'Live' },
    { to: '/explore', label: 'Explore Events', icon: Compass },
    { to: '/learn', label: 'Learn Concepts', icon: GraduationCap },
    { to: '/knowledge', label: 'My Knowledge', icon: BarChart3 },
    { to: '/library', label: 'My Library', icon: Bookmark },
  ];

  const categories = [
    { to: '/category/india', label: 'India', icon: Flag, color: 'text-orange-400' },
    { to: '/category/world', label: 'World', icon: Globe, color: 'text-blue-400' },
    { to: '/category/ai-technology', label: 'AI & Technology', icon: Cpu, color: 'text-purple-400' },
    { to: '/category/economy-money', label: 'Economy & Money', icon: TrendingUp, color: 'text-emerald-400' },
    { to: '/category/government-society', label: 'Government & Society', icon: Landmark, color: 'text-yellow-400' },
    { to: '/category/science-environment', label: 'Science & Environment', icon: Leaf, color: 'text-teal-400' },
    { to: '/category/cybersecurity', label: 'Cybersecurity', icon: ShieldCheck, color: 'text-rose-400' },
    { to: '/category/career-industry', label: 'Career & Industry', icon: Briefcase, color: 'text-indigo-400' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose} 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-16 bottom-0 left-0 z-40 w-64 border-r border-white/10 bg-[#0B0F17]/95 backdrop-blur-xl p-4 flex flex-col justify-between overflow-y-auto transition-transform duration-200 ease-in-out
        lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="space-y-6">
          
          {/* Main Navigation */}
          <div>
            <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Navigation
            </div>
            <nav className="space-y-1">
              {mainNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) => `
                    flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all
                    ${isActive 
                      ? 'bg-brand-600/20 text-white border border-brand-500/40 shadow-glow-purple' 
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Categories */}
          <div>
            <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Categories
            </div>
            <nav className="space-y-1">
              {categories.map((cat) => (
                <NavLink
                  key={cat.to}
                  to={cat.to}
                  onClick={onClose}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                    ${isActive 
                      ? 'bg-slate-800 text-white font-semibold' 
                      : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'}
                  `}
                >
                  <cat.icon className={`h-3.5 w-3.5 ${cat.color}`} />
                  <span>{cat.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

        </div>

        {/* Bottom AI Knowledge Companion Pro Tip Card */}
        <div className="mt-6 p-3 rounded-xl bg-gradient-to-br from-brand-950/60 to-slate-900/80 border border-brand-500/20">
          <div className="flex items-center gap-2 text-brand-300 text-xs font-semibold mb-1">
            <Sparkles className="h-3.5 w-3.5 text-brand-400" />
            <span>Learning Loop</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Discover breaking events, drill down into concepts, and take 3-min quizzes to lock in knowledge.
          </p>
        </div>

      </aside>
    </>
  );
};
