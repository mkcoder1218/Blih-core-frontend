import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { ApiEnvelope, DepartmentsResponse, CreateDepartmentRequest } from "../api/types";

export function useDepartments() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<DepartmentsResponse>>("/api/v1/departments");
      return res.data.data;
    },
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (req: CreateDepartmentRequest) => {
      const res = await api.post<ApiEnvelope<any>>("/api/v1/departments", req);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...req }: CreateDepartmentRequest & { id: string }) => {
      const res = await api.patch<ApiEnvelope<any>>(`/api/v1/departments/${id}`, req);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, replacementDepartmentId, employeeReassignments }: { id: string; replacementDepartmentId?: string; employeeReassignments?: Array<{ employeeRecordId: string; departmentId: string }> }) => {
      const res = await api.delete<ApiEnvelope<any>>(`/api/v1/departments/${id}`, {
        data: { ...(replacementDepartmentId ? { replacementDepartmentId } : {}), ...(employeeReassignments ? { employeeReassignments } : {}) },
      });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      queryClient.invalidateQueries({ queryKey: ["hr-records"] });
      queryClient.invalidateQueries({ queryKey: ["organogram"] });
    },
  });
}
