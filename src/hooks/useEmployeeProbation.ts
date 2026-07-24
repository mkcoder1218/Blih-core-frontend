import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getEmployeeProbation,
  initializeEmployeeProbation,
  type InitializeEmployeeProbationPayload,
} from "../api/employeeProbation";

export const employeeProbationKeys = {
  all: ["employee-probations"] as const,

  detail: (probationId: string) =>
    [
      ...employeeProbationKeys.all,
      "detail",
      probationId,
    ] as const,
};

export function useEmployeeProbation(
  probationId?: string,
) {
  return useQuery({
    queryKey:
      employeeProbationKeys.detail(
        probationId || "",
      ),

    queryFn: () =>
      getEmployeeProbation(
        probationId!,
      ),

    enabled: Boolean(probationId),
  });
}

export function useInitializeEmployeeProbation() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      payload: InitializeEmployeeProbationPayload,
    ) =>
      initializeEmployeeProbation(
        payload,
      ),

    onSuccess: async (
      probation,
    ) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey:
            employeeProbationKeys.all,
        }),

        queryClient.invalidateQueries({
          queryKey: ["probation"],
        }),

        queryClient.invalidateQueries({
          queryKey: ["hr-records"],
        }),

        queryClient.invalidateQueries({
          queryKey: [
            "employee-profile",
            probation.employeeUserId,
          ],
        }),
      ]);
    },
  });
}
