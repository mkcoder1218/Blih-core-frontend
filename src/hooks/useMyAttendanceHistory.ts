import {
  keepPreviousData,
  useQuery,
} from "@tanstack/react-query";
import {
  getMyAttendanceHistory,
  type AttendanceMeHistoryParams,
} from "../api/attendanceMe";

export function useMyAttendanceHistory(
  params?: AttendanceMeHistoryParams,
) {
  return useQuery({
    queryKey: [
      "attendanceMe",
      "history",
      {
        startDate: params?.startDate || "",
        endDate: params?.endDate || "",
        status: params?.status || "",
        sortBy: params?.sortBy || "date",
        sortOrder: params?.sortOrder || "desc",
        page: params?.page || 1,
        size: params?.size || 20,
      },
    ],
    queryFn: () =>
      getMyAttendanceHistory({
        startDate: params?.startDate,
        endDate: params?.endDate,
        status: params?.status,
        sortBy: params?.sortBy || "date",
        sortOrder: params?.sortOrder || "desc",
        page: params?.page || 1,
        size: params?.size || 20,
      }),
    placeholderData: keepPreviousData,
  });
}
