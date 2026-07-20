import { Brain, LogOut } from 'lucide-react';
import GlobalSubtabSearch from './GlobalSubtabSearch';
import { SidebarButton } from './SidebarViewParts';
import type { SidebarController } from './useSidebarController';

export function CompactSidebar({ controller }: { controller: SidebarController }) {
  const {
    displayModule,
    getInitials,
    handleModuleClick,
    handleProfileClick,
    mainModules,
    mobileOpen,
    onLogout,
    onMobileClose,
    setIsDetailedView,
    user,
  } = controller;

  return (
    <div
      id="sidebar-container"
      className="w-68 bg-gradient-to-b from-[#1c64f2] to-[#124bbf] text-white flex flex-col justify-between py-6 px-4 flex-shrink-0 h-screen z-50 transition-transform duration-300 ease-in-out"
      data-mobile-open={mobileOpen ? 'true' : 'false'}
    >
      <div>
        {/* Brand */}
        <div className="flex items-center gap-3 px-3 mb-6 select-none animate-fade-in">
          <div className="p-1.5 bg-white/10 rounded-xl flex-shrink-0">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1.5 leading-none">
              <span className="font-cursive text-[30px] font-normal text-white tracking-wide antialiased">
                Blih
              </span>
              <span className="font-sans text-[19px] font-bold text-white tracking-wide uppercase opacity-95 antialiased">
                CORE
              </span>
            </div>
            <p className="text-[10px] text-blue-100 font-bold tracking-wider uppercase mt-1">
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
          {mainModules.map((m: any) => {
            const Icon = m.icon;
            const isActive = m.id === displayModule;
            return (
              <SidebarButton
                key={m.id}
                onClick={() => handleModuleClick(m.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-[13px] font-semibold transition-all cursor-pointer ${
                  isActive ? 'bg-white text-[#1a56db] shadow-md' : 'text-white hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4.5 h-4.5 ${isActive ? 'text-[#1a56db]' : 'text-blue-100/90'}`}
                  />
                  <span className="tracking-tight">{m.label}</span>
                </div>
                {m.badge > 0 && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold inline-flex items-center justify-center min-w-[20px] ${m.id === 'performance' ? 'bg-red-600 text-white' : isActive ? 'bg-[#1a56db] text-white' : 'bg-white text-[#1a56db]'}`}
                  >
                    {m.badge}
                  </span>
                )}
              </SidebarButton>
            );
          })}
        </div>
      </div>

      {/* User block */}
      <div className="border-t border-white/10 pt-4 px-2 mt-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <SidebarButton
            onClick={handleProfileClick}
            title="My Profile"
            className="w-8 h-8 rounded-full bg-white text-[#1a56db] flex items-center justify-center text-xs font-bold leading-none shadow-sm flex-shrink-0 hover:ring-2 hover:ring-white/50 transition-all cursor-pointer"
          >
            {user ? getInitials(user.name) : 'AY'}
          </SidebarButton>
          <div className="overflow-hidden min-w-0">
            <p className="text-xs font-bold text-white truncate leading-none">
              {user ? user.name : 'Aytenew Y.'}
            </p>
            <p className="text-[10px] text-blue-100/70 truncate leading-tight mt-0.5">
              {user ? user.email : 'aytenew@blihmarketing.com'}
            </p>
          </div>
        </div>
        <SidebarButton
          onClick={onLogout}
          title="Log Out"
          className="p-1 px-1.5 hover:bg-white/10 rounded-lg text-blue-100 hover:text-rose-300 transition-colors cursor-pointer flex-shrink-0"
        >
          <LogOut className="w-4 h-4" />
        </SidebarButton>
      </div>
    </div>
  );
}
