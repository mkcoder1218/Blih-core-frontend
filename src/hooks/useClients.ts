import { useQuery } from "@tanstack/react-query";
import { listClients } from "../api/crm";

export function useClients() {
  return useQuery({ queryKey: ["crm-clients"], queryFn: () => listClients(), staleTime: 60_000 });
}
