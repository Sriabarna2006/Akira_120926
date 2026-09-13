import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Radio, Sparkles, Compass, GraduationCap, BarChart3 } from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const navItems = [
    { to: '/', label: 'Home', icon: LayoutDashboard },
    { to: '/live', label: 'Live', icon: Radio, badge: '10' },
    { to: '/daily-brief', label: 'Brief', icon: Sparkles },
    { to: '/explore', label: 'Explore', icon: Compass },
    { to: '/learn', label: 'Learn', icon: GraduationCap },
    { to: '/knowledge', label: 'Knowledge', icon: BarChart3 },
  ];

  return (
    <nav 
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 dark:bg-[#0B0F17]/95 backdrop-blur-xl border-t border-slate-200 dark:border-white/10 px-2 py-1.5 safe-bottom"
    >
      <div className="flex items-center justify-around">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `
              flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative
              ${isActive
                ? 'text-cyan-600 dark:text-cyan-400 font-semibold scale-105'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }
            `}
          >
            <div className="relative">
              <item.icon className="w-5 h-5" />
              {item.badge && (
                <span className="absolute -top-1 -right-2 text-[9px] font-bold px-1 rounded-full bg-rose-500 text-white animate-pulse">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
