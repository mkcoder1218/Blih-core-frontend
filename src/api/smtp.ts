import { api } from "./client";

export type SmtpProvider = {
  id: string;
  name: string;
  smtpHost: string;
  smtpPort: number;
  encryptionType: string;
  secureConnection: boolean;
  isActive: boolean;
  appPasswordRequired: boolean;
  instructions?: string | null;
};

export type BusinessSmtpSettings = {
  id: string;
  providerId: string;
  senderName: string;
  isActive: boolean;
  maskedSenderEmail?: string | null;
  maskedSmtpUsername?: string | null;
  hasPassword: boolean;
  lastTestedAt?: string | null;
  lastTestStatus?: string | null;
  provider?: SmtpProvider | null;
  createdAt?: string;
  updatedAt?: string;
};

export type BusinessSmtpPayload = {
  providerId: string;
  senderEmail: string;
  smtpUsername: string;
  smtpPassword?: string;
  appPassword?: string;
  senderName: string;
  isActive: boolean;
  testRecipientEmail?: string;
};

export const smtpApi = {
  providers: async (includeInactive = false) => {
    const res = await api.get<{ providers: SmtpProvider[] }>("/api/v1/smtp/providers", { params: { includeInactive } });
    return res.data.providers;
  },
  createProvider: async (payload: Omit<SmtpProvider, "id">) => {
    const res = await api.post<{ provider: SmtpProvider }>("/api/v1/smtp/providers", payload);
    return res.data.provider;
  },
  updateProvider: async ({ id, payload }: { id: string; payload: Partial<Omit<SmtpProvider, "id">> }) => {
    const res = await api.patch<{ provider: SmtpProvider }>(`/api/v1/smtp/providers/${id}`, payload);
    return res.data.provider;
  },
  deleteProvider: async (id: string) => {
    await api.delete(`/api/v1/smtp/providers/${id}`);
  },
  businessSettings: async (businessId?: string) => {
    const res = await api.get<{ smtpSettings: BusinessSmtpSettings | null }>("/api/v1/smtp/business", { params: businessId ? { businessId } : undefined });
    return res.data.smtpSettings;
  },
  saveBusinessSettings: async (payload: BusinessSmtpPayload, businessId?: string) => {
    const res = await api.put<{ smtpSettings: BusinessSmtpSettings }>("/api/v1/smtp/business", payload, { params: businessId ? { businessId } : undefined });
    return res.data.smtpSettings;
  },
  testBusinessSettings: async (payload: Partial<BusinessSmtpPayload>, businessId?: string) => {
    const res = await api.post<{ ok: boolean; sent?: boolean; message: string }>("/api/v1/smtp/business/test", payload, { params: businessId ? { businessId } : undefined });
    return res.data;
  },
  sendPunctualityTestEmail: async (payload: { testRecipientEmail: string; subject: string; body: string }, businessId?: string) => {
    const res = await api.post<{ ok: boolean; sent?: boolean; message: string }>("/api/v1/smtp/business/punctuality-test-email", payload, { params: businessId ? { businessId } : undefined });
    return res.data;
  },
};
