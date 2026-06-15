import { api } from "./client";
import type { ApiEnvelope } from "./types";

export type DeviceStatus = "approved" | "pending" | "rejected";

export type TrustedDevice = {
  id: string;
  businessId: string;
  userId: string;
  deviceKey: string;
  label: string;
  userAgent?: string | null;
  status: DeviceStatus;
  lastSeenAt?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; fullName: string; email: string };
  approvedBy?: { id: string; fullName: string; email: string } | null;
  rejectedBy?: { id: string; fullName: string; email: string } | null;
};

export async function getMyDevices() {
  const res = await api.get<ApiEnvelope<{ devices: TrustedDevice[] }>>("/api/v1/devices/me");
  return res.data.data;
}

export async function registerMyDevice(payload: { deviceKey: string; label: string; userAgent?: string; legacyDeviceKey?: string }) {
  const res = await api.post<ApiEnvelope<{ device: TrustedDevice; requiresApproval: boolean }>>(
    "/api/v1/devices/me/register",
    payload
  );
  return res.data.data;
}

export async function getEmployeeDevices() {
  const res = await api.get<ApiEnvelope<{ devices: TrustedDevice[] }>>("/api/v1/devices");
  return res.data.data;
}

export async function approveDevice(id: string) {
  const res = await api.post<ApiEnvelope<{ device: TrustedDevice }>>(`/api/v1/devices/${id}/approve`);
  return res.data.data;
}

export async function rejectDevice(id: string) {
  const res = await api.post<ApiEnvelope<{ device: TrustedDevice }>>(`/api/v1/devices/${id}/reject`);
  return res.data.data;
}
