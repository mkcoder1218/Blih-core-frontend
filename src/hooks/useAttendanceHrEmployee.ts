import { useQuery } from "@tanstack/react-query";
import { getAttendanceHrEmployee } from "../api/attendanceHr";

export function useAttendanceHrEmployee(employeeId: string | null | undefined, params: { date?: string }) {
  return useQuery({
    queryKey: ["attendanceHr", "employee", employeeId || "", params.date || ""],
    enabled: Boolean(employeeId),
    queryFn: async () => getAttendanceHrEmployee(employeeId as string, params),
  });
}

