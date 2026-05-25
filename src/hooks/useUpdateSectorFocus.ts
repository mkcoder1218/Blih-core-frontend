import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { ApiEnvelope, SectorFocus, UpdateSectorFocusRequest } from "../api/types";

export function useUpdateSectorFocus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; data: UpdateSectorFocusRequest }) => {
      const res = await api.patch<ApiEnvelope<{ sectorFocus: SectorFocus }>>(`/api/v1/sector-focuses/${payload.id}`, payload.data);
      return res.data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["sectorFocuses"] });
    },
  });
}

