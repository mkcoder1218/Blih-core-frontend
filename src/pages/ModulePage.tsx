import React from 'react';

import {
  Navigate,
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
} from 'react-router-dom';

import AttendanceView from '../components/attendance/AttendanceView';
import CareerManagementView from '../components/career/CareerManagementView';
import WorkforceFinanceView from '../components/finance/WorkforceFinanceView';
import OffboardingView from '../components/offboarding/ExitOffboardingView';
import OnboardingView from '../components/onboarding/OnboardingView';
import CreateEmployeeModal from '../components/people/CreateEmployeeModal';
import EmployeeDetailPage from '../components/people/EmployeeDetailPage';
import PeopleProfilesView from '../components/people/PeopleProfilesView';
import PerformanceView from '../components/performance/PerformanceView';
import BusinessSettingsView from '../components/settings/BusinessSettingsView';

import {
  ProjectDetailsPage,
  ProjectsPage,
} from '../features/projects';

import EmploymentContractTemplatePage from './EmploymentContractTemplatePage';
import RecruitmentPage from './RecruitmentPage';

const ALLOWED_MODULES = new Set([
  'onboarding',
  'profiles',
  'attendance',
  'performance',
  'talent',
  'exit',
  'finance',
  'projects',
  'settings',
]);

type AlertType =
  | 'success'
  | 'info'
  | 'error';

interface AppOutletContext {
  showAlert?: (
    message: string,
    type?: AlertType,
  ) => void;
}

function getRolePrefix(
  pathname: string,
): string {
  if (
    pathname.startsWith(
      '/super-admin',
    )
  ) {
    return '/super-admin';
  }

  if (
    pathname.startsWith(
      '/hr-manager',
    )
  ) {
    return '/hr-manager';
  }

  if (
    pathname.startsWith(
      '/business-admin',
    )
  ) {
    return '/business-admin';
  }

  return '/employee';
}

