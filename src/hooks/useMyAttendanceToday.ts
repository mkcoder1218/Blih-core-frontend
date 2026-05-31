import { useQuery } from "@tanstack/react-query";
import { getMyAttendanceToday } from "../api/attendanceMe";

export function useMyAttendanceToday() {
  return useQuery({
    queryKey: ["attendanceMe", "today"],
    queryFn: async () => getMyAttendanceToday(),
    refetchInterval: 30_000,
  });
}

