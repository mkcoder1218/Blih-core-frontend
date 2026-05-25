import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import type { ApiEnvelope, SectorFocusesResponse } from "../api/types";

export function useSectorFocuses() {
  return useQuery({
    queryKey: ["sectorFocuses"],
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<SectorFocusesResponse>>("/api/v1/sector-focuses");
      return res.data;
    },
  });
}

