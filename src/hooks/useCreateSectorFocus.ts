import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { ApiEnvelope, CreateSectorFocusRequest, SectorFocus } from "../api/types";

export function useCreateSectorFocus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateSectorFocusRequest) => {
      const res = await api.post<ApiEnvelope<{ sectorFocus: SectorFocus }>>("/api/v1/sector-focuses", payload);
      return res.data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["sectorFocuses"] });
    },
  });
}

