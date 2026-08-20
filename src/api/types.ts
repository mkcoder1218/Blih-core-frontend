import type { EmploymentStatus, EmploymentType } from "../constants/employee";

export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    size?: number;
    totalPages?: number;
    [key: string]: unknown;
  };
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
  employmentType?: EmploymentType | null;
  employmentStatus?: EmploymentStatus | null;
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
  lateNoReasonPenaltyGraceMinutes: number;
  lunchBreakEnabled?: boolean;
  lunchMode?: "FIXED" | "FLEXIBLE";
  fixedLunchStartTime?: string | null;
  fixedLunchEndTime?: string | null;
  allowMultipleLunchBreaks?: boolean;
  saturdayWorkMode?: WeekendWorkMode | null;
  sundayWorkMode?: WeekendWorkMode | null;
  createdAt?: string;
  updatedAt?: string;
};

export type WeekendWorkMode = "PAID_DAY_OFF" | "HALF_WORKING_DAY" | "FULL_WORKING_DAY";

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
  lateNoReasonPenaltyGraceMinutes?: number;
  lunchBreakEnabled?: boolean;
  lunchMode?: "FIXED" | "FLEXIBLE";
  fixedLunchStartTime?: string | null;
  fixedLunchEndTime?: string | null;
  allowMultipleLunchBreaks?: boolean;
  saturdayWorkMode?: WeekendWorkMode;
  sundayWorkMode?: WeekendWorkMode;
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
  latitude?: number | null;
  longitude?: number | null;
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
  rawWorkedMinutes?: number;
  workedMinutes: number;
  breakMinutes: number;
  penaltyMinutes?: number;
  penaltyReason?: string | null;
  deductionLabel?: string;
  latenessReasonCredit?: {
    mode?: "PER_REASON" | "GLOBAL_POOL";
    remaining: number;
    limit: number;
    used?: number;
    reasons?: Array<{
      reasonCode: string;
      label: string;
      remainingThisMonth: number;
      monthlyLimit: number;
      creditMode?: "PER_REASON" | "GLOBAL_POOL";
      globalMonthlyLimit?: number;
      globalUsedThisMonth?: number;
      globalRemainingThisMonth?: number;
    }>;
  };
  status: string;
  isLate: boolean;
  lateByMinutes?: number;
  hasSubmittedLatenessReason?: boolean;
  hasLeaveRequest?: boolean;
  lateNoReasonPenaltyEligible?: boolean;
  noReasonPenaltyMessageEligible?: boolean;
  latenessReasonCreditApplies?: boolean;
  latenessReasonCreditNote?: string | null;
};

export type AttendanceHrDailyResponse = {
  date: string;
  timezone: string;
  rows: AttendanceHrDailyRow[];
  total?: number;
  page?: number;
  size?: number;
  totalPages?: number;
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
  rawWorkedMinutes?: number;
  totalWorkedMinutes: number;
  totalBreakMinutes: number;
  penaltyMinutes?: number;
  penaltyReason?: string | null;
  expectedMinutes: number;
  scheduledDayUnits?: number;
  fullWorkingDayUnits?: number;
  halfWorkingDayUnits?: number;
  paidDayOffUnits?: number;
  approvedLeaveDays?: number;
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

export type SubscriptionAccessMode = "full" | "read_only" | "business_admin_only" | "billing_only" | "locked";
export type SubscriptionDowngradePolicy = "block" | "allow_with_warning" | "restrict_new";

export type SubscriptionPolicyInput = {
  gracePeriodDays?: number | null;
  graceAccessMode?: SubscriptionAccessMode | null;
  expiredAccessMode?: SubscriptionAccessMode | null;
  retentionDays?: number | null;
  downgradePolicy?: SubscriptionDowngradePolicy | null;
  autoRenew?: boolean | null;
  metadata?: Record<string, any>;
};

export type PlanModuleConfig = {
  id?: string;
  planId?: string;
  moduleKey: string;
  moduleName: string;
  isEnabled: boolean;
};

export type PlanFeatureConfig = {
  id?: string;
  planId?: string;
  featureId: string;
  isEnabled: boolean;
  limitValue?: string | number | null;
  limitPeriod?: "daily" | "monthly" | "yearly" | "lifetime" | null;
  overageUnitPrice?: string | number | null;
  feature?: {
    id: string;
    key: string;
    name: string;
    description?: string | null;
    category?: string | null;
    isMetered?: boolean;
    unitName?: string | null;
  };
};

export type Plan = {
  id: string;
  name: string;
  key: string;
  description?: string | null;
  basePrice: string | number;
  priceMonthly: string | number;
  priceYearly: string | number;
  billingCycle: "monthly" | "yearly";
  includedSeats: number;
  extraSeatPrice: string | number;
  currency: string;
  isActive: boolean;
  sortOrder?: number;
  userLimit?: number | null;
  status: string;
  settings?: any;
  modules?: PlanModuleConfig[];
  features?: PlanFeatureConfig[];
  subscriptionPolicy?: SubscriptionPolicyInput | null;
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
  portalUser?: { id: string; clientId: string; fullName: string; email: string } | null;
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
  portalUser?: { id: string; clientId: string; fullName: string; email: string } | null;
  enabledModules: EnabledModule[];
};

export type CreateBusinessRequest = {
  name: string;
  slug: string;
  email: string;
  phone: string;
  planId: string;
  sectorFocusId?: string | null;
  subscription?: {
    billingCycle?: "monthly" | "yearly";
    trialDays?: number;
    trialEndsAt?: string | null;
    policy?: SubscriptionPolicyInput;
  };
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
  description?: string | null;
  basePrice?: number;
  priceMonthly: number;
  priceYearly?: number;
  billingCycle?: "monthly" | "yearly";
  includedSeats?: number;
  extraSeatPrice?: number;
  currency?: string;
  isActive?: boolean;
  sortOrder?: number;
  userLimit?: number | null;
  status?: "active" | "inactive";
  settings?: any;
  modules?: PlanModuleConfig[];
  features?: Array<Omit<PlanFeatureConfig, "feature">>;
  policy?: SubscriptionPolicyInput;
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

export * from "./hrTypes";
