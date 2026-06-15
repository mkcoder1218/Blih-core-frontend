import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { ApiEnvelope, PositionsResponse, CreatePositionRequest } from "../api/types";

export function usePositions() {
  return useQuery({
    queryKey: ["positions"],
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<PositionsResponse>>("/api/v1/positions");
      return res.data.data;
    },
  });
}

export function useCreatePosition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (req: CreatePositionRequest) => {
      const res = await api.post<ApiEnvelope<any>>("/api/v1/positions", req);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
    },
  });
}

export function useUpdatePosition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...req }: CreatePositionRequest & { id: string }) => {
      const res = await api.patch<ApiEnvelope<any>>(`/api/v1/positions/${id}`, req);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
    },
  });
}

export function useDeletePosition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, replacementPositionId, employeeReassignments }: { id: string; replacementPositionId?: string; employeeReassignments?: Array<{ employeeRecordId: string; positionId: string }> }) => {
      const res = await api.delete<ApiEnvelope<any>>(`/api/v1/positions/${id}`, {
        data: { ...(replacementPositionId ? { replacementPositionId } : {}), ...(employeeReassignments ? { employeeReassignments } : {}) },
      });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      queryClient.invalidateQueries({ queryKey: ["hr-records"] });
      queryClient.invalidateQueries({ queryKey: ["organogram"] });
    },
  });
}
