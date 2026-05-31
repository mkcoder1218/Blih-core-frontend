import { useQuery } from "@tanstack/react-query";
import { getAttendanceHrSummary } from "../api/attendanceHr";

export function useAttendanceHrSummary(params: { date?: string; departmentId?: string }) {
  return useQuery({
    queryKey: ["attendanceHr", "summary", params.date || "", params.departmentId || ""],
    queryFn: async () => getAttendanceHrSummary(params),
  });
}

