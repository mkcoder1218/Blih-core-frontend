import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  employmentChangesApi,
  type CreateEmploymentChangePayload,
  type EmploymentChangeListParams,
  type ImmediateTitlePayload,
} from "../api/employmentChanges";

const KEY = ["employment-changes"];

function invalidateRelated(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: KEY });
  queryClient.invalidateQueries({ queryKey: ["employee-profile"] });
  queryClient.invalidateQueries({ queryKey: ["hr-records"] });
  queryClient.invalidateQueries({ queryKey: ["positions"] });
  queryClient.invalidateQueries({ queryKey: ["finance-workforce"] });
  queryClient.invalidateQueries({ queryKey: ["employee-salaries"] });
}

export function useEmploymentChangeContext(employeeUserId?: string) {
  return useQuery({
    queryKey: [...KEY, "context", employeeUserId || "me"],
    queryFn: () => employmentChangesApi.context(employeeUserId),
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
    mutationFn: (payload: CreateEmploymentChangePayload) => employmentChangesApi.create(payload),
    onSuccess: () => invalidateRelated(queryClient),
  });
}

export function useImmediateTitleChange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ImmediateTitlePayload) => employmentChangesApi.immediateTitle(payload),
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
