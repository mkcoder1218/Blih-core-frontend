import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import {
  employmentChangesApi,
  type CreateEmploymentChangePayload,
  type EmploymentChangeListParams,
  type ImmediateTitlePayload,
} from "../api/employmentChanges";
import type {
  ApiEnvelope,
  DepartmentsResponse,
  PositionsResponse,
} from "../api/types";

const KEY = ["employment-changes"];

function invalidateRelated(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: KEY });
  queryClient.invalidateQueries({ queryKey: ["employee-profile"] });
  queryClient.invalidateQueries({ queryKey: ["hr-records"] });
  queryClient.invalidateQueries({ queryKey: ["positions"] });
  queryClient.invalidateQueries({ queryKey: ["departments"] });
  queryClient.invalidateQueries({ queryKey: ["finance-workforce"] });
  queryClient.invalidateQueries({ queryKey: ["employee-salaries"] });
}

export function useEmploymentChangeContext(employeeUserId?: string) {
  return useQuery({
    queryKey: [...KEY, "context", employeeUserId || "me"],
    queryFn: async () => {
      const [context, positionsResponse, departmentsResponse] = await Promise.all([
        employmentChangesApi.context(employeeUserId),
        api.get<ApiEnvelope<PositionsResponse>>("/api/v1/positions?page=1&size=1000"),
        api.get<ApiEnvelope<DepartmentsResponse>>("/api/v1/departments?page=1&size=1000"),
      ]);

      const organizationPositions =
        positionsResponse.data?.data?.positions || [];
      const organizationDepartments =
        departmentsResponse.data?.data?.departments || [];

      return {
        ...context,
        positions: organizationPositions
          .filter(
            (position) =>
              !position.status ||
              String(position.status).toLowerCase() === "active",
          )
          .map((position) => ({
            id: position.id,
            title: position.title,
            departmentId: position.departmentId || null,
          })),
        departments: organizationDepartments
          .filter(
            (department) =>
              !department.status ||
              String(department.status).toLowerCase() === "active",
          )
          .map((department) => ({
            id: department.id,
            name: department.name,
          })),
      };
    },
    staleTime: 30_000,
  });
}

export function useEmploymentChangeAnalytics() {
  return useQuery({
    queryKey: [...KEY, "analytics"],
    queryFn: employmentChangesApi.analytics,
    staleTime: 15_000,
  });
}

export function useEmploymentChangePage(params?: EmploymentChangeListParams) {
  return useQuery({
    queryKey: [...KEY, "page", params],
    queryFn: () => employmentChangesApi.list(params),
    staleTime: 15_000,
  });
}

export function useEmploymentChanges(params?: EmploymentChangeListParams) {
  return useQuery({
    queryKey: [...KEY, "list", params],
    queryFn: async () => (await employmentChangesApi.list(params)).rows,
    staleTime: 15_000,
  });
}

export function useEmploymentChange(id?: string | null) {
  return useQuery({
    queryKey: [...KEY, "detail", id],
    queryFn: () => employmentChangesApi.get(String(id)),
    enabled: Boolean(id),
  });
}

export function useEmploymentChangeHistory(id?: string | null) {
  return useQuery({
    queryKey: [...KEY, "history", id],
    queryFn: () => employmentChangesApi.history(String(id)),
    enabled: Boolean(id),
  });
}

export function useCreateEmploymentChange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateEmploymentChangePayload) =>
      employmentChangesApi.create(payload),
    onSuccess: () => invalidateRelated(queryClient),
  });
}

export function useImmediateTitleChange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ImmediateTitlePayload) =>
      employmentChangesApi.immediateTitle(payload),
    onSuccess: () => invalidateRelated(queryClient),
  });
}

export function useApproveEmploymentChange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) =>
      employmentChangesApi.approve(id, comment),
    onSuccess: () => invalidateRelated(queryClient),
  });
}

export function useCounterEmploymentChange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      recommendedSalary,
      comment,
    }: {
      id: string;
      recommendedSalary: number;
      comment: string;
    }) => employmentChangesApi.counter(id, recommendedSalary, comment),
    onSuccess: () => invalidateRelated(queryClient),
  });
}

export function useRejectEmploymentChange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      employmentChangesApi.reject(id, reason),
    onSuccess: () => invalidateRelated(queryClient),
  });
}

export function useCancelEmploymentChange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      employmentChangesApi.cancel(id, reason),
    onSuccess: () => invalidateRelated(queryClient),
  });
}
