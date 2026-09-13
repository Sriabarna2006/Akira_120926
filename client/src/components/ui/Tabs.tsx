import { ReactNode } from 'react';

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  icon?: ReactNode;
  badge?: string | number;
}

export interface TabsProps<T extends string = string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (tabId: T) => void;
  variant?: 'pills' | 'underline' | 'buttons';
  size?: 'sm' | 'md';
  className?: string;
}

export const Tabs = <T extends string>({
  tabs,
  activeTab,
  onChange,
  variant = 'pills',
  size = 'md',
  className = '',
}: TabsProps<T>) => {
  const sizeStyles = {
    sm: 'text-xs py-1.5 px-3',
    md: 'text-sm py-2 px-4',
  };

  if (variant === 'underline') {
    return (
      <div className={`flex border-b border-slate-200 dark:border-white/10 gap-4 overflow-x-auto ${className}`}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`
                flex items-center gap-2 pb-3 -mb-px font-semibold transition-all border-b-2 whitespace-nowrap
                ${sizeStyles[size]}
                ${isActive
                  ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                }
              `}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Default pills
  return (
    <div className={`flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 overflow-x-auto ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              flex items-center gap-2 rounded-lg font-semibold transition-all whitespace-nowrap
              ${sizeStyles[size]}
              ${isActive
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50'
              }
            `}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'}`}>
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
