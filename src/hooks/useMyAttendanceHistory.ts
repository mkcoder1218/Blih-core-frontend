import { useQuery } from "@tanstack/react-query";
import { getMyAttendanceHistory } from "../api/attendanceMe";

export function useMyAttendanceHistory(params?: {
  startDate?: string;
  endDate?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  size?: number;
}) {
  return useQuery({
    queryKey: [
      "attendanceMe",
      "history",
      params?.startDate || "",
      params?.endDate || "",
      params?.status || "",
      params?.sortBy || "",
      params?.sortOrder || "",
      params?.page || 1,
      params?.size || 30,
    ],
    queryFn: async () => getMyAttendanceHistory(params),
  });
}
