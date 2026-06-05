/**
 * EmptyState — Blih ERP shared component
 * Consistent empty content placeholder used when lists/tables have no data.
 *
 * Usage:
 *   <EmptyState
 *     icon={<Inbox />}
 *     title="No requests yet"
 *     description="Submitted leave requests will appear here."
 *     action={<Button onClick={open}>New Request</Button>}
 *   />
 *
 *   // Compact variant (inside a table cell)
 *   <EmptyState title="No records" compact />
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  /** Compact mode — smaller spacing, no card background */
  compact?: boolean;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact
          ? 'py-8 px-4'
          : 'py-16 px-8 bg-white rounded-3xl border border-slate-100',
        className
      )}
    >
      {icon && (
        <div className="text-slate-300 mb-4 [&>svg]:w-10 [&>svg]:h-10 [&>svg]:mx-auto">
          {icon}
        </div>
      )}
      <p
        className={cn(
          'font-semibold text-slate-500',
          compact ? 'text-xs' : 'text-sm'
        )}
      >
        {title}
      </p>
      {description && (
        <p className="text-[11px] text-slate-400 font-medium mt-1 max-w-xs leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
