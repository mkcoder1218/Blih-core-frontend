import { useQuery } from "@tanstack/react-query";
import { getAttendanceSettings } from "../api/attendanceSettings";

export function useAttendanceSettings(businessId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: ["attendanceSettings", businessId],
    enabled: Boolean(enabled && businessId),
    queryFn: async () => getAttendanceSettings(businessId as string),
  });
}

