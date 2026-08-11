import { FlaskConical, LogOut } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTesterSession } from '../../hooks/useTesterControl';
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
  const testerSession = useTesterSession();
  const navigate = useNavigate();
  const location = useLocation();
  const isTester = Boolean(testerSession.data?.isTestAccount);
  const isMasterTester = Boolean(testerSession.data?.isMasterTester);
  const isPlatformAdmin = user?.role === 'Super Admin';
  const canOpenTesterControl = isMasterTester || isPlatformAdmin;
  const isTesterRoute = location.pathname === '/tester-control';

  return (
    <div className="mt-3 flex-shrink-0 border-t border-slate-100 px-2 pt-3">
      {canOpenTesterControl && (
        <SidebarButton
          onClick={() => navigate('/tester-control')}
          className={`mb-3 flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-bold transition-colors ${
            isTesterRoute
              ? 'bg-amber-50 text-amber-800'
              : 'text-slate-600 hover:bg-amber-50 hover:text-amber-800'
          }`}
        >
          <FlaskConical className="h-4 w-4 shrink-0" />
          <span className="min-w-0 flex-1 truncate text-left">Tester Control</span>
          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide text-amber-700">
            {isPlatformAdmin ? 'Platform' : 'Master'}
          </span>
        </SidebarButton>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-xs font-bold text-blue-600 shadow-xs">
            {user ? getInitials(user.name) : 'AY'}
          </div>
          <div className="min-w-0 overflow-hidden">
            <div className="flex min-w-0 items-center gap-1.5">
              <p className="min-w-0 truncate text-xs font-semibold leading-none text-slate-950">
                {user ? user.name : 'Aytenew Y.'}
              </p>
              {isTester && (
                <span className="shrink-0 rounded bg-amber-100 px-1 py-0.5 text-[7px] font-black uppercase tracking-wide text-amber-700">
                  Test
                </span>
              )}
            </div>
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
    </div>
  );
}
