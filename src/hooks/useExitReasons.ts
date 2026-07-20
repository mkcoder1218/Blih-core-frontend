import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { api } from "../api/client";

import type {
  ExitReason,
  ExitReasonInitiator,
} from "../components/offboarding/exit.types";

export interface CreateExitReasonInput {
  name: string;
  description?: string | null;

  allowedInitiator:
    ExitReasonInitiator;

  requiresExplanation: boolean;
  isActive: boolean;
  sortOrder?: number;
}

export interface UpdateExitReasonInput {
  name?: string;
  description?: string | null;

  allowedInitiator?:
    ExitReasonInitiator;

  requiresExplanation?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

export function useExitReasons(options?: {
  initiator?: "employee" | "employer";
  includeInactive?: boolean;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: [
      "exit-reasons",
      options?.initiator,
      options?.includeInactive,
    ],

    enabled:
      options?.enabled ?? true,

    queryFn: async () => {
      const params =
        new URLSearchParams();

      if (options?.initiator) {
        params.set(
          "initiator",
          options.initiator,
        );
      }

      if (
        options?.includeInactive
      ) {
        params.set(
          "includeInactive",
          "true",
        );
      }

      const query =
        params.toString();

      const response =
        await api.get(
          `/api/v1/hr/exit/reasons${
            query ? `?${query}` : ""
          }`,
        );

      return (
        response.data?.data ?? []
      ) as ExitReason[];
    },
  });
}

export function useCreateExitReason() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      data: CreateExitReasonInput,
    ) =>
      api.post(
        "/api/v1/hr/exit/reasons",
        data,
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["exit-reasons"],
      });
    },
  });
}

export function useUpdateExitReason() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateExitReasonInput;
    }) =>
      api.patch(
        `/api/v1/hr/exit/reasons/${id}`,
        data,
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["exit-reasons"],
      });
    },
  });
}

export function useDeleteExitReason() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api.delete(
        `/api/v1/hr/exit/reasons/${id}`,
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["exit-reasons"],
      });
    },
  });
}

export function useReorderExitReasons() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      rows: Array<{
        id: string;
        sortOrder: number;
      }>,
    ) =>
      api.patch(
        "/api/v1/hr/exit/reasons/reorder",
        {
          rows,
        },
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["exit-reasons"],
      });
    },
  });
}
