/**
 * DataTable — Blih ERP shared component
 * A consistent table shell with header, sticky thead, empty state, and loading skeleton.
 * Renders columns generically — pass your own row renderer for full flexibility.
 *
 * Usage:
 *   <DataTable
 *     title="Daily Check-ins"
 *     subtitle={`${rows.length} employees`}
 *     columns={['Employee', 'Department', 'Status']}
 *     rows={rows}
 *     loading={isLoading}
 *     emptyMessage="No employees match the current filters."
 *     renderRow={(row) => (
 *       <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/60 cursor-pointer">
 *         <td className="px-4 py-3">...</td>
 *       </tr>
 *     )}
 *   />
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { EmptyState } from './EmptyState';
import { Inbox } from 'lucide-react';

interface DataTableProps<T> {
  title?: string;
  subtitle?: string;
  columns: string[];
  rows: T[];
  renderRow: (row: T, index: number) => React.ReactNode;
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  /** Number of skeleton rows to show while loading */
  skeletonRows?: number;
  className?: string;
  /** Extra content rendered in the table header area (right side) */
  headerAction?: React.ReactNode;
}

export function DataTable<T>({
  title,
  subtitle,
  columns,
  rows,
  renderRow,
  loading = false,
  emptyMessage = 'No data available.',
  emptyIcon,
  skeletonRows = 5,
  className,
  headerAction,
}: DataTableProps<T>) {
  return (
    <div className={cn('bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden', className)}>
      {/* Header */}
      {(title || headerAction) && (
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <div>
            {title && (
              <p className="text-[12px] font-extrabold text-slate-900 leading-none">{title}</p>
            )}
            {subtitle && (
              <p className="text-[11px] text-slate-500 font-semibold mt-0.5">{subtitle}</p>
            )}
          </div>
          {headerAction && (
            <div className="flex items-center gap-2 flex-shrink-0">{headerAction}</div>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-[10px] uppercase tracking-wider text-slate-400 font-bold whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: skeletonRows }).map((_, i) => (
                <tr key={i} className="border-b border-slate-100">
                  {columns.map((col) => (
                    <td key={col} className="px-4 py-3">
                      <div className="h-3 bg-slate-100 rounded-full animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState
                    icon={emptyIcon ?? <Inbox />}
                    title={emptyMessage}
                    compact
                  />
                </td>
              </tr>
            ) : (
              rows.map((row, i) => renderRow(row, i))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
