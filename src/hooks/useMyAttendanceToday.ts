import { useQuery } from "@tanstack/react-query";
import { getMyAttendanceToday } from "../api/attendanceMe";

export function useMyAttendanceToday(enabled = true) {
  return useQuery({
    queryKey: ["attendanceMe", "today"],
    queryFn: async () => getMyAttendanceToday(),
    enabled,
    refetchInterval: enabled ? 30_000 : false,
    staleTime: 15_000,
  });
}
