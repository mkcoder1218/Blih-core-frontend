import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createBudgetReallocation, decideFinanceApproval, getWorkforceFinance } from "../api/finance";

export function useWorkforceFinance(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["workforce-finance", params],
    queryFn: async () => {
      const res = await getWorkforceFinance(params);
      return res.data?.data ?? {};
    },
    staleTime: 15_000,
  });
}

export function useFinanceApprovalAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ kind, id, action }: { kind: "salary" | "expense" | "budget"; id: string; action: "approve" | "reject" }) =>
      decideFinanceApproval(kind, id, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workforce-finance"] });
    },
  });
}

export function useCreateBudgetReallocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => createBudgetReallocation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workforce-finance"] });
    },
  });
}
