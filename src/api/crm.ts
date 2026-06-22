import { api } from "./client";

export type Client = {
  id: string;
  companyName: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
};

export async function listClients(params?: Record<string, unknown>) {
  const res = await api.get("/api/v1/crm/clients", { params: { page: 1, size: 100, ...params } });
  const payload = res.data?.data;
  return Array.isArray(payload) ? payload as Client[] : (payload?.rows || []) as Client[];
}
