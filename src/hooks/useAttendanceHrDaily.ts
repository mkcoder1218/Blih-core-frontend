import { useQuery } from "@tanstack/react-query";
import { getAttendanceHrDaily } from "../api/attendanceHr";

export function useAttendanceHrDaily(params: {
  date?: string;
  departmentId?: string;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}) {
  return useQuery({
    queryKey: [
      "attendanceHr",
      "daily",
      params.date || "",
      params.departmentId || "",
      params.status || "",
      params.search || "",
      params.sortBy || "",
      params.sortOrder || "",
    ],
    queryFn: async () => getAttendanceHrDaily(params),
  });
}

