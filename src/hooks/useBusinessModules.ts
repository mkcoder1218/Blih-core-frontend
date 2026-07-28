import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { businessModulesApi, BusinessModuleItem } from "../api/businessModules";

export function useBusinessModules(businessId?: string, enabled = true) {
  return useQuery({
    queryKey: ["business-modules", businessId],
    queryFn: () => businessModulesApi.list(businessId),
    enabled: Boolean(enabled),
  });
}

export function useToggleBusinessModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      businessId,
      moduleKey,
      moduleName,
      status,
    }: {
      businessId: string;
      moduleKey: string;
      moduleName: string;
      status: "active" | "inactive";
    }) => businessModulesApi.toggle(businessId, moduleKey, moduleName, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["business-modules", variables.businessId] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}
