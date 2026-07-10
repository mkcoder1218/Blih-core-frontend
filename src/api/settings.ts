import { api } from "./client";

export type BusinessSetting = {
  id: string;
  businessId: string;
  key: string;
  value: any;
  category: string;
  isPublic: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export const settingsApi = {
  list: async () => {
    const res = await api.get<{ settings: BusinessSetting[] }>("/api/v1/settings");
    return res.data.settings;
  },
  set: async (payload: { key: string; value: any; category?: string; isPublic?: boolean }) => {
    const res = await api.post<{ setting: BusinessSetting }>("/api/v1/settings", payload);
    return res.data.setting;
  },
};
