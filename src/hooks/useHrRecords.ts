import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";

// ─── Employee Directory ───────────────────────────────────────────────────────

export function useEmployees(params?: { limit?: number; offset?: number; employmentType?: string; employmentStatus?: string }) {
  return useQuery({
    queryKey: ["hr-records", params?.limit, params?.offset, params?.employmentType, params?.employmentStatus],
    queryFn: async () => {
      const limit = params?.limit ?? 10;
      const offset = params?.offset ?? 0;
      const qs = new URLSearchParams({ limit: String(limit), offset: String(offset) });
      if (params?.employmentType) qs.set("employmentType", params.employmentType);
      if (params?.employmentStatus) qs.set("employmentStatus", params.employmentStatus);
      const res = await api.get(`/api/v1/hr/records?${qs.toString()}`);
      return {
        employees: (res.data?.data as any[]) ?? [],
        total: res.data?.meta?.total ?? 0,
      };
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => api.delete(`/api/v1/hr/records/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-records"] });
    },
  });
}

// ─── Organogram ───────────────────────────────────────────────────────────────

export function useUpdateEmployeePassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, password }: { userId: string; password: string }) =>
      api.patch(`/api/v1/users/${userId}`, { password }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-records"] });
    },
  });
}

export function useUpdateEmployeeRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, roleKey }: { userId: string; roleKey: string }) =>
      api.patch(`/api/v1/users/${userId}`, { roleKeys: [roleKey] }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-records"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

export function useAllRoles() {
  return useQuery({
    queryKey: ["roles", "all"],
    queryFn: async () => {
      const res = await api.get("/api/v1/roles");
      return (res.data?.data?.roles || res.data?.roles || res.data?.data || []) as any[];
    },
  });
}

export type UserExemptionStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface UserExemption {
  id: string;
  userId: string;
  reason: string;
  excludeFromPayroll: boolean;
  status: UserExemptionStatus;
  requestedBy: string;
  approvedBy?: string | null;
  rejectedBy?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  user?: { id: string; fullName: string; email?: string };
  requester?: { id: string; fullName: string; email?: string };
  approver?: { id: string; fullName: string; email?: string };
  rejecter?: { id: string; fullName: string; email?: string };
}

export function useUserExemptions(params?: { status?: string; userId?: string; page?: number; size?: number; search?: string }) {
  return useQuery({
    queryKey: ["user-exemptions", params],
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (params?.status) qs.set("status", params.status);
      if (params?.userId) qs.set("userId", params.userId);
      if (params?.search) qs.set("search", params.search);
      qs.set("page", String(params?.page ?? 1));
      qs.set("size", String(params?.size ?? 20));
      const res = await api.get(`/api/v1/user-exemptions?${qs.toString()}`);
      return {
        rows: (res.data?.rows ?? []) as UserExemption[],
        total: res.data?.total ?? 0,
        page: res.data?.page ?? 1,
        totalPages: res.data?.totalPages ?? 1,
      };
    },
  });
}

export function useCreateUserExemption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { userId: string; reason: string; excludeFromPayroll: boolean }) =>
      api.post("/api/v1/user-exemptions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-exemptions"] });
      queryClient.invalidateQueries({ queryKey: ["hr-records"] });
      queryClient.invalidateQueries({ queryKey: ["employee-salaries"] });
      queryClient.invalidateQueries({ queryKey: ["payroll-dashboard"] });
    },
  });
}

export function useApproveUserExemption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/api/v1/user-exemptions/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-exemptions"] });
      queryClient.invalidateQueries({ queryKey: ["hr-records"] });
      queryClient.invalidateQueries({ queryKey: ["employee-salaries"] });
      queryClient.invalidateQueries({ queryKey: ["payroll-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-hr"] });
      queryClient.invalidateQueries({ queryKey: ["my-attendance-today"] });
    },
  });
}

export function useRejectUserExemption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/api/v1/user-exemptions/${id}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-exemptions"] });
      queryClient.invalidateQueries({ queryKey: ["hr-records"] });
    },
  });
}

export function useOrganogram() {
  return useQuery({
    queryKey: ["organogram"],
    queryFn: async () => {
      const res = await api.get("/api/v1/hr/organogram");
      return (res.data?.data?.tree ?? res.data?.tree ?? []) as any[];
    },
  });
}

// ─── Exit / Offboarding ───────────────────────────────────────────────────────

export function useExitRequests(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["exit-requests"],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const res = await api.get("/api/v1/hr/exit");
      const raw = res.data?.data;
      return (Array.isArray(raw?.rows) ? raw.rows : Array.isArray(raw) ? raw : []) as any[];
    },
  });
}

export function useExitAnalytics(params?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: ["exit-analytics", params?.from, params?.to],
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (params?.from) qs.set("from", params.from);
      if (params?.to) qs.set("to", params.to);
      const res = await api.get(`/api/v1/hr/exit/analytics${qs.toString() ? `?${qs.toString()}` : ""}`);
      return (res.data?.data ?? {}) as any;
    },
  });
}

export function useMyExitRequest() {
  return useQuery({
    queryKey: ["exit-request-me"],
    queryFn: async () => {
      const res = await api.get("/api/v1/hr/exit/me");
      return (res.data?.data ?? null) as any | null;
    },
  });
}

export function useExitRequest(id?: string) {
  return useQuery({
    queryKey: ["exit-request", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const res = await api.get(`/api/v1/hr/exit/${id}`);
      return (res.data?.data ?? null) as any | null;
    },
  });
}

export function useExitClearance(exitProcessId?: string) {
  return useQuery({
    queryKey: ["exit-clearance", exitProcessId],
    enabled: Boolean(exitProcessId),
    queryFn: async () => {
      const res = await api.get(`/api/v1/hr/exit/${exitProcessId}/clearance`);
      return (res.data?.data ?? null) as any | null;
    },
  });
}

export function useSubmitExitRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      effectiveDate: string;
      reason?: string;
      letterHtml: string;
      noticePeriodDays: number;
      templateId?: string;
      templateSnapshot?: any;
      formValues?: Record<string, any>;
    }) => api.post("/api/v1/hr/exit/resign", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exit-requests"] });
      queryClient.invalidateQueries({ queryKey: ["exit-request-me"] });
    },
  });
}

export function useCreateExitProcess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { employeeUserId: string; exitType: "termination" | "redundancy"; effectiveDate: string; reason?: string }) =>
      api.post("/api/v1/hr/exit", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exit-requests"] });
      queryClient.invalidateQueries({ queryKey: ["exit-analytics"] });
    },
  });
}

export function useUpdateExitProcess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/api/v1/hr/exit/${id}`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["exit-requests"] });
      queryClient.invalidateQueries({ queryKey: ["exit-request", variables.id] });
    },
  });
}

