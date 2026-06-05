/**
 * SectionCard — Blih ERP shared component
 * A white rounded panel for grouping content, with optional header row.
 *
 * Usage:
 *   <SectionCard title="Salary Adjustments" icon={<DollarSign />} action={<Button>...</Button>}>
 *     content here
 *   </SectionCard>
 *
 *   // Plain (no header)
 *   <SectionCard>content here</SectionCard>
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface SectionCardProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  /** Accent border on the card — matches tone colors */
  accent?: 'blue' | 'emerald' | 'amber' | 'rose' | 'violet' | 'none';
  children: React.ReactNode;
  /** Extra padding variant */
  padding?: 'default' | 'none' | 'sm';
  className?: string;
}

const accentBorderMap = {
  blue:    'border-blue-500/20',
  emerald: 'border-emerald-500/20',
  amber:   'border-amber-500/20',
  rose:    'border-rose-500/20',
  violet:  'border-violet-500/20',
  none:    'border-slate-100',
};

const paddingMap = {
  default: 'p-5',
  sm:      'p-3',
  none:    '',
};

export function SectionCard({
  title,
  description,
  icon,
  action,
  accent = 'none',
  children,
  padding = 'default',
  className,
}: SectionCardProps) {
  const hasHeader = title || icon || action;

  return (
    <div
      className={cn(
        'bg-white rounded-2xl border shadow-xs',
        accentBorderMap[accent],
        className
      )}
    >
      {hasHeader && (
        <div
          className={cn(
            'flex items-center justify-between gap-3 border-b border-slate-100',
            paddingMap[padding === 'none' ? 'default' : padding]
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            {icon && (
              <span className="text-blue-600 flex-shrink-0">{icon}</span>
            )}
            <div className="min-w-0">
              {title && (
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider leading-none">
                  {title}
                </h4>
              )}
              {description && (
                <p className="text-[10px] text-slate-400 font-medium mt-0.5 leading-relaxed">
                  {description}
                </p>
              )}
            </div>
          </div>
          {action && (
            <div className="flex items-center gap-2 flex-shrink-0">{action}</div>
          )}
        </div>
      )}
      <div className={cn(paddingMap[padding])}>{children}</div>
    </div>
  );
}
