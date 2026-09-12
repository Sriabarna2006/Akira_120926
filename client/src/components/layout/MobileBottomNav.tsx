import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Radio, Flame, Sparkles, BarChart3 } from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const navItems = [
    { to: '/', label: 'Home', icon: LayoutDashboard },
    { to: '/live', label: 'Live', icon: Radio, badge: 'Top 10' },
    { to: '/all-news', label: 'News', icon: Flame },
    { to: '/daily-brief', label: 'Brief', icon: Sparkles },
    { to: '/knowledge', label: 'Mastery', icon: BarChart3 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[#0B0F17]/95 backdrop-blur-xl border-t border-white/10 px-2 py-1.5 safe-bottom">
      <div className="flex items-center justify-around">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `
              flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative
              ${isActive
                ? 'text-cyan-400 font-semibold scale-105'
                : 'text-slate-400 hover:text-slate-200'
              }
            `}
          >
            <div className="relative">
              <item.icon className="w-5 h-5" />
              {item.badge && (
                <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </div>
            <span className="text-[10px] mt-0.5">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