export function useExitTimeline(exitProcessId?: string) {
  return useQuery({
    queryKey: ["exit-timeline", exitProcessId],
    enabled: Boolean(exitProcessId),
    queryFn: async () => {
      const res = await api.get(`/api/v1/hr/exit/${exitProcessId}/timeline`);
      return (res.data?.data ?? []) as any[];
    },
  });
}

export function useExitForms() {
  return useQuery({
    queryKey: ["exit-forms"],
    queryFn: async () => {
      const res = await api.get("/api/v1/hr/forms?category=exit");
      return (res.data?.data ?? []) as any[];
    },
  });
}

export function useCreateExitForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/api/v1/hr/forms", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["exit-forms"] }),
  });
}

export function useUpdateExitForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/api/v1/hr/forms/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["exit-forms"] }),
  });
}

export function useDeleteExitForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/hr/forms/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["exit-forms"] }),
  });
}

export function useUpdateExitStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, data }: { id: string; status: string; data?: any }) =>
      api.patch(`/api/v1/hr/exit/${id}/status`, { status, ...(data || {}) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exit-requests"] });
      queryClient.invalidateQueries({ queryKey: ["exit-request-me"] });
      queryClient.invalidateQueries({ queryKey: ["exit-request"] });
    },
  });
}

export function useApproveExitRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { effectiveDate?: string; approvalNote?: string } }) =>
      api.post(`/api/v1/hr/exit/${id}/approve`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exit-requests"] });
      queryClient.invalidateQueries({ queryKey: ["exit-request-me"] });
      queryClient.invalidateQueries({ queryKey: ["exit-analytics"] });
    },
  });
}

export function useRejectExitRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rejectionReason }: { id: string; rejectionReason: string }) =>
      api.post(`/api/v1/hr/exit/${id}/reject`, { rejectionReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exit-requests"] });
      queryClient.invalidateQueries({ queryKey: ["exit-request-me"] });
      queryClient.invalidateQueries({ queryKey: ["exit-analytics"] });
    },
  });
}

export function useDisableExitAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/api/v1/hr/exit/${id}/disable-account`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exit-requests"] });
      queryClient.invalidateQueries({ queryKey: ["exit-request-me"] });
      queryClient.invalidateQueries({ queryKey: ["exit-analytics"] });
    },
  });
}

export function useSendOffboardingForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/api/v1/hr/exit/${id}/offboarding-form/send`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exit-requests"] });
      queryClient.invalidateQueries({ queryKey: ["exit-request-me"] });
    },
  });
}

