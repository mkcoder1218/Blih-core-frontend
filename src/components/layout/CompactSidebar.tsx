import { Brain, FlaskConical, LogOut } from 'lucide-react';
import GlobalSubtabSearch from './GlobalSubtabSearch';
import { SidebarButton } from './SidebarViewParts';
import type { SidebarController } from './useSidebarController';
import { useTesterSession } from '../../hooks/useTesterControl';

export function CompactSidebar({ controller }: { controller: SidebarController }) {
  const {
    displayModule,
    getInitials,
    handleModuleClick,
    handleProfileClick,
    mainModules,
    mobileOpen,
    navigate,
    onLogout,
    onMobileClose,
    setIsDetailedView,
    user,
  } = controller;

  const testerSession = useTesterSession();
  const isTester = Boolean(testerSession.data?.isTestAccount);

  return (
    <div
      id="sidebar-container"
      className="flex h-screen w-68 flex-shrink-0 flex-col justify-between bg-gradient-to-b from-[#1c64f2] to-[#124bbf] px-4 py-6 text-white transition-transform duration-300 ease-in-out dark:border-r dark:border-white/[0.08] dark:bg-[#090b0f] dark:bg-none"
      data-mobile-open={mobileOpen ? 'true' : 'false'}
    >
      <div>
        {/* Brand */}
        <div className="mb-6 flex select-none items-center gap-3 px-3 animate-fade-in">
          <div className="flex flex-shrink-0 items-center justify-center rounded-xl bg-white/10 p-1.5 dark:bg-blue-500/10 dark:ring-1 dark:ring-blue-400/20">
            <Brain className="h-8 w-8 text-white dark:text-blue-400" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-baseline gap-1.5 leading-none">
              <span className="font-cursive text-[30px] font-normal tracking-wide text-white antialiased">
                Blih
              </span>
              <span className="font-sans text-[19px] font-bold uppercase tracking-wide text-white opacity-95 antialiased">
                CORE
              </span>
            </div>

            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-blue-100 dark:text-slate-400">
              HR Dashboard
            </p>
          </div>
        </div>

        <GlobalSubtabSearch
          user={user}
          onSelect={() => {
            setIsDetailedView(true);
            onMobileClose?.();
          }}
        />

        {/* Module list */}
        <div className="flex flex-col gap-1 px-1">
          {mainModules.map((module: any) => {
            const Icon = module.icon;
            const isActive = module.id === displayModule;

            return (
              <SidebarButton
                key={module.id}
                onClick={() => handleModuleClick(module.id)}
                className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3.5 py-3 text-[13px] font-semibold transition-all ${
                  isActive
                    ? 'bg-white text-[#1a56db] shadow-md dark:bg-[#1a56db] dark:text-white dark:shadow-[0_8px_22px_rgba(26,86,219,0.18)]'
                    : 'text-white hover:bg-white/10 dark:text-slate-300 dark:hover:bg-white/[0.06] dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4.5 w-4.5 ${
                      isActive
                        ? 'text-[#1a56db] dark:text-white'
                        : 'text-blue-100/90 dark:text-slate-400'
                    }`}
                  />

                  <span className="tracking-tight">{module.label}</span>
                </div>

                {module.badge > 0 ? (
                  <span
                    className={`inline-flex min-w-[20px] items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      module.id === 'performance'
                        ? 'bg-red-600 text-white'
                        : isActive
                          ? 'bg-[#1a56db] text-white dark:bg-white dark:text-[#1a56db]'
                          : 'bg-white text-[#1a56db] dark:bg-blue-500/15 dark:text-blue-300'
                    }`}
                  >
                    {module.badge}
                  </span>
                ) : null}
              </SidebarButton>
            );
          })}

          {isTester ? (
            <SidebarButton
              onClick={() => {
                setIsDetailedView(true);
                navigate('/tester-control');
                onMobileClose?.();
              }}
              className="mt-2 flex w-full cursor-pointer items-center justify-between rounded-xl border border-amber-200/30 bg-amber-300/10 px-3.5 py-3 text-[13px] font-semibold text-amber-50 transition-all hover:bg-amber-300/20 dark:border-amber-400/15 dark:bg-amber-400/[0.06] dark:text-amber-200 dark:hover:bg-amber-400/10"
            >
              <div className="flex items-center gap-3">
                <FlaskConical className="h-4.5 w-4.5" />
                <span className="tracking-tight">Tester Control</span>
              </div>

              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-amber-700 dark:bg-amber-400/15 dark:text-amber-200">
                Test
              </span>
            </SidebarButton>
          ) : null}
        </div>
      </div>

      {/* User block */}
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/10 px-2 pt-4 dark:border-white/[0.08]">
        <div className="flex min-w-0 items-center gap-2.5">
          <SidebarButton
            onClick={handleProfileClick}
            title="My Profile"
            className="flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-full bg-white text-xs font-semibold leading-none text-[#1a56db] shadow-sm transition-all hover:ring-2 hover:ring-white/50 dark:border dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/15 dark:hover:ring-blue-400/20"
          >
            {user ? getInitials(user.name) : 'AY'}
          </SidebarButton>

          <div className="min-w-0 overflow-hidden">
            <div className="flex min-w-0 items-center gap-1.5">
              <p className="min-w-0 truncate text-xs font-semibold leading-none text-white">
                {user ? user.name : 'Aytenew Y.'}
              </p>

              {isTester ? (
                <span className="shrink-0 rounded bg-amber-100 px-1 py-0.5 text-[7px] font-semibold uppercase tracking-wide text-amber-700 dark:bg-amber-400/15 dark:text-amber-200">
                  Test
                </span>
              ) : null}
            </div>

            <p className="mt-0.5 truncate text-[10px] leading-tight text-blue-100/70 dark:text-slate-500">
              {user ? user.email : 'aytenew@blihmarketing.com'}
            </p>
          </div>
        </div>

        <SidebarButton
          onClick={onLogout}
          title="Log Out"
          className="flex-shrink-0 cursor-pointer rounded-lg p-1 px-1.5 text-blue-100 transition-colors hover:bg-white/10 hover:text-rose-300 dark:text-slate-500 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
        >
          <LogOut className="h-4 w-4" />
        </SidebarButton>
      </div>
    </div>
  );
}
