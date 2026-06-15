import { useMutation, useQueryClient } from "@tanstack/react-query";
import { revertMyLastAttendanceEvent } from "../api/attendanceMe";

export function useRevertMyAttendanceEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => revertMyLastAttendanceEvent(),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["attendanceMe", "today"] });
      await qc.invalidateQueries({ queryKey: ["attendanceMe", "history"] });
    },
  });
}
