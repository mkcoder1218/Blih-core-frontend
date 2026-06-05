/**
 * FormField — Blih ERP shared component
 * A label + control wrapper that enforces the consistent form field style
 * used throughout modals and forms across all modules.
 *
 * Usage:
 *   <FormField label="Full Name" required>
 *     <Input ... />
 *   </FormField>
 *
 *   <FormField label="Leave Type" hint="Select an active leave template">
 *     <Select ...>...</Select>
 *   </FormField>
 *
 *   <FormField label="Reason" error={errors.reason}>
 *     <Textarea ... />
 *   </FormField>
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  label: string;
  /** Show red asterisk */
  required?: boolean;
  /** Small helper text below the label */
  hint?: string;
  /** Validation error message shown below the field */
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  required,
  hint,
  error,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        {label}
        {required && <span className="text-rose-500">*</span>}
      </label>
      {hint && (
        <p className="text-[10px] text-slate-400 font-medium -mt-0.5 leading-relaxed">
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p className="text-[10px] font-semibold text-rose-600 flex items-center gap-1">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * FormRow — horizontal grid for placing multiple FormFields side by side.
 *
 * Usage:
 *   <FormRow cols={2}>
 *     <FormField label="Start Date"><Input type="date" /></FormField>
 *     <FormField label="End Date"><Input type="date" /></FormField>
 *   </FormRow>
 */
export function FormRow({
  children,
  cols = 2,
  className,
}: {
  children: React.ReactNode;
  cols?: 2 | 3 | 4;
  className?: string;
}) {
  const colCls: Record<number, string> = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
  };
  return (
    <div className={cn('grid gap-3', colCls[cols], className)}>{children}</div>
  );
}
