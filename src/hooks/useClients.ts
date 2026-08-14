import { useQuery } from "@tanstack/react-query";
import { listCompanyClients } from "../api/clients";
import { useMe } from "./useMe";

export function useClients(enabled = true) {
  const me = useMe();
  const roles: string[] = (me.data?.data?.roles || []) as string[];
  const roleAllowed =
    roles.includes("BUSINESS_ADMIN") || roles.includes("PROJECT_MANAGER");

  return useQuery({
    queryKey: ["shared-clients"],
    queryFn: () => listCompanyClients(),
    enabled: enabled && roleAllowed,
    staleTime: 60_000,
  });
}
