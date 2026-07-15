import { useQuery } from "@tanstack/react-query";
import { getAttendanceHrDaily } from "../api/attendanceHr";

export function useAttendanceHrDaily(params: {
  date?: string;
  departmentId?: string;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  size?: number;
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
      params.page || 1,
      params.size || 20,
    ],
    queryFn: async () => getAttendanceHrDaily(params),
  });
}
