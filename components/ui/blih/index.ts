/**
 * Blih ERP — Shared UI Component Library
 *
 * All components are built on shadcn/Radix primitives and styled to match
 * the Blih ERP design language: rounded-2xl panels, blue-600 primary,
 * slate neutrals, font-black headings.
 *
 * Import from this barrel:
 *   import { StatCard, StatCardGrid, PageHeader, StatusBadge } from '@/components/ui/blih';
 */

// ── Stat / Metric cards ──────────────────────────────────────────────────────
export { StatCard, StatCardGrid } from './StatCard';
export type { StatCardTone } from './StatCard';

// ── Page / section headers ───────────────────────────────────────────────────
export { PageHeader } from './PageHeader';

// ── Status pills ─────────────────────────────────────────────────────────────
export { StatusBadge, DEFAULT_STATUS_MAP } from './StatusBadge';

// ── Content panels ───────────────────────────────────────────────────────────
export { SectionCard } from './SectionCard';

// ── User avatars ─────────────────────────────────────────────────────────────
export { UserAvatar } from './UserAvatar';
export type { AvatarSize, AvatarColor } from './UserAvatar';

// ── Tab navigation ───────────────────────────────────────────────────────────
export { TabSwitcher } from './TabSwitcher';

// ── Empty states ─────────────────────────────────────────────────────────────
export { EmptyState } from './EmptyState';

// ── Data tables ──────────────────────────────────────────────────────────────
export { DataTable } from './DataTable';

// ── Form helpers ─────────────────────────────────────────────────────────────
export { FormField, FormRow } from './FormField';

// ── Confirm / destructive dialogs ────────────────────────────────────────────
export { ConfirmDialog } from './ConfirmDialog';
export { InputDialog } from './InputDialog';

// ── Loading / skeleton states ────────────────────────────────────────────────
export { LoadingSpinner, PageLoadingSpinner, SkeletonLine, SkeletonBlock } from './LoadingSpinner';

// ── Filter bar ───────────────────────────────────────────────────────────────
export { FilterBar } from './FilterBar';

// ── Inline alerts ────────────────────────────────────────────────────────────
export { InfoAlert } from './InfoAlert';
export type { InfoAlertVariant } from './InfoAlert';
