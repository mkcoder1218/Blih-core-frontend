import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createHrLateReason, deactivateHrLateReason, getHrLateReasons, getLatenessCreditConfig, updateHrLateReason, updateLatenessCreditConfig, type AttendanceLateReasonPayload, type LatenessCreditConfig } from "../api/attendanceLateReasons";

export function useHrLateReasons() {
  return useQuery({
    queryKey: ["attendanceHr", "lateReasons"],
    queryFn: async () => getHrLateReasons(),
  });
}

export function useCreateHrLateReason() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AttendanceLateReasonPayload) => createHrLateReason(payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["attendanceHr", "lateReasons"] });
    },
  });
}

export function useUpdateHrLateReason() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { reasonId: string; data: any }) => updateHrLateReason(payload.reasonId, payload.data),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["attendanceHr", "lateReasons"] });
    },
  });
}

export function useDeactivateHrLateReason() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (reasonId: string) => deactivateHrLateReason(reasonId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["attendanceHr", "lateReasons"] });
    },
  });
}

export function useLatenessCreditConfig() {
  return useQuery({
    queryKey: ["lateness-credit-config"],
    queryFn: async () => getLatenessCreditConfig(),
  });
}

export function useUpdateLatenessCreditConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: LatenessCreditConfig) => updateLatenessCreditConfig(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lateness-credit-config"] });
      qc.invalidateQueries({ queryKey: ["attendance-me-today"] });
    },
  });
}
