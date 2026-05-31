import { useMutation, useQueryClient } from "@tanstack/react-query";
import { upsertAttendanceSettings } from "../api/attendanceSettings";
import type { UpsertBusinessAttendanceSettingsRequest } from "../api/types";

export function useUpsertAttendanceSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { businessId: string; data: UpsertBusinessAttendanceSettingsRequest }) => {
      return upsertAttendanceSettings(payload.businessId, payload.data);
    },
    onSuccess: async (_data, vars) => {
      await qc.invalidateQueries({ queryKey: ["attendanceSettings", vars.businessId] });
    },
  });
}

