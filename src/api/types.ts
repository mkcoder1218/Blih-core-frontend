import type { EmploymentStatus, EmploymentType } from "../constants/employee";

export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  requestId?: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type SafeUser = {
  id: string;
  businessId: string;
  fullName: string;
  email: string;
  phone?: string | null;
  status: string;
  isPlatformSuperAdmin: boolean;
  lastLoginAt?: string | null;
};

export type Business = {
  id: string;
  name: string;
  slug: string;
  email?: string | null;
  phone?: string | null;
  status: string;
  planId?: string | null;
  sectorFocusId?: string | null;
};

export type BusinessAttendanceSettings = {
  id: string;
  businessId: string;
  attendanceEnabled: boolean;
  locationName: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  allowedRadiusMeters: number;
  timezone: string;
  expectedDailyMinutes: number;
  defaultStartTime: string;
  defaultEndTime: string;
  lateGracePeriodMinutes: number;
  lunchBreakEnabled?: boolean;
  lunchMode?: "FIXED" | "FLEXIBLE";
  fixedLunchStartTime?: string | null;
  fixedLunchEndTime?: string | null;
  allowMultipleLunchBreaks?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type UpsertBusinessAttendanceSettingsRequest = {
  attendanceEnabled: boolean;
  locationName?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  allowedRadiusMeters?: number;
  timezone?: string;
  expectedDailyMinutes?: number;
  defaultStartTime?: string;
  defaultEndTime?: string;
  lateGracePeriodMinutes?: number;
  lunchBreakEnabled?: boolean;
  lunchMode?: "FIXED" | "FLEXIBLE";
  fixedLunchStartTime?: string | null;
  fixedLunchEndTime?: string | null;
  allowMultipleLunchBreaks?: boolean;
};

export type AttendanceEventType = "CHECK_IN" | "LUNCH_OUT" | "LUNCH_IN" | "CHECK_OUT";

export type AttendanceMeTimelineItem = {
  id: string;
  type: AttendanceEventType;
  label: string;
  timestampUtc: string;
  withinAllowedRadius: boolean;
  distanceMeters: number;
};

export type AttendanceMeTodayResponse = {
  serverNowUtc?: string;
  settings: BusinessAttendanceSettings | null;
  disabledReason: string | null;
  timeline: AttendanceMeTimelineItem[];
  nextAllowed: AttendanceEventType[];
  cooldown?: {
    action: AttendanceEventType;
    active: boolean;
    startedAtUtc: string;
    untilUtc: string;
    remainingMinutes: number;
  } | null;
  calculation?: any;
  lunch?: {
    lunchBreakEnabled: boolean;
    lunchMode: string;
    fixedLunchStartTime: string | null;
    fixedLunchEndTime: string | null;
    allowMultipleLunchBreaks: boolean;
  };
};

export type AttendanceMeCreateEventRequest = {
  type: AttendanceEventType;
  latitude: number;
  longitude: number;
};

export type AttendanceMeHistoryResponse = {
  rows: any[];
  count: number;
  page: number;
  size: number;
};

export type AttendanceHrSummaryResponse = {
  date: string;
  timezone: string;
  cards: {
    inProgress: number;
    totalCheckIns: number;
    completed: number;
    missed: number;
    lateArrivals: number;
  };
};

export type AttendanceHrDailyRow = {
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  department: { id: string; name: string } | null;
  events: {
    checkInAtUtc: string | null;
    lunchOutAtUtc: string | null;
    lunchInAtUtc: string | null;
    checkOutAtUtc: string | null;
  };
  workedMinutes: number;
  breakMinutes: number;
  status: string;
  isLate: boolean;
};

export type AttendanceHrDailyResponse = {
  date: string;
  timezone: string;
  rows: AttendanceHrDailyRow[];
};

export type AttendanceHrReportRow = {
  employeeId: string;
  employeeName: string;
  department: { id: string; name: string } | null;
  date: string;
  checkInAtUtc: string | null;
  lunchOutAtUtc: string | null;
  lunchInAtUtc: string | null;
  checkOutAtUtc: string | null;
  totalWorkedMinutes: number;
  totalBreakMinutes: number;
  expectedMinutes: number;
  overtimeMinutes: number;
  missingMinutes: number;
  lateByMinutes: number;
  currentStatus: string;
  lateReasonName?: string;
  lateExplanation?: string;
};

export type AttendanceHrReportResponse = {
  timezone: string;
  rows: AttendanceHrReportRow[];
};

export type AttendanceHrEmployeeResponse = {
  date: string;
  timezone: string;
  employee: { id: string; fullName: string; email: string; department: { id: string; name: string } | null };
  events: any[];
};

export type Plan = {
  id: string;
  name: string;
  key: string;
  priceMonthly: string | number;
  userLimit?: number | null;
  status: string;
  settings?: any;
};

export type SectorFocus = {
  id: string;
  name: string;
  key: string;
  description?: string | null;
  status: string;
};

export type EnabledModule = {
  moduleKey: string;
  moduleName: string;
  status: string;
  enabledAt?: string | null;
};

export type LoginSuccessResponse = {
  accessToken: string;
  refreshToken: string;
  user: SafeUser;
  business: Business | null;
  roles: string[];
  permissions: string[];
  enabledModules: EnabledModule[];
};

export type WorkspaceOption = { id: string; name: string; slug: string; status: string };

export type LoginRequiresWorkspace = {
  requiresWorkspaceSelection: true;
  businesses: WorkspaceOption[];
};

export type LoginResponse = LoginSuccessResponse | LoginRequiresWorkspace;

export type MeResponse = {
  user: SafeUser;
  business: Business | null;
  roles: string[];
  permissions: string[];
  enabledModules: EnabledModule[];
};

export type CreateBusinessRequest = {
  name: string;
  slug: string;
  email: string;
  phone: string;
  planId: string;
  sectorFocusId?: string | null;
};

export type BusinessesResponse = {
  businesses: Business[];
};

export type PlansResponse = {
  plans: Plan[];
};

export type SectorFocusesResponse = {
  sectorFocuses: SectorFocus[];
};

export type UpdateBusinessRequest = Partial<CreateBusinessRequest> & {
  status?: "active" | "inactive";
};

export type CreatePlanRequest = {
  name: string;
  key: string;
  priceMonthly: number;
  userLimit?: number | null;
  status?: "active" | "inactive";
  settings?: any;
};

export type UpdatePlanRequest = Partial<CreatePlanRequest>;

export type CreateSectorFocusRequest = {
  name: string;
  key: string;
  description?: string | null;
  status?: "active" | "inactive";
};

export type UpdateSectorFocusRequest = Partial<CreateSectorFocusRequest>;

export type CreateBusinessAdminRequest = {
  fullName: string;
  email: string;
  phone?: string | null;
  password: string;
};

export type CreateBusinessAdminResponse = {
  user: SafeUser;
};

export type ProfileTemplateField = {
  name: string;
  label: string;
  componentType: "input" | "select" | "textarea" | "checkbox" | "date" | "number";
  required?: boolean;
  hasValidation?: boolean;
  validationMessage?: string;
  placeholder?: string;
  options?: { label: string; value: string }[];
};

export type ProfileTemplate = {
  id: string;
  businessId: string;
  name: string;
  description?: string | null;
  fields: ProfileTemplateField[];
  createdAt: string;
  updatedAt: string;
};

export type ProfileDraft = {
  id: string;
  businessId: string;
  templateId: string;
  status: "draft" | "completed";
  data: Record<string, any>;
  createdById: string;
  createdAt: string;
  updatedAt: string;
};

export type ProfileTemplatesResponse = { templates: ProfileTemplate[] };
export type ProfileDraftsResponse = { drafts: ProfileDraft[] };

export type CreateProfileTemplateRequest = {
  name: string;
  description?: string | null;
  fields: ProfileTemplateField[];
};

export type UpdateProfileTemplateRequest = Partial<CreateProfileTemplateRequest>;

export type CreateProfileDraftRequest = {
  templateId: string;
  status?: "draft" | "completed";
  data: Record<string, any>;
};

export type UpdateProfileDraftRequest = Partial<Pick<CreateProfileDraftRequest, "status" | "data">>;

export type Department = {
  id: string;
  name: string;
  businessId: string;
  status: "active" | "inactive";
  parentId?: string | null;
};

export type DepartmentsResponse = {
  departments: Department[];
  count?: number;
};

export type CreateDepartmentRequest = {
  name: string;
  status?: "active" | "inactive";
  parentId?: string | null;
};

export type Position = {
  id: string;
  title: string;
  businessId: string;
  status: "active" | "inactive";
  departmentId?: string | null;
};

export type PositionsResponse = {
  positions: Position[];
  count?: number;
};

export type CreatePositionRequest = {
  title: string;
  status?: "active" | "inactive";
  departmentId?: string | null;
};

export type User = SafeUser;

export type UsersResponse = {
  rows: User[];
  count: number;
};

export type EmployeeSalaryInfo = {
  baseSalary: number | string | null;
  currency: string;
};

export type EmployeeEmergencyContact = {
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  country: string | null;
};

export type EmployeeMetadata = {
  dateOfBirth?: string | null;
  city?: string | null;
  countryOfBirth?: string | null;
  additionalPhone?: string | null;
  branch?: string | null;
  bankDetails?: { bankName?: string | null; accountNumber?: string | null }[];
  assetsAndCredentials?: any[];
  additionalNotes?: string | null;
  uploads?: Record<string, any>;
  [key: string]: any;
};

export type EmployeeRecord = {
  id: string;
  businessId: string;
  userId: string;
  employeeCode: string;
  departmentId?: string | null;
  positionId?: string | null;
  managerUserId?: string | null;
  employmentType?: EmploymentType | null;
  employmentStatus: EmploymentStatus;
  hireDate: string;
  contractStartDate?: string | null;
  probationEndDate?: string | null;
  contractEndDate?: string | null;
  salaryInfo?: EmployeeSalaryInfo;
  emergencyContact?: EmployeeEmergencyContact;
  metadata?: EmployeeMetadata;
  user?: User;
  department?: Department | null;
  position?: Position | null;
};
