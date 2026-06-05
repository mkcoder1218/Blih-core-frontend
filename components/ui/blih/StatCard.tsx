/**
 * StatCard — Blih ERP shared component
 * A metric card with a label, value, optional trend, and a tinted icon badge.
 *
 * Usage:
 *   <StatCard label="Total Employees" value={412} icon={<Users />} tone="blue" />
 *   <StatCard label="Pending" value={7} icon={<Clock />} tone="amber" trend="+3 this week" />
 */

import React from 'react';
import { cn } from '@/lib/utils';

export type StatCardTone =
  | 'blue'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'violet'
  | 'cyan'
  | 'slate';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  tone?: StatCardTone;
  /** Small text shown below the value, e.g. "+3 this week" */
  trend?: string;
  trendPositive?: boolean;
  className?: string;
}

const toneMap: Record<StatCardTone, { icon: string; trend: string }> = {
  blue:    { icon: 'bg-blue-50 text-blue-600 border border-blue-100',     trend: 'text-blue-600' },
  emerald: { icon: 'bg-emerald-50 text-emerald-600 border border-emerald-100', trend: 'text-emerald-600' },
  amber:   { icon: 'bg-amber-50 text-amber-600 border border-amber-100',  trend: 'text-amber-600' },
  rose:    { icon: 'bg-rose-50 text-rose-600 border border-rose-100',     trend: 'text-rose-600' },
  violet:  { icon: 'bg-violet-50 text-violet-600 border border-violet-100', trend: 'text-violet-600' },
  cyan:    { icon: 'bg-cyan-50 text-cyan-600 border border-cyan-100',     trend: 'text-cyan-600' },
  slate:   { icon: 'bg-slate-100 text-slate-600 border border-slate-200', trend: 'text-slate-500' },
};

export function StatCard({
  label,
  value,
  icon,
  tone = 'slate',
  trend,
  trendPositive,
  className,
}: StatCardProps) {
  const colors = toneMap[tone];

  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-slate-100 shadow-xs p-4 flex justify-between items-start gap-3',
        className
      )}
    >
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none">
          {label}
        </p>
        <p className="text-2xl font-black text-slate-900 mt-1.5 tracking-tight leading-none">
          {value}
        </p>
        {trend && (
          <p
            className={cn(
              'text-[10px] font-semibold mt-1.5',
              trendPositive !== undefined
                ? trendPositive
                  ? 'text-emerald-600'
                  : 'text-rose-500'
                : colors.trend
            )}
          >
            {trend}
          </p>
        )}
      </div>
      {icon && (
        <div
          className={cn(
            'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
            colors.icon
          )}
        >
          {icon}
        </div>
      )}
    </div>
  );
}

/** Grid wrapper that automatically lays out multiple StatCards */
export function StatCardGrid({
  children,
  cols = 4,
  className,
}: {
  children: React.ReactNode;
  cols?: 2 | 3 | 4 | 5;
  className?: string;
}) {
  const colCls: Record<number, string> = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-2 lg:grid-cols-5',
  };
  return (
    <div className={cn('grid gap-3', colCls[cols], className)}>
      {children}
    </div>
  );
}
