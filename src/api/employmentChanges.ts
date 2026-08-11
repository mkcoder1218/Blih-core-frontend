import { api } from "./client";

export type EmploymentChangeKind = "TITLE" | "SALARY" | "COMBINED";
export type EmploymentChangeStatus =
  | "PENDING"
  | "APPROVED"
  | "SCHEDULED"
  | "APPLIED"
  | "REJECTED"
  | "CANCELLED";
export type EmploymentChangeStage = "MANAGER" | "HR" | "FINANCE" | "ADMIN" | "COMPLETED";
export type TitleChangeType = "PROMOTION" | "LATERAL_TITLE_CHANGE" | "DEMOTION" | "CORRECTION";

export interface EmploymentChangePerson {
  id: string;
  fullName: string;
  email?: string | null;
}

export interface EmploymentChangeContext {
  employee: EmploymentChangePerson & {
    manager?: EmploymentChangePerson | null;
  };
  current: {
    positionId?: string | null;
    title?: string | null;
    departmentId?: string | null;
    departmentName?: string | null;
    salary: number;
    currency?: string | null;
  };
  positions: Array<{
    id: string;
    title: string;
    departmentId?: string | null;
    level?: number | null;
  }>;
  departments: Array<{
    id: string;
    name: string;
  }>;
}

export interface EmploymentChangeRequest {
  id: string;
  businessId: string;
  employeeUserId: string;
  requestedByUserId: string;
  requestKind: EmploymentChangeKind;
  titleChangeType?: TitleChangeType | null;
  currentPositionId?: string | null;
  currentTitle?: string | null;
  targetPositionId?: string | null;
  targetTitle?: string | null;
  currentDepartmentId?: string | null;
  targetDepartmentId?: string | null;
  currentSalary?: number | null;
  requestedSalary?: number | null;
  recommendedSalary?: number | null;
  finalSalary?: number | null;
  increaseAmount?: number | null;
  increasePercent?: number | null;
  reason: string;
  effectiveDate: string;
  attachmentUrl?: string | null;
  status: EmploymentChangeStatus;
  approvalStage: EmploymentChangeStage;
  currentApproverUserId?: string | null;
  currentApproverRoleKey?: string | null;
  approvedAt?: string | null;
  scheduledAt?: string | null;
  appliedAt?: string | null;
  rejectedAt?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
  employee?: (EmploymentChangePerson & {
    manager?: EmploymentChangePerson | null;
    department?: { id: string; name: string } | null;
    position?: { id: string; title: string } | null;
  }) | null;
  requester?: EmploymentChangePerson | null;
  currentApprover?: EmploymentChangePerson | null;
  targetPosition?: { id: string; title: string; departmentId?: string | null } | null;
  targetDepartment?: { id: string; name: string } | null;
  canApprove?: boolean;
  canCounter?: boolean;
  canCancel?: boolean;
}

export interface EmploymentChangeAction {
  id: string;
  requestId: string;
  actorUserId?: string | null;
  stage?: string | null;
  action: string;
  comment?: string | null;
  beforeData?: Record<string, any> | null;
  afterData?: Record<string, any> | null;
  createdAt: string;
  actor?: EmploymentChangePerson | null;
}

export interface CreateEmploymentChangePayload {
  employeeUserId?: string;
  titleChangeType?: TitleChangeType;
  targetPositionId?: string;
  targetTitle?: string;
  targetDepartmentId?: string;
  requestedSalary?: number;
  increasePercent?: number;
  reason: string;
  effectiveDate: string;
  attachmentUrl?: string;
  source?: string;
}

export interface EmploymentChangeListParams {
  status?: string;
  requestKind?: string;
  approvalStage?: string;
  employeeUserId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  scope?: "mine" | "approvals" | "visible";
  page?: number;
  size?: number;
}

export interface EmploymentChangeListResult {
  rows: EmploymentChangeRequest[];
  pagination: {
    page: number;
    size: number;
    total: number;
    totalPages: number;
  };
}

export interface EmploymentChangeAnalytics {
  total: number;
  pending: number;
  awaitingMyApproval: number;
  scheduled: number;
  applied: number;
  appliedThisMonth: number;
  rejected: number;
  cancelled: number;
  byType: {
    title: number;
    salary: number;
    combined: number;
  };
}

export interface ImmediateTitlePayload {
  employeeUserId: string;
  titleChangeType?: TitleChangeType;
  targetPositionId?: string;
  targetTitle?: string;
  targetDepartmentId?: string;
  reason: string;
}

const base = "/api/v1/people/employment-changes";

export const employmentChangesApi = {
  context: async (employeeUserId?: string): Promise<EmploymentChangeContext> => {
    const response = await api.get(`${base}/context`, {
      params: employeeUserId ? { employeeUserId } : undefined,
    });
    return response.data?.context ?? response.data?.data?.context ?? response.data?.data ?? response.data;
  },

  analytics: async (): Promise<EmploymentChangeAnalytics> => {
    const response = await api.get(`${base}/analytics`);
    return response.data?.analytics ?? response.data?.data?.analytics ?? response.data?.data ?? response.data;
  },

  list: async (params?: EmploymentChangeListParams): Promise<EmploymentChangeListResult> => {
    const response = await api.get(base, { params });
    const payload = response.data?.data ?? response.data;
    return {
      rows: payload?.rows ?? [],
      pagination: payload?.pagination ?? {
        page: params?.page ?? 1,
        size: params?.size ?? 10,
        total: payload?.rows?.length ?? 0,
        totalPages: 1,
      },
    };
  },

  get: async (id: string): Promise<EmploymentChangeRequest> => {
    const response = await api.get(`${base}/${id}`);
    return response.data?.request ?? response.data?.data?.request ?? response.data?.data ?? response.data;
  },

  history: async (id: string): Promise<EmploymentChangeAction[]> => {
    const response = await api.get(`${base}/${id}/history`);
    return response.data?.rows ?? response.data?.data?.rows ?? [];
  },

  create: async (payload: CreateEmploymentChangePayload): Promise<EmploymentChangeRequest> => {
    const response = await api.post(base, payload);
    return response.data?.request ?? response.data?.data?.request ?? response.data?.data ?? response.data;
  },

  immediateTitle: async (payload: ImmediateTitlePayload) => {
    const response = await api.post(`${base}/immediate-title`, payload);
    return response.data?.data ?? response.data;
  },

  approve: async (id: string, comment?: string): Promise<EmploymentChangeRequest> => {
    const response = await api.post(`${base}/${id}/approve`, { comment });
    return response.data?.request ?? response.data?.data?.request ?? response.data?.data ?? response.data;
  },

  counter: async (id: string, recommendedSalary: number, comment: string): Promise<EmploymentChangeRequest> => {
    const response = await api.post(`${base}/${id}/counter`, { recommendedSalary, comment });
    return response.data?.request ?? response.data?.data?.request ?? response.data?.data ?? response.data;
  },

  reject: async (id: string, reason: string): Promise<EmploymentChangeRequest> => {
    const response = await api.post(`${base}/${id}/reject`, { reason });
    return response.data?.request ?? response.data?.data?.request ?? response.data?.data ?? response.data;
  },

  cancel: async (id: string, reason?: string): Promise<EmploymentChangeRequest> => {
    const response = await api.post(`${base}/${id}/cancel`, { reason });
    return response.data?.request ?? response.data?.data?.request ?? response.data?.data ?? response.data;
  },

  deleteOwn: async (id: string): Promise<{ deleted: boolean; id: string }> => {
    const response = await api.delete(`${base}/${id}`);
    return response.data?.data ?? response.data;
  },
};
