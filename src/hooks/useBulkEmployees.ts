import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bulkImportEmployees, validateBulkEmployees, type BulkEmployeeRow } from "../api/bulkEmployees";

export function useValidateBulkEmployees() {
  return useMutation({
    mutationFn: (rows: BulkEmployeeRow[]) => validateBulkEmployees(rows),
  });
}

export function useBulkImportEmployees() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rows: BulkEmployeeRow[]) => bulkImportEmployees(rows),
    onSuccess: (result) => {
      if (result.created > 0 || result.updated > 0) {
        queryClient.invalidateQueries({ queryKey: ["hr-records"] });
        queryClient.invalidateQueries({ queryKey: ["organogram"] });
      }
    },
  });
}
