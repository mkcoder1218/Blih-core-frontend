/**
 * FilterBar — Blih ERP shared component
 * A consistent search + filter row used at the top of list/table views.
 * Wraps the pattern repeated across HrAttendanceCheckInsPage, RecruitmentRequests, etc.
 *
 * Usage:
 *   <FilterBar
 *     search={search}
 *     onSearchChange={setSearch}
 *     searchPlaceholder="Search employees..."
 *     filters={[
 *       {
 *         value: statusFilter,
 *         onChange: setStatusFilter,
 *         placeholder: 'All Statuses',
 *         options: [
 *           { value: 'all', label: 'All' },
 *           { value: 'active', label: 'Active' },
 *         ],
 *       },
 *     ]}
 *     actions={<Button onClick={open}><Plus /> New</Button>}
 *   />
 */

import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterSelect {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  options: FilterOption[];
  /** Width class, e.g. 'w-40' */
  width?: string;
}

interface FilterBarProps {
  search?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  filters?: FilterSelect[];
  /** Extra items on the right (e.g. action buttons) */
  actions?: React.ReactNode;
  className?: string;
}

export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  filters,
  actions,
  className,
}: FilterBarProps) {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center gap-2.5',
        className
      )}
    >
      {/* Search */}
      {onSearchChange !== undefined && (
        <div className="relative flex-1 min-w-0 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <Input
            type="text"
            value={search ?? ''}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9 bg-slate-50 border-slate-200 rounded-xl text-xs h-9 font-semibold focus:bg-white"
          />
        </div>
      )}

      {/* Filter selects */}
      {filters?.map((f, i) => (
        <Select key={i} value={f.value} onValueChange={f.onChange}>
          <SelectTrigger
            className={cn(
              'bg-slate-50 border-slate-200 rounded-xl text-xs h-9 font-semibold',
              f.width ?? 'w-40'
            )}
          >
            <SelectValue placeholder={f.placeholder ?? 'Filter…'} />
          </SelectTrigger>
          <SelectContent>
            {f.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}

      {/* Right-side actions */}
      {actions && (
        <div className="flex items-center gap-2 sm:ml-auto flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
