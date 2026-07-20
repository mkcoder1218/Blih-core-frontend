import type { BusinessesTab, MainModule, ProjectsTab, RecruitmentTab } from '../../types';

export interface SidebarProps {
  currentModule: MainModule;
  setCurrentModule: (module: MainModule) => void;
  currentRecruitmentTab: RecruitmentTab;
  setCurrentRecruitmentTab: (tab: RecruitmentTab) => void;
  currentProfilesTab: string;
  setCurrentProfilesTab: (tab: any) => void;
  currentAttendanceTab: string;
  setCurrentAttendanceTab: (tab: any) => void;
  currentTalentTab: string;
  setCurrentTalentTab: (tab: any) => void;
  currentExitTab:
    | 'overview'
    | 'resign'
    | 'interviews'
    | 'documents'
    | 'clearance'
    | 'forms'
    | 'offboarding';
  setCurrentExitTab: (
    tab: 'overview' | 'resign' | 'interviews' | 'documents' | 'clearance' | 'forms' | 'offboarding',
  ) => void;
  currentFinanceTab:
    | 'overview'
    | 'employee_salary'
    | 'salary_payroll'
    | 'payroll_template'
    | 'budget'
    | 'my_payslip'
    | 'benefits'
    | 'exports';
  setCurrentFinanceTab: (
    tab:
      | 'overview'
      | 'employee_salary'
      | 'salary_payroll'
      | 'payroll_template'
      | 'budget'
      | 'my_payslip'
      | 'benefits'
      | 'exports',
  ) => void;
  currentProjectsTab?: ProjectsTab;
  setCurrentProjectsTab?: (tab: ProjectsTab) => void;
  currentOnboardingTab:
    | 'overview'
    | 'contract'
    | 'progress'
    | 'probation'
    | 'checklists'
    | 'policy';
  setCurrentOnboardingTab: (
    tab: 'overview' | 'contract' | 'progress' | 'probation' | 'checklists' | 'policy',
  ) => void;
  currentPerformanceTab:
    | 'overview'
    | 'performance_review'
    | 'okrs'
    | 'kpis'
    | 'discipline'
    | 'evaluation_form';
  setCurrentPerformanceTab: (
    tab: 'overview' | 'performance_review' | 'okrs' | 'kpis' | 'discipline' | 'evaluation_form',
  ) => void;
  currentBusinessesTab: BusinessesTab;
  setCurrentBusinessesTab: (tab: BusinessesTab) => void;
  isDetailedView: boolean;
  setIsDetailedView: (val: boolean) => void;
  user?: {
    name: string;
    email: string;
    role: string;
    positionTitle?: string | null;
    departmentName?: string | null;
    employmentType?: string | null;
    employmentStatus?: string | null;
  } | null;
  onLogout?: () => void;
  onProfileClick?: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}
