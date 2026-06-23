import { api } from "./client";

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  assetTag?: string | null;
  serialNumber?: string | null;
  condition: string;
  status: string;
  notes?: string | null;
}

export async function listInventory(params?: { status?: string }) {
  const res = await api.get("/api/v1/inventory", { params });
  return (res.data?.data ?? res.data) as InventoryItem[];
}

export async function createInventoryItem(data: Partial<InventoryItem>) {
  const res = await api.post("/api/v1/inventory", data);
  return res.data?.data ?? res.data;
}

export async function updateInventoryItem(id: string, data: Partial<InventoryItem>) {
  const res = await api.patch(`/api/v1/inventory/${id}`, data);
  return res.data?.data ?? res.data;
}

export async function deleteInventoryItem(id: string) {
  await api.delete(`/api/v1/inventory/${id}`);
}
