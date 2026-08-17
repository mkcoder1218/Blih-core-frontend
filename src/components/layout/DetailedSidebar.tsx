import {
    Brain,
    ChevronDown,
    ChevronRight,
    Settings,
    Shield,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import type { MainModule } from '../../types';

import GlobalSubtabSearch from './GlobalSubtabSearch';

import {
    DetailedSidebarUserBlock,
    SidebarBadge,
    SidebarButton,
} from './SidebarViewParts';

import {
    Tooltip,
    TooltipContent,
    TooltipTrigger
} from '@/components/ui/tooltip';

import type { SidebarController } from './useSidebarController';

export function DetailedSidebar({
  controller,
}: {
  controller: SidebarController;
}) {
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
      className="flex h-screen flex-shrink-0 border-r border-slate-100 bg-white transition-transform duration-300 ease-in-out z-50"
      data-mobile-open={
        mobileOpen ? 'true' : 'false'
      }
    >
      {/* Column 1: Icon rail */}
      <div className="flex w-[68px] flex-shrink-0 flex-col items-center justify-between bg-[#1a56db] py-5 text-white">
        <div className="flex w-full flex-col items-center gap-6">
          <SidebarButton
            onClick={() => {
              setIsDetailedView(false);

              setCurrentModule(
                defaultModule as MainModule,
              );

              navigate(defaultPath);

              onMobileClose?.();
            }}
            className="cursor-pointer rounded-xl p-2.5 transition-colors hover:bg-white/10"
            title="Return to Home Dashboard"
          >
            <Brain className="h-7 w-7" />
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

          <div className="mt-4 flex w-full flex-col gap-3 px-2">
            {mainModules.map((module: any) => {
              const Icon = module.icon;

              const isActive =
                module.id === displayModule;

              return (
                <Tooltip key={module.id}>
                  <TooltipTrigger asChild>
                    <SidebarButton
                      onClick={() =>
                        handleModuleClick(module.id)
                      }
                      className={`relative flex cursor-pointer items-center justify-center rounded-xl p-3 transition-all ${
                        isActive
                          ? 'bg-white text-[#1a56db] shadow-md'
                          : 'text-white/85 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Icon className="h-5 w-5" />

                      {module.badge > 0 &&
                        !isActive && (
                          <span
                            className={`absolute right-1 top-1 h-2.5 w-2.5 rounded-full border-2 border-[#1a56db] ${
                              module.id ===
                              'performance'
                                ? 'bg-red-400'
                                : 'bg-sky-300'
                            }`}
                          />
                        )}
                    </SidebarButton>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-semibold">
                    {module.label}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>

        <SidebarButton
          onClick={handleProfileClick}
          title="My Profile"
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-white/10 text-sm font-semibold transition-all hover:bg-white/20"
        >
          {user
            ? getInitials(user.name)
            : 'AY'}
        </SidebarButton>
      </div>

      {/* Column 2: Sub-menu */}
      <div className="flex h-full min-h-0 w-60 flex-shrink-0 flex-col overflow-hidden bg-white px-4 py-6">
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="mb-6 px-2">
            <h2 className="text-sm font-semibold tracking-tight text-slate-900">
              {displayModule === 'recruitment'
                ? portalTitle
                : displayModule === 'profiles'
                  ? 'People & Profiles'
                  : displayModule ===
                      'attendance'
                    ? 'Attendance'
                    : displayModule === 'talent'
                      ? 'Talent Management'
                      : displayModule === 'exit'
                        ? 'Exit & Offboarding'
                        : mainModules.find(
                            (module: any) =>
                              module.id ===
                              displayModule,
                          )?.label}
            </h2>

            <span className="block text-[11px] font-medium leading-tight text-blue-600">
              {sidebarRoleLabel}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            {displayModule ===
              'recruitment' &&
              recruitmentTabs.map((tab) => (
                <SidebarButton
                  key={tab.id}
                  onClick={() => {
                    setCurrentRecruitmentTab(
                      tab.id,
                    );

                    navigate(
                      tab.id === 'overview'
                        ? `/${roleSegment}/recruitment`
                        : `/${roleSegment}/recruitment/${tab.id}`,
                    );

                    onMobileClose?.();
                  }}
                  className={tabCls(
                    currentRecruitmentTab ===
                      tab.id,
                  )}
                >
                  <span>{tab.label}</span>

                  <SidebarBadge
                    count={tab.badge}
                  />
                </SidebarButton>
              ))}

            {displayModule === 'profiles' &&
              profilesTabs.map((tab) => (
                <SidebarButton
                  key={tab.id}
                  onClick={() => {
                    setCurrentProfilesTab(tab.id);

                    navigate(
                      `/${roleSegment}/profiles/${tab.id}`,
                    );

                    onMobileClose?.();
                  }}
                  className={tabCls(
                    currentProfilesTab ===
                      tab.id,
                  )}
                >
                  <span>{tab.label}</span>
                </SidebarButton>
              ))}

            {displayModule ===
              'attendance' &&
              attendanceGroups.map((group) => {
                const hasActiveChild =
                  group.items.some(
                    (tab) =>
                      tab.id ===
                      currentAttendanceTab,
                  );

                const isOpen =
                  hasActiveChild ||
                  openAttendanceGroups[
                    group.title
                  ] !== false;

                const Chevron = isOpen
                  ? ChevronDown
                  : ChevronRight;

                return (
                  <div
                    key={group.title}
                    className="pt-1.5 first:pt-0"
                  >
                    <SidebarButton
                      type="button"
                      onClick={() => {
                        setOpenAttendanceGroups(
                          (previous) => ({
                            ...previous,

                            [group.title]:
                              !(
                                previous[
                                  group.title
                                ] !== false
                              ),
                          }),
                        );
                      }}
                      className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-xs font-extrabold transition-colors ${
                        hasActiveChild
                          ? 'bg-slate-50/70 text-slate-950'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">
                        {group.title}
                      </span>

                      <Chevron className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    </SidebarButton>

                    <div
                      className={`grid transition-[grid-template-rows,opacity] duration-150 ease-out ${
                        isOpen
                          ? 'grid-rows-[1fr] opacity-100'
                          : 'grid-rows-[0fr] opacity-70'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="mt-0.5 flex flex-col gap-0.5">
                          {group.items.map(
                            (tab) => (
                              <SidebarButton
                                key={tab.id}
                                onClick={() => {
                                  setCurrentAttendanceTab(
                                    tab.id,
                                  );

                                  navigate(
                                    String(tab.id) ===
                                      'overview'
                                      ? `/${roleSegment}/attendance`
                                      : `/${roleSegment}/attendance/${tab.id}`,
                                  );

                                  onMobileClose?.();
                                }}
                                className={groupedChildCls(
                                  currentAttendanceTab ===
                                    tab.id,
                                )}
                              >
                                <span className="truncate">
                                  {tab.label}
                                </span>
                              </SidebarButton>
                            ),
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

            {displayModule === 'talent' &&
              talentGroups.map((group) => {
                const hasActiveChild =
                  group.items.some(
                    (tab) =>
                      tab.id ===
                      currentTalentTab,
                  );

                const isOpen =
                  hasActiveChild ||
                  openTalentGroups[
                    group.title
                  ] !== false;

                const Chevron = isOpen
                  ? ChevronDown
                  : ChevronRight;

                return (
                  <div
                    key={group.title}
                    className="pt-1.5 first:pt-0"
                  >
                    <SidebarButton
                      type="button"
                      onClick={() => {
                        setOpenTalentGroups(
                          (previous) => ({
                            ...previous,

                            [group.title]:
                              !(
                                previous[
                                  group.title
                                ] !== false
                              ),
                          }),
                        );
                      }}
                      className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-xs font-extrabold transition-colors ${
                        hasActiveChild
                          ? 'bg-slate-50/70 text-slate-950'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">
                        {group.title}
                      </span>

                      <Chevron className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    </SidebarButton>

                    <div
                      className={`grid transition-[grid-template-rows,opacity] duration-150 ease-out ${
                        isOpen
                          ? 'grid-rows-[1fr] opacity-100'
                          : 'grid-rows-[0fr] opacity-70'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="mt-0.5 flex flex-col gap-0.5">
                          {group.items.map(
                            (tab) => (
                              <SidebarButton
                                key={tab.id}
                                onClick={() => {
                                  setCurrentTalentTab(
                                    tab.id,
                                  );

                                  navigate(
                                    `/${roleSegment}/talent/${tab.id}`,
                                  );

                                  onMobileClose?.();
                                }}
                                className={groupedChildCls(
                                  currentTalentTab ===
                                    tab.id,
                                )}
                              >
                                <span className="truncate">
                                  {tab.label}
                                </span>

                                <SidebarBadge
                                  count={tab.badge}
                                />
                              </SidebarButton>
                            ),
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

            {/*
             * Exit module can still be rendered separately while older
             * SidebarProps types are being migrated.
             *
             * New IDs:
             * - my-exit
             * - requests
             * - clearance
             * - reasons
             */}
            {displayModule === 'exit' &&
              exitTabs.map((tab) => {
                const tabId = tab.id;

                const exitPath =
                  tabId === 'my-exit'
                    ? `/${roleSegment}/exit`
                    : `/${roleSegment}/exit/${tabId}`;

                return (
                  <SidebarButton
                    key={tabId}
                    onClick={() => {
                      (
                        setCurrentExitTab as (
                          value:
                            | 'my-exit'
                            | 'requests'
                            | 'clearance'
                            | 'reasons',
                        ) => void
                      )(tabId);

                      navigate(exitPath);

                      onMobileClose?.();
                    }}
                    className={tabCls(
                      String(
                        currentExitTab,
                      ) === tabId,
                    )}
                  >
                    <span>{tab.label}</span>

                    <SidebarBadge
                      count={tab.badge}
                    />
                  </SidebarButton>
                );
              })}

            {displayModule ===
              'onboarding' &&
              onboardingTabs.map((tab) => (
                <SidebarButton
                  key={tab.id}
                  onClick={() => {
                    setCurrentOnboardingTab(
                      tab.id,
                    );

                    navigate(
                      tab.id === 'overview'
                        ? `/${roleSegment}/onboarding`
                        : `/${roleSegment}/onboarding/${tab.id}`,
                    );

                    onMobileClose?.();
                  }}
                  className={tabCls(
                    currentOnboardingTab ===
                      tab.id,
                  )}
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
                  className={tabCls(
                    currentFinanceTab === tab.id,
                  )}
                >
                  <span>{tab.label}</span>

                  <SidebarBadge
                    count={tab.badge}
                  />
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
                            : tab.id ===
                                'my-tasks'
                              ? '/projects/my-tasks'
                              : '/projects/board';

                    navigate(path);

                    onMobileClose?.();
                  }}
                  className={tabCls(
                    currentProjectsTab ===
                      tab.id,
                  )}
                >
                  <span>{tab.label}</span>
                </SidebarButton>
              ))}

            {displayModule ===
              'performance' &&
              performanceTabs.map((tab) => (
                <SidebarButton
                  key={tab.id}
                  onClick={() => {
                    setCurrentPerformanceTab(
                      tab.id,
                    );

                    navigate(
                      (tab.id as string) === 'overview'
                        ? `/${roleSegment}/performance`
                        : `/${roleSegment}/performance/${tab.id}`,
                    );

                    onMobileClose?.();
                  }}
                  className={tabCls(
                    currentPerformanceTab ===
                      tab.id,
                  )}
                >
                  <span>{tab.label}</span>

                  <SidebarBadge
                    count={tab.badge}
                    tone={
                      tab.id === 'discipline'
                        ? 'red'
                        : 'blue'
                    }
                  />
                </SidebarButton>
              ))}

            {displayModule ===
              'permissions' && (
              <SidebarButton className="flex w-full cursor-pointer items-center justify-between rounded-lg border-l-2 border-blue-600 bg-slate-50 px-3 py-2.5 pl-2.5 text-xs font-bold text-slate-900">
                <span>
                  Manage Permissions
                </span>

                <Shield className="h-3.5 w-3.5 text-blue-600" />
              </SidebarButton>
            )}

            {displayModule ===
              'subscription-settings' &&
              settingsTabs.map((tab) => (
                <Link
                  key={tab.id}
                  to={tab.path}
                  onClick={() => onMobileClose?.()}
                  className={tabCls(
                    activeSettingsTab ===
                      tab.id,
                  )}
                >
                  <span>{tab.label}</span>

                  {tab.id === 'smtp' ? (
                    <Settings className="h-3.5 w-3.5 text-blue-600" />
                  ) : null}
                </Link>
              ))}

            {displayModule ===
              'businesses' &&
              businessesTabs.map((tab) => (
                <SidebarButton
                  key={tab.id}
                  onClick={() => {
                    setCurrentBusinessesTab(
                      tab.id,
                    );

                    navigate(
                      tab.id === 'overview'
                        ? `/${roleSegment}/businesses`
                        : `/${roleSegment}/businesses/${tab.id}`,
                    );

                    onMobileClose?.();
                  }}
                  className={tabCls(
                    currentBusinessesTab ===
                      tab.id,
                  )}
                >
                  <span>{tab.label}</span>
                </SidebarButton>
              ))}

            {displayModule === 'brain' &&
              controller.brainTabs.map((tab) => (
                <SidebarButton
                  key={tab.id}
                  onClick={() => {
                    navigate(
                      tab.id === 'overview'
                        ? `/${roleSegment}/brain`
                        : `/${roleSegment}/brain/${tab.id}`,
                    );

                    onMobileClose?.();
                  }}
                  className={tabCls(
                    location.pathname.endsWith(`/brain/${tab.id}`) ||
                      (tab.id === 'overview' &&
                        (location.pathname.endsWith('/brain') ||
                          location.pathname.endsWith('/brain/overview'))),
                  )}
                >
                  <span>{tab.label}</span>

                  <SidebarBadge count={tab.badge} />
                </SidebarButton>
              ))}

            {![
              'recruitment',
              'profiles',
              'attendance',
              'brain',
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
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 p-3 py-2 text-center text-xs font-medium text-slate-500">
                <span className="mb-1 block">
                  Standard Mode
                </span>

                <SidebarButton
                  onClick={() => {
                    setCurrentModule(
                      defaultModule as MainModule,
                    );

                    navigate(defaultPath);

                    onMobileClose?.();
                  }}
                  className="text-[11px] font-semibold text-blue-600 hover:underline"
                >
                  Return to Portal Home
                </SidebarButton>
              </div>
            )}
          </div>
        </div>

        <DetailedSidebarUserBlock
          getInitials={getInitials}
          onLogout={onLogout}
          user={user}
        />
      </div>
    </div>
  );
}