export function useSubmitOffboardingForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.post(`/api/v1/hr/exit/${id}/offboarding-form`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["exit-request-me"] });
      queryClient.invalidateQueries({ queryKey: ["exit-request", variables.id] });
    },
  });
}

export function useUpdateExitFinalPay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: {
      status: "pending" | "processing" | "settled";
      grossAmount?: number;
      deductions?: number;
      netAmount?: number;
      settledAt?: string;
      settledByUserId?: string;
      notes?: string;
    } }) => api.patch(`/api/v1/hr/exit/${id}/final-pay`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["exit-requests"] });
      queryClient.invalidateQueries({ queryKey: ["exit-clearance", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["exit-analytics"] });
    },
  });
}

export function useCompleteExitClearanceStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ exitProcessId, stepId, notes }: { exitProcessId: string; stepId: string; notes?: string }) =>
      api.post(`/api/v1/hr/exit/${exitProcessId}/clearance/${stepId}/complete`, { notes }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["exit-clearance", variables.exitProcessId] });
      queryClient.invalidateQueries({ queryKey: ["exit-requests"] });
    },
  });
}

export function useWaiveExitClearanceStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ exitProcessId, stepId, notes }: { exitProcessId: string; stepId: string; notes?: string }) =>
      api.post(`/api/v1/hr/exit/${exitProcessId}/clearance/${stepId}/waive`, { notes }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["exit-clearance", variables.exitProcessId] });
      queryClient.invalidateQueries({ queryKey: ["exit-requests"] });
    },
  });
}

export function useUpdateExitClearanceStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ exitProcessId, stepId, data }: { exitProcessId: string; stepId: string; data: any }) =>
      api.patch(`/api/v1/hr/exit/${exitProcessId}/clearance/${stepId}`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["exit-clearance", variables.exitProcessId] });
      queryClient.invalidateQueries({ queryKey: ["exit-requests"] });
    },
  });
}

export function useExitInterviews() {
  return useQuery({
    queryKey: ["exit-interviews"],
    queryFn: async () => {
      const res = await api.get("/api/v1/hr/exit/interviews");
      return (res.data?.data ?? []) as any[];
    },
  });
}

export function useCreateExitInterview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ exitProcessId, data }: { exitProcessId: string; data: any }) =>
      api.post(`/api/v1/hr/exit/${exitProcessId}/interviews`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exit-interviews"] });
    },
  });
}

export function useUpdateExitInterview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ interviewId, data }: { interviewId: string; data: any }) =>
      api.patch(`/api/v1/hr/exit/interviews/${interviewId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exit-interviews"] });
    },
  });
}

export function useCompleteExitInterview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ interviewId, data }: { interviewId: string; data: any }) =>
      api.post(`/api/v1/hr/exit/interviews/${interviewId}/complete`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exit-interviews"] });
      queryClient.invalidateQueries({ queryKey: ["exit-clearance"] });
    },
  });
}

export function useSendExitInterviewReminder() {
  return useMutation({
    mutationFn: (interviewId: string) => api.post(`/api/v1/hr/exit/interviews/${interviewId}/send-reminder`),
  });
}

export function useExitDocuments(exitProcessId?: string) {
  return useQuery({
    queryKey: ["exit-documents", exitProcessId],
    enabled: Boolean(exitProcessId),
    queryFn: async () => {
      const res = await api.get(`/api/v1/hr/exit/${exitProcessId}/documents`);
      return (res.data?.data ?? null) as any | null;
    },
  });
}

export function useUploadExitDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ exitProcessId, documentId, file }: { exitProcessId: string; documentId: string; file: File }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("moduleKey", "hr");
      return api.post(`/api/v1/hr/exit/${exitProcessId}/documents/${documentId}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["exit-documents", variables.exitProcessId] });
    },
  });
}

export function useVerifyExitDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ exitProcessId, documentId }: { exitProcessId: string; documentId: string }) =>
      api.post(`/api/v1/hr/exit/${exitProcessId}/documents/${documentId}/verify`),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["exit-documents", variables.exitProcessId] });
    },
  });
}

export function useUpdateExitDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ exitProcessId, documentId, data }: { exitProcessId: string; documentId: string; data: any }) =>
      api.patch(`/api/v1/hr/exit/${exitProcessId}/documents/${documentId}`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["exit-documents", variables.exitProcessId] });
    },
  });
}
