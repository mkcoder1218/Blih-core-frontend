/**
 * InfoAlert — Blih ERP shared component
 * Inline contextual alerts/banners for warnings, info callouts, and tips.
 * Replaces repeated ad-hoc amber/red/blue info boxes across the app.
 *
 * Usage:
 *   <InfoAlert variant="warning" message="No active leave types. Contact HR." />
 *   <InfoAlert variant="info" icon={<Calendar />} message="12 days remaining" />
 *   <InfoAlert variant="error" message={error} />
 *   <InfoAlert variant="success" message="Changes saved." />
 */

import React from 'react';
import { AlertTriangle, Info, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type InfoAlertVariant = 'info' | 'warning' | 'error' | 'success';

interface InfoAlertProps {
  variant?: InfoAlertVariant;
  message: string;
  icon?: React.ReactNode;
  className?: string;
}

const variantStyles: Record<InfoAlertVariant, { container: string; text: string; defaultIcon: React.ElementType }> = {
  info:    { container: 'bg-blue-50 border-blue-100',    text: 'text-blue-700',    defaultIcon: Info },
  warning: { container: 'bg-amber-50 border-amber-200',  text: 'text-amber-700',   defaultIcon: AlertTriangle },
  error:   { container: 'bg-red-50 border-red-100',      text: 'text-red-600',     defaultIcon: XCircle },
  success: { container: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700', defaultIcon: CheckCircle2 },
};

export function InfoAlert({ variant = 'info', message, icon, className }: InfoAlertProps) {
  const styles = variantStyles[variant];
  const DefaultIcon = styles.defaultIcon;

  return (
    <div
      className={cn(
        'flex items-start gap-2 border rounded-xl px-3 py-2.5',
        styles.container,
        className
      )}
    >
      <span className={cn('flex-shrink-0 mt-0.5', styles.text)}>
        {icon ?? <DefaultIcon className="w-3.5 h-3.5" />}
      </span>
      <p className={cn('text-[11px] font-semibold leading-relaxed', styles.text)}>
        {message}
      </p>
    </div>
  );
}
