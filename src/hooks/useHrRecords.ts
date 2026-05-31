import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";

// ─── Employee Directory ───────────────────────────────────────────────────────

export function useEmployees(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ["hr-records", params?.limit, params?.offset],
    queryFn: async () => {
      const limit = params?.limit ?? 10;
      const offset = params?.offset ?? 0;
      const res = await api.get(`/api/v1/hr/records?limit=${limit}&offset=${offset}`);
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

export function useExitRequests() {
  return useQuery({
    queryKey: ["exit-requests"],
    queryFn: async () => {
      const res = await api.get("/api/v1/hr/exit");
      const raw = res.data?.data;
      return (Array.isArray(raw?.rows) ? raw.rows : Array.isArray(raw) ? raw : []) as any[];
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
    }) => api.post("/api/v1/hr/exit/resign", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exit-requests"] });
    },
  });
}

export function useUpdateExitStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/api/v1/hr/exit/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exit-requests"] });
    },
  });
}
