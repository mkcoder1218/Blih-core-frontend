/**
 * TabSwitcher — Blih ERP shared component
 * The pill-style horizontal tab switcher used across all module views.
 * Replaces ad-hoc button groups built with raw Tailwind throughout the app.
 *
 * Usage:
 *   const [tab, setTab] = useState('salary');
 *
 *   <TabSwitcher
 *     tabs={[
 *       { id: 'salary',  label: 'Salary' },
 *       { id: 'payroll', label: 'Payroll' },
 *     ]}
 *     active={tab}
 *     onChange={setTab}
 *   />
 *
 *   // With badges
 *   <TabSwitcher tabs={[{ id: 'requests', label: 'Requests', badge: 4 }]} ... />
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface TabItem {
  id: string;
  label: string;
  /** Numeric notification badge */
  badge?: number;
  /** Disable this specific tab */
  disabled?: boolean;
}

interface TabSwitcherProps {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
  /** 'pill' = rounded pill bg on active (default), 'underline' = bottom border */
  variant?: 'pill' | 'underline';
  size?: 'sm' | 'md';
  className?: string;
}

export function TabSwitcher({
  tabs,
  active,
  onChange,
  variant = 'pill',
  size = 'md',
  className,
}: TabSwitcherProps) {
  if (variant === 'underline') {
    return (
      <div className={cn('flex items-center gap-0 border-b border-slate-100', className)}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && onChange(tab.id)}
            disabled={tab.disabled}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 -mb-px transition-all cursor-pointer select-none',
              tab.id === active
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800',
              tab.disabled && 'opacity-40 cursor-not-allowed'
            )}
          >
            {tab.label}
            {tab.badge != null && tab.badge > 0 && (
              <span
                className={cn(
                  'text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] inline-flex items-center justify-center',
                  tab.id === active
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 text-slate-600'
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  // pill variant (default)
  return (
    <div
      className={cn(
        'flex items-center gap-1 bg-white border border-slate-100 rounded-2xl p-1.5 w-fit shadow-xs flex-wrap',
        className
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => !tab.disabled && onChange(tab.id)}
          disabled={tab.disabled}
          className={cn(
            'flex items-center gap-1.5 rounded-xl font-extrabold transition-all cursor-pointer select-none whitespace-nowrap',
            size === 'sm' ? 'px-3 py-1.5 text-[10px]' : 'px-5 py-2 text-xs',
            tab.id === active
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50',
            tab.disabled && 'opacity-40 cursor-not-allowed'
          )}
        >
          {tab.label}
          {tab.badge != null && tab.badge > 0 && (
            <span
              className={cn(
                'text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] inline-flex items-center justify-center',
                tab.id === active
                  ? 'bg-white/25 text-white'
                  : 'bg-blue-600 text-white'
              )}
            >
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
