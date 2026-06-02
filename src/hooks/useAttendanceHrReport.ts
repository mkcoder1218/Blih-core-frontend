import { useQuery } from "@tanstack/react-query";
import { getAttendanceHrReport } from "../api/attendanceHr";

export function useAttendanceHrReport(params: {
  startDate: string;
  endDate: string;
  departmentId?: string;
  employeeId?: string;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  enabled?: boolean;
}) {
  const { enabled, ...queryParams } = params;
  return useQuery({
    queryKey: [
      "attendanceHr",
      "report",
      params.startDate,
      params.endDate,
      params.departmentId || "",
      params.employeeId || "",
      params.status || "",
      params.search || "",
      params.sortBy || "",
      params.sortOrder || "",
    ],
    queryFn: async () => getAttendanceHrReport(queryParams),
    enabled: enabled !== false,
  });
}
