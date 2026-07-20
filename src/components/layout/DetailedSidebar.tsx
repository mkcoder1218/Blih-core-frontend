import { Brain, ChevronDown, ChevronRight, Settings, Shield } from 'lucide-react';
import type { MainModule } from '../../types';
import GlobalSubtabSearch from './GlobalSubtabSearch';
import { DetailedSidebarUserBlock, SidebarBadge, SidebarButton } from './SidebarViewParts';
import type { SidebarController } from './useSidebarController';

export function DetailedSidebar({ controller }: { controller: SidebarController }) {
  const {
    activeSettingsTab,
    attendanceGroups,
    businessesTabs,
    currentAttendanceTab,
    currentBusinessesTab,
    currentExitTab,
    currentFinanceTab,
    currentOnboardingTab,
    currentPerformanceTab,
    currentProfilesTab,
    currentProjectsTab,
    currentRecruitmentTab,
    currentTalentTab,
    defaultModule,
    defaultPath,
    displayModule,
    exitTabs,
    financeTabs,
    getInitials,
    groupedChildCls,
    handleModuleClick,
    handleProfileClick,
    mainModules,
    mobileOpen,
    navigate,
    onLogout,
    onMobileClose,
    onboardingTabs,
    openAttendanceGroups,
    openTalentGroups,
    performanceTabs,
    portalTitle,
    profilesTabs,
    projectsTabs,
    recruitmentTabs,
    roleSegment,
    setCurrentAttendanceTab,
    setCurrentBusinessesTab,
    setCurrentExitTab,
    setCurrentFinanceTab,
    setCurrentModule,
    setCurrentOnboardingTab,
    setCurrentPerformanceTab,
    setCurrentProfilesTab,
    setCurrentProjectsTab,
    setCurrentRecruitmentTab,
    setCurrentTalentTab,
    setIsDetailedView,
    setOpenAttendanceGroups,
    setOpenTalentGroups,
    settingsTabs,
    sidebarRoleLabel,
    tabCls,
    talentGroups,
    user,
  } = controller;

  return (
    <div
      id="sidebar-container"
      className="flex h-screen border-r border-slate-100 flex-shrink-0 bg-white z-50 transition-transform duration-300 ease-in-out"
      data-mobile-open={mobileOpen ? 'true' : 'false'}
    >
      {/* Column 1: Icon rail */}
      <div className="w-[68px] bg-[#1a56db] flex flex-col items-center justify-between py-5 text-white flex-shrink-0">
        <div className="flex flex-col items-center gap-6 w-full">
          <SidebarButton
            onClick={() => {
              setIsDetailedView(false);
              setCurrentModule(defaultModule as MainModule);
              navigate(defaultPath);
              onMobileClose?.();
            }}
            className="p-2.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            title="Return to Home Dashboard"
          >
            <Brain className="w-7 h-7" />
          </SidebarButton>

          <div className="mt-2">
            <GlobalSubtabSearch
              user={user}
              variant="rail"
              onSelect={() => {
                setIsDetailedView(true);
                onMobileClose?.();
              }}
            />
          </div>

          <div className="flex flex-col gap-3 w-full px-2 mt-4">
            {mainModules.map((m: any) => {
              const Icon = m.icon;
              const isActive = m.id === displayModule;
              return (
                <SidebarButton
                  key={m.id}
                  onClick={() => handleModuleClick(m.id)}
                  className={`relative p-3 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-[#1a56db] shadow-md'
                      : 'text-white/85 hover:bg-white/10 hover:text-white'
                  }`}
                  title={m.label}
                >
                  <Icon className="w-5 h-5" />
                  {m.badge > 0 && !isActive && (
                    <span
                      className={`absolute top-1 right-1 w-2.5 h-2.5 ${m.id === 'performance' ? 'bg-red-400' : 'bg-sky-300'} rounded-full border-2 border-[#1a56db]`}
                    />
                  )}
                </SidebarButton>
              );
            })}
          </div>
        </div>

        <SidebarButton
          onClick={handleProfileClick}
          title="My Profile"
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-sm font-semibold border border-white/20 transition-all cursor-pointer"
        >
          {user ? getInitials(user.name) : 'AY'}
        </SidebarButton>
      </div>

      {/* Column 2: Sub-menu */}
      <div className="w-60 min-h-0 flex flex-col py-6 px-4 bg-white flex-shrink-0 h-full overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="mb-6 px-2">
            <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
              {displayModule === 'recruitment'
                ? portalTitle
                : displayModule === 'profiles'
                  ? 'People & Profiles'
                  : displayModule === 'attendance'
                    ? 'Attendance'
                    : displayModule === 'talent'
                      ? 'Talent Management'
                      : displayModule === 'exit'
                        ? 'Exit & Offboarding'
                        : mainModules.find((m: any) => m.id === displayModule)?.label}
            </h2>
            <span className="text-[11px] font-medium text-blue-600 block leading-tight">
              {sidebarRoleLabel}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            {displayModule === 'recruitment' &&
              recruitmentTabs.map((tab) => (
                <SidebarButton
                  key={tab.id}
                  onClick={() => {
                    setCurrentRecruitmentTab(tab.id);
                    navigate(
                      tab.id === 'overview'
                        ? `/${roleSegment}/recruitment`
                        : `/${roleSegment}/recruitment/${tab.id}`,
                    );
                    onMobileClose?.();
                  }}
                  className={tabCls(currentRecruitmentTab === tab.id)}
                >
                  <span>{tab.label}</span>
                  <SidebarBadge count={tab.badge} />
                </SidebarButton>
              ))}

            {displayModule === 'profiles' &&
              profilesTabs.map((tab) => (
                <SidebarButton
                  key={tab.id}
                  onClick={() => {
                    setCurrentProfilesTab(tab.id);
                    navigate(`/${roleSegment}/profiles/${tab.id}`);
                    onMobileClose?.();
                  }}
                  className={tabCls(currentProfilesTab === tab.id)}
                >
                  <span>{tab.label}</span>
                </SidebarButton>
              ))}

            {displayModule === 'attendance' &&
              attendanceGroups.map((group) => {
                const hasActiveChild = group.items.some((tab) => tab.id === currentAttendanceTab);
                const isOpen = hasActiveChild || openAttendanceGroups[group.title] !== false;
                const Chevron = isOpen ? ChevronDown : ChevronRight;

                return (
                  <div key={group.title} className="pt-1.5 first:pt-0">
                    <SidebarButton
                      type="button"
                      onClick={() => {
                        setOpenAttendanceGroups((prev) => ({
                          ...prev,
                          [group.title]: !(prev[group.title] !== false),
                        }));
                      }}
                      className={`w-full flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-xs font-extrabold transition-colors cursor-pointer ${
                        hasActiveChild
                          ? 'text-slate-950 bg-slate-50/70'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{group.title}</span>
                      <Chevron className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    </SidebarButton>

                    <div
                      className={`grid transition-[grid-template-rows,opacity] duration-150 ease-out ${
                        isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-70'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="mt-0.5 flex flex-col gap-0.5">
                          {group.items.map((tab) => (
                            <SidebarButton
                              key={tab.id}
                              onClick={() => {
                                setCurrentAttendanceTab(tab.id);
                                navigate(
                                  tab.id === 'overview'
                                    ? `/${roleSegment}/attendance`
                                    : `/${roleSegment}/attendance/${tab.id}`,
                                );
                                onMobileClose?.();
                              }}
                              className={groupedChildCls(currentAttendanceTab === tab.id)}
                            >
                              <span className="truncate">{tab.label}</span>
                            </SidebarButton>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

            {displayModule === 'talent' &&
              talentGroups.map((group) => {
                const hasActiveChild = group.items.some((tab) => tab.id === currentTalentTab);
                const isOpen = hasActiveChild || openTalentGroups[group.title] !== false;
                const Chevron = isOpen ? ChevronDown : ChevronRight;

                return (
                  <div key={group.title} className="pt-1.5 first:pt-0">
                    <SidebarButton
                      type="button"
                      onClick={() => {
                        setOpenTalentGroups((prev) => ({
                          ...prev,
                          [group.title]: !(prev[group.title] !== false),
                        }));
                      }}
                      className={`w-full flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-xs font-extrabold transition-colors cursor-pointer ${
                        hasActiveChild
                          ? 'text-slate-950 bg-slate-50/70'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{group.title}</span>
                      <Chevron className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    </SidebarButton>

                    <div
                      className={`grid transition-[grid-template-rows,opacity] duration-150 ease-out ${
                        isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-70'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="mt-0.5 flex flex-col gap-0.5">
                          {group.items.map((tab) => (
                            <SidebarButton
                              key={tab.id}
                              onClick={() => {
                                setCurrentTalentTab(tab.id);
                                navigate(`/${roleSegment}/talent/${tab.id}`);
                                onMobileClose?.();
                              }}
                              className={groupedChildCls(currentTalentTab === tab.id)}
                            >
                              <span className="truncate">{tab.label}</span>
                              <SidebarBadge count={tab.badge} />
                            </SidebarButton>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

            {displayModule === 'exit' &&
              exitTabs.map((tab) => (
                <SidebarButton
                  key={tab.id}
                  onClick={() => {
                    setCurrentExitTab(tab.id);
                    navigate(
                      tab.id === 'offboarding'
                        ? `/${roleSegment}/exit`
                        : `/${roleSegment}/exit/${tab.id}`,
                    );
                    onMobileClose?.();
                  }}
                  className={tabCls(currentExitTab === tab.id)}
                >
                  <span>{tab.label}</span>
                  <SidebarBadge count={tab.badge} />
                </SidebarButton>
              ))}

            {displayModule === 'onboarding' &&
              onboardingTabs.map((tab) => (
                <SidebarButton
                  key={tab.id}
                  onClick={() => {
                    setCurrentOnboardingTab(tab.id);
                    navigate(
                      tab.id === 'overview'
                        ? `/${roleSegment}/onboarding`
                        : `/${roleSegment}/onboarding/${tab.id}`,
                    );
                    onMobileClose?.();
                  }}
                  className={tabCls(currentOnboardingTab === tab.id)}
                >
                  <span>{tab.label}</span>
                </SidebarButton>
              ))}

            {displayModule === 'finance' &&
              financeTabs.map((tab) => (
                <SidebarButton
                  key={tab.id}
                  onClick={() => {
                    setCurrentFinanceTab(tab.id);
                    navigate(
                      tab.id === 'overview'
                        ? `/${roleSegment}/finance`
                        : `/${roleSegment}/finance/${tab.id}`,
                    );
                    onMobileClose?.();
                  }}
                  className={tabCls(currentFinanceTab === tab.id)}
                >
                  <span>{tab.label}</span>
                  <SidebarBadge count={tab.badge} />
                </SidebarButton>
              ))}

            {displayModule === 'projects' &&
              projectsTabs.map((tab) => (
                <SidebarButton
                  key={tab.id}
                  onClick={() => {
                    setCurrentProjectsTab(tab.id);
                    const path =
                      tab.id === 'overview'
                        ? '/projects'
                        : tab.id === 'all'
                          ? '/projects/all'
                          : tab.id === 'mine'
                            ? '/projects/my-projects'
                            : tab.id === 'my-tasks'
                              ? '/projects/my-tasks'
                              : '/projects/board';
                    navigate(path);
                    onMobileClose?.();
                  }}
                  className={tabCls(currentProjectsTab === tab.id)}
                >
                  <span>{tab.label}</span>
                </SidebarButton>
              ))}

            {displayModule === 'performance' &&
              performanceTabs.map((tab) => (
                <SidebarButton
                  key={tab.id}
                  onClick={() => {
                    setCurrentPerformanceTab(tab.id);
                    navigate(
                      tab.id === 'overview'
                        ? `/${roleSegment}/performance`
                        : `/${roleSegment}/performance/${tab.id}`,
                    );
                    onMobileClose?.();
                  }}
                  className={tabCls(currentPerformanceTab === tab.id)}
                >
                  <span>{tab.label}</span>
                  <SidebarBadge count={tab.badge} tone={tab.id === 'discipline' ? 'red' : 'blue'} />
                </SidebarButton>
              ))}

            {displayModule === 'permissions' && (
              <SidebarButton className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold bg-slate-50 text-slate-900 border-l-2 border-blue-600 pl-2.5 cursor-pointer">
                <span>Manage Permissions</span>
                <Shield className="w-3.5 h-3.5 text-blue-600" />
              </SidebarButton>
            )}

            {displayModule === 'subscription-settings' &&
              settingsTabs.map((tab) => (
                <SidebarButton
                  key={tab.id}
                  onClick={() => {
                    setCurrentModule('subscription-settings');
                    navigate(tab.path);
                    onMobileClose?.();
                  }}
                  className={tabCls(activeSettingsTab === tab.id)}
                >
                  <span>{tab.label}</span>
                  {tab.id === 'smtp' ? <Settings className="w-3.5 h-3.5 text-blue-600" /> : null}
                </SidebarButton>
              ))}

            {displayModule === 'businesses' &&
              businessesTabs.map((tab) => (
                <SidebarButton
                  key={tab.id}
                  onClick={() => {
                    setCurrentBusinessesTab(tab.id);
                    navigate(
                      tab.id === 'overview'
                        ? `/${roleSegment}/businesses`
                        : `/${roleSegment}/businesses/${tab.id}`,
                    );
                    onMobileClose?.();
                  }}
                  className={tabCls(currentBusinessesTab === tab.id)}
                >
                  <span>{tab.label}</span>
                </SidebarButton>
              ))}

            {![
              'recruitment',
              'profiles',
              'attendance',
              'talent',
              'exit',
              'onboarding',
              'finance',
              'projects',
              'performance',
              'permissions',
              'businesses',
              'subscription-settings',
            ].includes(displayModule) && (
              <div className="py-2 text-slate-500 font-medium text-xs text-center border border-dashed border-slate-200 rounded-lg p-3 bg-slate-50/50">
                <span className="block mb-1">Standard Mode</span>
                <SidebarButton
                  onClick={() => {
                    setCurrentModule(defaultModule as MainModule);
                    navigate(defaultPath);
                    onMobileClose?.();
                  }}
                  className="text-blue-600 hover:underline text-[11px] font-semibold"
                >
                  Return to Portal Home
                </SidebarButton>
              </div>
            )}
          </div>
        </div>

        <DetailedSidebarUserBlock getInitials={getInitials} onLogout={onLogout} user={user} />
      </div>
    </div>
  );
}
