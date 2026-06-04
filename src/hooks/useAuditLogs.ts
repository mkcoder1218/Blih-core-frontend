import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";

export type AuditCategory = "success" | "warning" | "error";

export interface AuditLogEntry {
  id: string;
  businessId: string | null;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  category: AuditCategory;
  beforeData: Record<string, any> | null;
  afterData: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  deviceInfo: string | null;
  location: string | null;
  createdAt: string;
  User?: { id: string; fullName: string; email: string } | null;
  Business?: { id: string; name: string; slug: string } | null;
}

export interface AuditLogsResponse {
  logs: AuditLogEntry[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

export interface AuditLogFilters {
  page?: number;
  size?: number;
  businessId?: string;
  userId?: string;
  action?: string;
  entityType?: string;
  category?: AuditCategory | "";
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function useAuditLogs(filters: AuditLogFilters = {}) {
  const params: Record<string, any> = {};
  if (filters.page) params.page = filters.page;
  if (filters.size) params.size = filters.size;
  if (filters.businessId) params.businessId = filters.businessId;
  if (filters.userId) params.userId = filters.userId;
  if (filters.action) params.action = filters.action;
  if (filters.entityType) params.entityType = filters.entityType;
  if (filters.category) params.category = filters.category;
  if (filters.search) params.search = filters.search;
  if (filters.dateFrom) params.dateFrom = filters.dateFrom;
  if (filters.dateTo) params.dateTo = filters.dateTo;

  return useQuery<AuditLogsResponse>({
    queryKey: ["audit-logs", params],
    queryFn: async () => {
      const res = await api.get("/api/v1/audit-logs", { params });
      return res.data as AuditLogsResponse;
    },
    staleTime: 30_000,
  });
}
