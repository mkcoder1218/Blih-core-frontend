/**
 * UserAvatar — Blih ERP shared component
 * Consistent initials-based avatar used across all tables, cards, and lists.
 * Optionally shows name + subtitle next to it.
 *
 * Usage:
 *   <UserAvatar name="Aisha Kemunto" />
 *   <UserAvatar name="John Doe" subtitle="john@blih.com" size="lg" />
 *   <UserAvatar name="HR Manager" color="blue" />
 */

import React from 'react';
import { cn } from '@/lib/utils';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarColor = 'dark' | 'blue' | 'violet' | 'emerald' | 'amber';

interface UserAvatarProps {
  name: string;
  subtitle?: string;
  size?: AvatarSize;
  color?: AvatarColor;
  className?: string;
}

const sizeMap: Record<AvatarSize, { circle: string; text: string }> = {
  xs: { circle: 'w-6 h-6 text-[9px]',  text: '' },
  sm: { circle: 'w-8 h-8 text-[10px]', text: '' },
  md: { circle: 'w-9 h-9 text-[11px]', text: '' },
  lg: { circle: 'w-11 h-11 text-[13px]', text: '' },
  xl: { circle: 'w-14 h-14 text-[16px]', text: '' },
};

const colorMap: Record<AvatarColor, string> = {
  dark:    'bg-slate-900 text-white',
  blue:    'bg-blue-600 text-white',
  violet:  'bg-violet-600 text-white',
  emerald: 'bg-emerald-600 text-white',
  amber:   'bg-amber-500 text-white',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function UserAvatar({
  name,
  subtitle,
  size = 'md',
  color = 'dark',
  className,
}: UserAvatarProps) {
  const { circle, text } = sizeMap[size];
  const bg = colorMap[color];

  const avatar = (
    <div
      className={cn(
        'rounded-xl flex items-center justify-center font-black shadow-xs flex-shrink-0',
        circle,
        bg,
        className
      )}
    >
      {getInitials(name) || 'U'}
    </div>
  );

  if (!subtitle) return avatar;

  return (
    <div className="flex items-center gap-3 min-w-0">
      {avatar}
      <div className="min-w-0">
        <p className={cn('font-extrabold text-slate-900 leading-none truncate', text || 'text-[12px]')}>
          {name}
        </p>
        <p className="text-[11px] text-slate-500 font-semibold truncate mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}
