import { api } from "./client";

export type TesterLevel = "MASTER" | "STANDARD";
export type TesterSafetyMode = "RESTRICTED" | "FULL";

export interface TesterBusiness {
  id: string;
  name: string;
  slug?: string | null;
  status?: string | null;
}

export interface TesterRole {
  id: string;
  businessId?: string | null;
  key: string;
  name: string;
  description?: string | null;
  domain?: string | null;
  isSystemRole?: boolean;
}

export interface TesterAccountView {
  id: string;
  userId: string;
  testerLevel: TesterLevel;
  safetyMode: TesterSafetyMode;
  notes?: string | null;
  createdByTesterUserId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
    status: string;
    businessId: string;
    business?: TesterBusiness | null;
    roles: TesterRole[];
    lastLoginAt?: string | null;
    createdAt?: string;
  };
  employee?: {
    id: string;
    employeeCode: string;
    employmentType?: string | null;
    employmentStatus?: string | null;
    department?: { id: string; name: string } | null;
    position?: { id: string; title: string } | null;
  } | null;
}

export interface TesterSession {
  isTestAccount: boolean;
  testerLevel: TesterLevel | null;
  isMasterTester: boolean;
  safetyMode: TesterSafetyMode | null;
  user?: {
    id: string;
    fullName: string;
    email: string;
    businessId: string;
    status: string;
    lastLoginAt?: string | null;
    business?: TesterBusiness | null;
  } | null;
}

export interface TesterOptions {
  canManage: boolean;
  businesses: TesterBusiness[];
  roles: TesterRole[];
}

export interface PlatformTesterOptions {
  businesses: TesterBusiness[];
}

export interface CreateTesterPayload {
  fullName: string;
  email: string;
  phone?: string;
  password?: string;
  businessId: string;
  roleKeys: string[];
  notes?: string;
}

export interface CreateMasterTesterPayload {
  fullName: string;
  email: string;
  phone?: string;
  password?: string;
  businessId: string;
  notes?: string;
}

export interface UpdateTesterPayload {
  fullName?: string;
  email?: string;
  phone?: string;
  status?: "active" | "disabled";
  businessId?: string;
  roleKeys?: string[];
  notes?: string;
}

const base = "/api/v1/people/tester-control";

export const testerApi = {
  session: async (): Promise<TesterSession> => {
    const response = await api.get(`${base}/session`);
    return response.data?.session ?? response.data?.data?.session ?? response.data?.data ?? response.data;
  },

  list: async (): Promise<TesterAccountView[]> => {
    const response = await api.get(base);
    return response.data?.testers ?? response.data?.data?.testers ?? [];
  },

  options: async (): Promise<TesterOptions> => {
    const response = await api.get(`${base}/options`);
    return response.data?.options ?? response.data?.data?.options ?? response.data?.data ?? response.data;
  },

  create: async (payload: CreateTesterPayload) => {
    const response = await api.post(base, payload);
    return response.data?.data ?? response.data;
  },

  update: async (userId: string, payload: UpdateTesterPayload): Promise<TesterAccountView> => {
    const response = await api.patch(`${base}/${userId}`, payload);
    return response.data?.tester ?? response.data?.data?.tester ?? response.data?.data ?? response.data;
  },

  resetPassword: async (userId: string, password?: string) => {
    const response = await api.post(`${base}/${userId}/reset-password`, password ? { password } : {});
    return response.data?.data ?? response.data;
  },

  platformOptions: async (): Promise<PlatformTesterOptions> => {
    const response = await api.get(`${base}/platform/options`);
    return response.data?.options ?? response.data?.data?.options ?? response.data?.data ?? response.data;
  },

  platformMasters: async (): Promise<TesterAccountView[]> => {
    const response = await api.get(`${base}/platform/masters`);
    return response.data?.masters ?? response.data?.data?.masters ?? [];
  },

  createMaster: async (payload: CreateMasterTesterPayload) => {
    const response = await api.post(`${base}/platform/masters`, payload);
    return response.data?.data ?? response.data;
  },
};
