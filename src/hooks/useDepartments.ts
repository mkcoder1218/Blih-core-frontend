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
