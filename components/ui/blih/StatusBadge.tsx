/**
 * StatusBadge — Blih ERP shared component
 * A generic colored status pill. Ships with pre-built configs for common statuses
 * used across attendance, leave, recruitment, performance, and onboarding modules.
 *
 * Usage:
 *   <StatusBadge status="COMPLETED" />
 *   <StatusBadge status="approved" />
 *   <StatusBadge label="Custom Label" tone="blue" />
 *   <StatusBadge status="pending" map={myCustomMap} />
 */

import React from 'react';
import { cn } from '@/lib/utils';
import type { StatCardTone } from './StatCard';

interface StatusConfig {
  label: string;
  tone: StatCardTone;
}

type StatusMap = Record<string, StatusConfig>;

/** Global status registry — covers all modules. Extend as needed. */
export const DEFAULT_STATUS_MAP: StatusMap = {
  // Attendance
  COMPLETED:              { label: 'Completed',      tone: 'emerald' },
  IN_PROGRESS:            { label: 'In Progress',    tone: 'blue' },
  ON_BREAK:               { label: 'On Break',       tone: 'amber' },
  ON_LEAVE:               { label: 'On Leave',       tone: 'emerald' },
  REMOTE:                 { label: 'Remote',         tone: 'cyan' },
  LATE:                   { label: 'Late',           tone: 'rose' },
  MISSED:                 { label: 'Missed',         tone: 'slate' },
  NOT_STARTED:            { label: 'Not Started',    tone: 'slate' },
  OUTSIDE_RADIUS_ATTEMPT: { label: 'Outside Radius', tone: 'violet' },

  // Leave / General approval
  approved:   { label: 'Approved',   tone: 'emerald' },
  pending:    { label: 'Pending',    tone: 'amber' },
  rejected:   { label: 'Rejected',  tone: 'rose' },
  cancelled:  { label: 'Cancelled', tone: 'slate' },
  dept_head:  { label: 'Dept Head Review', tone: 'amber' },
  admin:      { label: 'Admin Review',     tone: 'violet' },

  // Recruitment
  draft:     { label: 'Draft',      tone: 'slate' },
  active:    { label: 'Active',     tone: 'blue' },
  closed:    { label: 'Closed',     tone: 'rose' },
  published: { label: 'Published',  tone: 'emerald' },
  declined:  { label: 'Declined',   tone: 'rose' },

  // Onboarding / Probation
  not_started: { label: 'Not Started', tone: 'slate' },
  in_progress: { label: 'In Progress', tone: 'blue' },
  completed:   { label: 'Completed',   tone: 'emerald' },
  passed:      { label: 'Passed',      tone: 'emerald' },
  failed:      { label: 'Failed',      tone: 'rose' },
  extended:    { label: 'Extended',    tone: 'amber' },

  // Performance
  on_track:    { label: 'On Track',    tone: 'emerald' },
  at_risk:     { label: 'At Risk',     tone: 'amber' },
  off_track:   { label: 'Off Track',   tone: 'rose' },
  exceeded:    { label: 'Exceeded',    tone: 'blue' },

  // Finance
  paid:        { label: 'Paid',        tone: 'emerald' },
  unpaid:      { label: 'Unpaid',      tone: 'rose' },
  processing:  { label: 'Processing',  tone: 'amber' },
};

const tonePillMap: Record<StatCardTone, string> = {
  blue:    'bg-blue-50 text-blue-700 border-blue-100',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  amber:   'bg-amber-50 text-amber-700 border-amber-100',
  rose:    'bg-rose-50 text-rose-700 border-rose-100',
  violet:  'bg-violet-50 text-violet-700 border-violet-100',
  cyan:    'bg-cyan-50 text-cyan-700 border-cyan-100',
  slate:   'bg-slate-100 text-slate-600 border-slate-200',
};

interface StatusBadgeProps {
  /** Status key looked up in the map */
  status?: string;
  /** Override or use instead of status for a direct label */
  label?: string;
  /** Override tone */
  tone?: StatCardTone;
  /** Custom status map — merged with DEFAULT_STATUS_MAP */
  map?: StatusMap;
  className?: string;
}

export function StatusBadge({ status, label, tone, map, className }: StatusBadgeProps) {
  const mergedMap = map ? { ...DEFAULT_STATUS_MAP, ...map } : DEFAULT_STATUS_MAP;

  const config = status
    ? mergedMap[status] ?? mergedMap[status.toLowerCase()] ?? {
        label: status.replace(/_/g, ' '),
        tone: 'slate' as StatCardTone,
      }
    : { label: label ?? '—', tone: (tone ?? 'slate') as StatCardTone };

  const resolvedTone = tone ?? config.tone;
  const resolvedLabel = label ?? config.label;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-extrabold border',
        tonePillMap[resolvedTone],
        className
      )}
    >
      {resolvedLabel}
    </span>
  );
}
