/**
 * LoadingSpinner — Blih ERP shared component
 * Consistent loading indicators — inline spinner, full-page overlay, and skeleton pulses.
 *
 * Usage:
 *   <LoadingSpinner />                        // centered full-area spinner
 *   <LoadingSpinner size="sm" inline />       // inline with text
 *   <LoadingSpinner label="Loading data…" />  // with label
 *   <PageLoadingSpinner />                    // full page overlay
 *   <SkeletonLine />                          // single skeleton line
 *   <SkeletonBlock rows={3} />               // multi-row skeleton
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { RefreshCw } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  label?: string;
  /** Render inline (no centering wrapper) */
  inline?: boolean;
  className?: string;
}

const sizeMap = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

export function LoadingSpinner({
  size = 'md',
  label,
  inline = false,
  className,
}: LoadingSpinnerProps) {
  const icon = (
    <RefreshCw
      className={cn('animate-spin text-slate-400', sizeMap[size], className)}
    />
  );

  if (inline) {
    return (
      <span className="inline-flex items-center gap-2">
        {icon}
        {label && <span className="text-xs text-slate-500 font-semibold">{label}</span>}
      </span>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      {icon}
      {label && (
        <p className="text-sm text-slate-500 font-semibold">{label}</p>
      )}
    </div>
  );
}

/** Full-screen translucent overlay spinner */
export function PageLoadingSpinner({ label }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
      <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
      {label && (
        <p className="mt-3 text-sm font-semibold text-slate-600">{label}</p>
      )}
    </div>
  );
}

/** Single skeleton line */
export function SkeletonLine({
  width = 'full',
  className,
}: {
  width?: 'full' | '3/4' | '1/2' | '1/3' | '1/4';
  className?: string;
}) {
  const widthMap = {
    full: 'w-full',
    '3/4': 'w-3/4',
    '1/2': 'w-1/2',
    '1/3': 'w-1/3',
    '1/4': 'w-1/4',
  };
  return (
    <div
      className={cn(
        'h-3 bg-slate-100 rounded-full animate-pulse',
        widthMap[width],
        className
      )}
    />
  );
}

/** Block of skeleton lines simulating a loading card */
export function SkeletonBlock({
  rows = 3,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2.5', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonLine key={i} width={i % 3 === 2 ? '1/2' : i % 2 === 0 ? 'full' : '3/4'} />
      ))}
    </div>
  );
}
