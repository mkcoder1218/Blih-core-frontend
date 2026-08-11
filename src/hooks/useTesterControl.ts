import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  testerApi,
  type CreateTesterPayload,
  type UpdateTesterPayload,
} from "../api/tester";

const KEY = ["tester-control"] as const;

export function useTesterSession() {
  return useQuery({
    queryKey: [...KEY, "session"],
    queryFn: testerApi.session,
    staleTime: 30_000,
    retry: false,
  });
}

export function useTesterAccounts(enabled = true) {
  return useQuery({
    queryKey: [...KEY, "accounts"],
    queryFn: testerApi.list,
    enabled,
    staleTime: 10_000,
    retry: false,
  });
}

export function useTesterOptions(enabled = true) {
  return useQuery({
    queryKey: [...KEY, "options"],
    queryFn: testerApi.options,
    enabled,
    staleTime: 30_000,
    retry: false,
  });
}

function invalidate(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: KEY });
  queryClient.invalidateQueries({ queryKey: ["me"] });
  queryClient.invalidateQueries({ queryKey: ["roles"] });
  queryClient.invalidateQueries({ queryKey: ["hr-records"] });
  queryClient.invalidateQueries({ queryKey: ["profiles"] });
}

export function useCreateTesterAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTesterPayload) => testerApi.create(payload),
    onSuccess: () => invalidate(queryClient),
  });
}

export function useUpdateTesterAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: UpdateTesterPayload }) =>
      testerApi.update(userId, payload),
    onSuccess: () => invalidate(queryClient),
  });
}

export function useResetTesterPassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, password }: { userId: string; password?: string }) =>
      testerApi.resetPassword(userId, password),
    onSuccess: () => invalidate(queryClient),
  });
}
