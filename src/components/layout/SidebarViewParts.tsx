import { LogOut } from 'lucide-react';
import type { ComponentProps } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SidebarController } from './useSidebarController';

export function SidebarButton({ className, ...props }: ComponentProps<typeof Button>) {
  return (
    <Button
      variant="ghost"
      size={null}
      className={cn('h-auto border-0 bg-transparent p-0', className)}
      {...props}
    />
  );
}

export function SidebarBadge({ count, tone = 'blue' }: { count: number; tone?: 'blue' | 'red' }) {
  return count > 0 ? (
    <span
      className={`${tone === 'red' ? 'bg-red-600' : 'bg-blue-600'} inline-flex min-w-[18px] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white`}
    >
      {count}
    </span>
  ) : null;
}

export function DetailedSidebarUserBlock({
  getInitials,
  onLogout,
  user,
}: Pick<SidebarController, 'getInitials' | 'onLogout' | 'user'>) {
  return (
    <div className="mt-3 flex flex-shrink-0 items-center justify-between gap-3 border-t border-slate-100 px-2 pt-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-xs font-bold text-blue-600 shadow-xs">
          {user ? getInitials(user.name) : 'AY'}
        </div>
        <div className="min-w-0 overflow-hidden">
          <p className="truncate text-xs font-semibold leading-none text-slate-950">
            {user ? user.name : 'Aytenew Y.'}
          </p>
          <p className="mt-0.5 truncate text-[10px] leading-tight text-slate-400">
            {user ? user.email : 'aytenew@blihmarketing.com'}
          </p>
        </div>
      </div>
      <SidebarButton
        onClick={onLogout}
        title="Log Out"
        className="flex-shrink-0 cursor-pointer rounded-lg p-1 px-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
      >
        <LogOut className="h-4 w-4" />
      </SidebarButton>
    </div>
  );
}
