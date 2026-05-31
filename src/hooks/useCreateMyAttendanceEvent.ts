import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createMyAttendanceEvent } from "../api/attendanceMe";
import type { AttendanceMeCreateEventRequest } from "../api/types";

export function useCreateMyAttendanceEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AttendanceMeCreateEventRequest) => createMyAttendanceEvent(payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["attendanceMe", "today"] });
      await qc.invalidateQueries({ queryKey: ["attendanceMe", "history"] });
    },
  });
}

