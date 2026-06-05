/**
 * PageHeader — Blih ERP shared component
 * Consistent section/page headers with title, subtitle, eye-candy badge, and action slots.
 *
 * Usage:
 *   <PageHeader
 *     eyebrow="Leave Management"
 *     title="Leave Requests"
 *     description="Review and manage employee leave requests."
 *     actions={<Button onClick={openModal}><Plus /> New Request</Button>}
 *   />
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  /** Small uppercase label above the title */
  eyebrow?: string;
  eyebrowTone?: 'blue' | 'violet' | 'emerald' | 'amber' | 'rose' | 'slate';
  title: string;
  description?: string;
  /** Right-aligned action area — pass buttons / icon buttons here */
  actions?: React.ReactNode;
  className?: string;
}

const eyebrowColors = {
  blue:    'bg-blue-50 border-blue-100 text-blue-700',
  violet:  'bg-violet-50 border-violet-100 text-violet-700',
  emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
  amber:   'bg-amber-50 border-amber-100 text-amber-700',
  rose:    'bg-rose-50 border-rose-100 text-rose-700',
  slate:   'bg-slate-50 border-slate-200 text-slate-600',
};

export function PageHeader({
  eyebrow,
  eyebrowTone = 'blue',
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center justify-between gap-4',
        'bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_5px_22px_rgba(0,0,0,0.015)]',
        className
      )}
    >
      <div>
        {eyebrow && (
          <span
            className={cn(
              'inline-flex items-center border text-[9.5px] font-bold tracking-widest px-2.5 py-1 rounded-full uppercase mb-1.5',
              eyebrowColors[eyebrowTone]
            )}
          >
            {eyebrow}
          </span>
        )}
        <h2 className="text-xl font-black text-slate-900 tracking-tight leading-tight">
          {title}
        </h2>
        {description && (
          <p className="text-xs text-slate-400 font-medium mt-0.5 leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
      )}
    </div>
  );
}
