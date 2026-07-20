
import {
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";

import { api } from "../api/client";

export function useExitResources(
  exitProcessId?: string,
) {
  return useQuery({
    queryKey: [
      "exit-resources",
      exitProcessId,
    ],

    enabled: Boolean(exitProcessId),

    queryFn: async () => {
      const response = await api.get(
        `/api/v1/hr/exit/${exitProcessId}/resources`,
      );

      return (
        response.data?.data ?? []
      );
    },
  });
}

export function useRegisterExitResource() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      exitProcessId,
      inventoryItemId,
    }: {
      exitProcessId: string;
      inventoryItemId: string;
    }) =>
      api.post(
        `/api/v1/hr/exit/${exitProcessId}/resources`,
        {
          inventoryItemId,
        },
      ),

    onSuccess: (
      _response,
      variables,
    ) => {
      queryClient.invalidateQueries({
        queryKey: [
          "exit-resources",
          variables.exitProcessId,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: [
          "exit-clearance",
          variables.exitProcessId,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: ["inventory"],
      });
    },
  });
}

export function useUpdateExitResourceReturn() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      exitProcessId,
      resourceId,
      data,
    }: {
      exitProcessId: string;
      resourceId: string;

      data: {
        returnStatus:
          | "pending"
          | "returned"
          | "damaged"
          | "lost"
          | "waived";

        returnCondition?: string;
        returnNotes?: string;
        deductionAmount?: number;
      };
    }) =>
      api.patch(
        `/api/v1/hr/exit/${exitProcessId}/resources/${resourceId}`,
        data,
      ),

    onSuccess: (
      _response,
      variables,
    ) => {
      queryClient.invalidateQueries({
        queryKey: [
          "exit-resources",
          variables.exitProcessId,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: [
          "exit-clearance",
          variables.exitProcessId,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: ["inventory"],
      });
    },
  });
}