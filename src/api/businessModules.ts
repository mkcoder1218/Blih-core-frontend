import { api } from "./client";

export interface BusinessModuleItem {
  id: string;
  businessId: string;
  moduleKey: string;
  moduleName: string;
  status: "active" | "inactive";
  enabledAt?: string | null;
}

export const businessModulesApi = {
  list: async (businessId?: string): Promise<BusinessModuleItem[]> => {
    const res = await api.get<{ modules: BusinessModuleItem[] }>("/api/v1/business-modules", {
      params: businessId ? { businessId } : undefined,
    });
    return res.data?.modules || [];
  },

  update: async (id: string, businessId: string, status: "active" | "inactive"): Promise<BusinessModuleItem> => {
    const res = await api.patch<{ module: BusinessModuleItem }>(`/api/v1/business-modules/${id}`, {
      businessId,
      status,
    });
    return res.data?.module;
  },

  toggle: async (
    businessId: string,
    moduleKey: string,
    moduleName: string,
    status: "active" | "inactive"
  ): Promise<BusinessModuleItem> => {
    const res = await api.post<{ module: BusinessModuleItem }>("/api/v1/business-modules/toggle", {
      businessId,
      moduleKey,
      moduleName,
      status,
    });
    return res.data?.module;
  },
};
