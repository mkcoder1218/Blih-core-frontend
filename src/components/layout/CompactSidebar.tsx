import { Brain, FlaskConical, LogOut } from 'lucide-react';
import GlobalSubtabSearch from './GlobalSubtabSearch';
import { SidebarButton } from './SidebarViewParts';
import type { SidebarController } from './useSidebarController';
import { useTesterSession } from '../../hooks/useTesterControl';
import { useTheme } from '../../contexts/ThemeContext';

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
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div
      id="sidebar-container"
      className={`flex h-screen w-68 flex-shrink-0 flex-col justify-between px-4 py-6 text-white transition-transform duration-300 ease-in-out ${
        isDark
          ? 'border-r border-white/[0.08] bg-[#090b0f]'
          : 'bg-gradient-to-b from-[#1c64f2] to-[#124bbf]'
      }`}
      style={
        isDark
          ? {
              backgroundColor: '#090b0f',
              backgroundImage: 'none',
            }
          : undefined
      }
      data-mobile-open={mobileOpen ? 'true' : 'false'}
    >
      <section className="bg-transparent">
        {/* Brand */}
        <div className="mb-6 flex select-none items-center gap-3 px-3 animate-fade-in">
          <div
            className={`flex flex-shrink-0 items-center justify-center rounded-xl p-1.5 ${
              isDark
                ? 'bg-blue-500/10 ring-1 ring-blue-400/20'
                : 'bg-white/10'
            }`}
          >
            <Brain className={`h-8 w-8 ${isDark ? 'text-blue-400' : 'text-white'}`} />
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

            <p
              className={`mt-1 text-[10px] font-semibold uppercase tracking-wider ${
                isDark ? 'text-slate-400' : 'text-blue-100'
              }`}
            >
              HR Dashboard
            </p>
          </div>
        </div>

        <div className="bg-transparent">
          <GlobalSubtabSearch
            user={user}
            onSelect={() => {
              setIsDetailedView(true);
              onMobileClose?.();
            }}
          />
        </div>

        {/* Module list */}
        <div className="flex flex-col gap-1 bg-transparent px-1">
          {mainModules.map((module: any) => {
            const Icon = module.icon;
            const isActive = module.id === displayModule;

            return (
              <SidebarButton
                key={module.id}
                onClick={() => handleModuleClick(module.id)}
                className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3.5 py-3 text-[13px] font-semibold transition-all ${
                  isActive
                    ? isDark
                      ? 'bg-[#1a56db] text-white shadow-[0_8px_22px_rgba(26,86,219,0.18)]'
                      : 'bg-white text-[#1a56db] shadow-md'
                    : isDark
                      ? 'bg-transparent text-slate-300 hover:bg-white/[0.06] hover:text-white'
                      : 'bg-transparent text-white hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4.5 w-4.5 ${
                      isActive
                        ? isDark
                          ? 'text-white'
                          : 'text-[#1a56db]'
                        : isDark
                          ? 'text-slate-400'
                          : 'text-blue-100/90'
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
                          ? isDark
                            ? 'bg-white text-[#1a56db]'
                            : 'bg-[#1a56db] text-white'
                          : isDark
                            ? 'bg-blue-500/15 text-blue-300'
                            : 'bg-white text-[#1a56db]'
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
              className={`mt-2 flex w-full cursor-pointer items-center justify-between rounded-xl border px-3.5 py-3 text-[13px] font-semibold transition-all ${
                isDark
                  ? 'border-amber-400/15 bg-amber-400/[0.06] text-amber-200 hover:bg-amber-400/10'
                  : 'border-amber-200/30 bg-amber-300/10 text-amber-50 hover:bg-amber-300/20'
              }`}
            >
              <div className="flex items-center gap-3">
                <FlaskConical className="h-4.5 w-4.5" />
                <span className="tracking-tight">Tester Control</span>
              </div>

              <span
                className={`rounded px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide ${
                  isDark
                    ? 'bg-amber-400/15 text-amber-200'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                Test
              </span>
            </SidebarButton>
          ) : null}
        </div>
      </section>

      {/* User block */}
      <div
        className={`mt-auto flex items-center justify-between gap-3 border-t px-2 pt-4 ${
          isDark ? 'border-white/[0.08]' : 'border-white/10'
        }`}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <SidebarButton
            onClick={handleProfileClick}
            title="My Profile"
            className={`flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-full text-xs font-semibold leading-none transition-all ${
              isDark
                ? 'border border-blue-400/20 bg-blue-500/10 text-blue-300 hover:bg-blue-500/15 hover:ring-2 hover:ring-blue-400/20'
                : 'bg-white text-[#1a56db] shadow-sm hover:ring-2 hover:ring-white/50'
            }`}
          >
            {user ? getInitials(user.name) : 'AY'}
          </SidebarButton>

          <div className="min-w-0 overflow-hidden">
            <div className="flex min-w-0 items-center gap-1.5">
              <p className="min-w-0 truncate text-xs font-semibold leading-none text-white">
                {user ? user.name : 'Aytenew Y.'}
              </p>

              {isTester ? (
                <span
                  className={`shrink-0 rounded px-1 py-0.5 text-[7px] font-semibold uppercase tracking-wide ${
                    isDark
                      ? 'bg-amber-400/15 text-amber-200'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  Test
                </span>
              ) : null}
            </div>

            <p
              className={`mt-0.5 truncate text-[10px] leading-tight ${
                isDark ? 'text-slate-500' : 'text-blue-100/70'
              }`}
            >
              {user ? user.email : 'aytenew@blihmarketing.com'}
            </p>
          </div>
        </div>

        <SidebarButton
          onClick={onLogout}
          title="Log Out"
          className={`flex-shrink-0 cursor-pointer rounded-lg p-1 px-1.5 transition-colors ${
            isDark
              ? 'text-slate-500 hover:bg-rose-500/10 hover:text-rose-300'
              : 'text-blue-100 hover:bg-white/10 hover:text-rose-300'
          }`}
        >
          <LogOut className="h-4 w-4" />
        </SidebarButton>
      </div>
    </div>
  );
}