export default function ModulePage() {
  const params =
    useParams();

  const navigate =
    useNavigate();

  const location =
    useLocation();

  const outlet =
    useOutletContext<AppOutletContext | null>();

  const showAlert =
    outlet?.showAlert ??
    (() => undefined);

  const [
    updateEmployeeUserId,
    setUpdateEmployeeUserId,
  ] = React.useState<
    string | null
  >(null);

  const moduleName =
    String(
      params.module ||
        (
          location.pathname.includes(
            '/settings',
          )
            ? 'settings'
            : ''
        ),
    );

  const tab =
    String(
      params.tab ||
        (
          moduleName ===
          'exit'
            ? 'offboarding'
            : moduleName ===
                'profiles'
              ? 'directory'
              : 'overview'
        ),
    );

  const rolePrefix =
    getRolePrefix(
      location.pathname,
    );

  const projectUuid =
    moduleName ===
      'projects' &&
    /^[0-9a-fA-F-]{36}$/.test(
      tab,
    )
      ? tab
      : '';

  if (
    !ALLOWED_MODULES.has(
      moduleName,
    )
  ) {
    return (
      <Navigate
        to=".."
        replace
      />
    );
  }

  if (projectUuid) {
    return (
      <ProjectDetailsPage
        projectId={
          projectUuid
        }
      />
    );
  }

  if (
    moduleName ===
    'exit'
  ) {
    const legacyExitTab =
      tab === 'overview' ||
      tab === 'offboarding'
        ? 'my-exit'
        : tab === 'resign'
          ? 'requests'
          : tab === 'forms'
            ? 'reasons'
            : tab ===
                  'interviews' ||
                tab ===
                  'documents'
              ? 'clearance'
              : tab;

    return (
      <Navigate
        to={`${rolePrefix}/talent/exit-${legacyExitTab}`}
        replace
      />
    );
  }

  if (
    moduleName ===
      'profiles' &&
    tab === 'employee'
  ) {
    const employee =
      location.state
        ?.employee;

    const fromTab =
      location.state
        ?.fromTab ||
      'directory';

    if (!employee) {
      return (
        <Navigate
          to={`${rolePrefix}/profiles/directory`}
          replace
        />
      );
    }

    const employeeUserId =
      employee.userId ||
      employee.user?.id ||
      employee.id;

    return (
      <>
        <EmployeeDetailPage
          targetUserId={
            employeeUserId
          }
          user={{
            name:
              employee.user
                ?.fullName ||
              employee.name ||
              'Unknown',

            email:
              employee.user
                ?.email ||
              employee.email ||
              '',

            role:
              employee.position
                ?.title ||
              employee.title ||
              employee.department
                ?.name ||
              employee.department ||
              'Staff',
          }}
          onBack={() =>
            navigate(
              `${rolePrefix}/profiles/${fromTab}`,
            )
          }
          onEdit={() =>
            setUpdateEmployeeUserId(
              employeeUserId,
            )
          }
        />

        <CreateEmployeeModal
          isOpen={Boolean(
            updateEmployeeUserId,
          )}
          onClose={() =>
            setUpdateEmployeeUserId(
              null,
            )
          }
          showAlert={
            showAlert
          }
          mode="update"
          targetUserId={
            updateEmployeeUserId ||
            undefined
          }
        />
      </>
    );
  }

  if (
    moduleName ===
    'talent'
  ) {
    const talentTab =
      tab === 'overview'
        ? 'recruitment-overview'
        : tab;

    if (
      talentTab ===
      'profiles-employee'
    ) {
      const employee =
        location.state
          ?.employee;

      const fromTab =
        location.state
          ?.fromTab ||
        'profiles-directory';

      if (!employee) {
        return (
          <Navigate
            to={`${rolePrefix}/talent/profiles-directory`}
            replace
          />
        );
      }

      const employeeUserId =
        employee.userId ||
        employee.user?.id ||
        employee.id;

      return (
        <>
          <EmployeeDetailPage
            targetUserId={
              employeeUserId
            }
            user={{
              name:
                employee.user
                  ?.fullName ||
                employee.name ||
                'Unknown',

              email:
                employee.user
                  ?.email ||
                employee.email ||
                '',

              role:
                employee.position
                  ?.title ||
                employee.title ||
                employee.department
                  ?.name ||
                employee.department ||
                'Staff',
            }}
            onBack={() =>
              navigate(
                `${rolePrefix}/talent/${fromTab}`,
              )
            }
            onEdit={() =>
              setUpdateEmployeeUserId(
                employeeUserId,
              )
            }
          />

          <CreateEmployeeModal
            isOpen={Boolean(
              updateEmployeeUserId,
            )}
            onClose={() =>
              setUpdateEmployeeUserId(
                null,
              )
            }
            showAlert={
              showAlert
            }
            mode="update"
            targetUserId={
              updateEmployeeUserId ||
              undefined
            }
          />
        </>
      );
    }

    if (
      talentTab.startsWith(
        'recruitment-',
      )
    ) {
      const recruitmentTab =
        talentTab.replace(
          'recruitment-',
          '',
        ) || 'overview';

      return (
        <RecruitmentPage
          currentTab={
            recruitmentTab
          }
          routeForTab={(
            nextTab,
          ) =>
            `${rolePrefix}/talent/recruitment-${nextTab}`
          }
        />
      );
    }

    if (
      talentTab.startsWith(
        'onboarding-',
      )
    ) {
      const onboardingTab =
        talentTab.replace(
          'onboarding-',
          '',
        );

      if (
        onboardingTab ===
        'contract'
      ) {
        return (
          <Navigate
            to={`${rolePrefix}/talent/profiles-contract_templates`}
            replace
          />
        );
      }

      return (
        <OnboardingView
          currentTab={
            onboardingTab as
              | 'overview'
              | 'progress'
              | 'probation'
              | 'checklists'
              | 'policy'
          }
          onDraftAiSuggestion={() =>
            undefined
          }
          showAlert={
            showAlert
          }
        />
      );
    }

    if (
      talentTab ===
      'profiles-contract_templates'
    ) {
      return (
        <EmploymentContractTemplatePage
          showAlert={
            showAlert
          }
        />
      );
    }

    if (
      talentTab.startsWith(
        'profiles-',
      )
    ) {
      const profilesTab =
        talentTab.replace(
          'profiles-',
          '',
        ) || 'directory';

      return (
        <PeopleProfilesView
          currentProfilesTab={
            profilesTab as any
          }
          onDraftAiSuggestion={() =>
            undefined
          }
          showAlert={
            showAlert
          }
          onViewProfile={(
            employee,
          ) =>
            navigate(
              `${rolePrefix}/talent/profiles-employee`,
              {
                state: {
                  employee,
                  fromTab:
                    talentTab,
                },
              },
            )
          }
        />
      );
    }

    if (
      talentTab.startsWith(
        'career-',
      )
    ) {
      const careerTab =
        talentTab.replace(
          'career-',
          '',
        );

      return (
        <CareerManagementView
          currentTab={
            careerTab as any
          }
          onDraftAiSuggestion={() =>
            undefined
          }
          showAlert={
            showAlert
          }
        />
      );
    }

    if (
      talentTab.startsWith(
        'exit-',
      )
    ) {
      const exitTab =
        talentTab.replace(
          'exit-',
          '',
        ) ||
        'my-exit';

      return (
        <OffboardingView
          currentTab={
            exitTab as any
          }
          onDraftAiSuggestion={() =>
            undefined
          }
          showAlert={
            showAlert
          }
        />
      );
    }

    return (
      <Navigate
        to={`${rolePrefix}/talent/recruitment-overview`}
        replace
      />
    );
  }

  if (
    moduleName ===
    'profiles'
  ) {
    if (
      tab ===
      'overview'
    ) {
      return (
        <Navigate
          to={`${rolePrefix}/profiles/directory`}
          replace
        />
      );
    }

    if (
      tab ===
      'contract_templates'
    ) {
      return (
        <EmploymentContractTemplatePage
          showAlert={
            showAlert
          }
        />
      );
    }

    return (
      <PeopleProfilesView
        currentProfilesTab={
          tab as any
        }
        onDraftAiSuggestion={() =>
          undefined
        }
        showAlert={
          showAlert
        }
        onViewProfile={(
          employee,
        ) =>
          navigate(
            `${rolePrefix}/profiles/employee`,
            {
              state: {
                employee,
                fromTab:
                  tab,
              },
            },
          )
        }
      />
    );
  }

  if (
    moduleName ===
    'attendance'
  ) {
    return (
      <AttendanceView
        currentAttendanceTab={
          tab as any
        }
        routeForTab={(
          nextTab,
        ) =>
          `${rolePrefix}/attendance/${nextTab}`
        }
        onDraftAiSuggestion={() =>
          undefined
        }
        showAlert={
          showAlert
        }
      />
    );
  }

  if (
    moduleName ===
    'onboarding'
  ) {
    if (
      tab ===
      'contract'
    ) {
      return (
        <Navigate
          to={`${rolePrefix}/profiles/contract_templates`}
          replace
        />
      );
    }

    return (
      <OnboardingView
        currentTab={
          tab as
            | 'overview'
            | 'progress'
            | 'probation'
            | 'checklists'
            | 'policy'
        }
        onDraftAiSuggestion={() =>
          undefined
        }
        showAlert={
          showAlert
        }
      />
    );
  }

  if (
    moduleName ===
    'finance'
  ) {
    return (
      <WorkforceFinanceView
        currentTab={
          tab as any
        }
        onDraftAiSuggestion={() =>
          undefined
        }
        showAlert={
          showAlert
        }
      />
    );
  }

  if (
    moduleName ===
    'projects'
  ) {
    return (
      <ProjectsPage
        currentTab={
          (
            tab ===
            'my-projects'
              ? 'mine'
              : tab
          ) as any
        }
      />
    );
  }

  if (
    moduleName ===
    'settings'
  ) {
    return (
      <BusinessSettingsView
        showAlert={
          showAlert
        }
      />
    );
  }

  if (
    moduleName ===
    'performance'
  ) {
    return (
      <PerformanceView
        currentTab={
          tab as any
        }
        onDraftAiSuggestion={() =>
          undefined
        }
        showAlert={
          showAlert
        }
      />
    );
  }

  return null;
}
