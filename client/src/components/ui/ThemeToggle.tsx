import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Laptop, Check } from 'lucide-react';
import { useTheme, ThemeMode } from '../../context/ThemeContext';

export interface ThemeToggleProps {
  className?: string;
  variant?: 'button' | 'dropdown' | 'segmented';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  variant = 'dropdown',
}) => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options: { id: ThemeMode; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'light',
      label: 'Bright / Light',
      icon: <Sun className="w-4 h-4 text-amber-500" />,
      desc: 'High clarity & crisp light surfaces',
    },
    {
      id: 'dark',
      label: 'Dark Mode',
      icon: <Moon className="w-4 h-4 text-cyan-400" />,
      desc: 'Deep OLED & neon glass aesthetics',
    },
    {
      id: 'system',
      label: 'Default / System',
      icon: <Laptop className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />,
      desc: 'Matches your OS appearance',
    },
  ];

  if (variant === 'segmented') {
    return (
      <div className={`flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 ${className}`}>
        {options.map((opt) => {
          const isActive = theme === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setTheme(opt.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {opt.icon}
              <span>{opt.label.split('/')[0].trim()}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-white/10 transition-colors"
        title={`Theme: ${theme === 'system' ? `Default (System - ${resolvedTheme})` : theme === 'light' ? 'Bright / Light' : 'Dark'}`}
        aria-label="Select color theme"
      >
        {resolvedTheme === 'light' ? (
          <Sun className="w-4 h-4 text-amber-500" />
        ) : (
          <Moon className="w-4 h-4 text-cyan-400" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/15 shadow-2xl p-1.5 z-50 animate-scaleUp">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-white/5 mb-1">
            Appearance Theme
          </div>

          <div className="space-y-0.5">
            {options.map((opt) => {
              const isSelected = theme === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setTheme(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-cyan-50 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 font-bold border border-cyan-200 dark:border-cyan-500/30'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {opt.icon}
                    <div className="text-left">
                      <span className="block font-semibold">{opt.label}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">{opt.desc}</span>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
