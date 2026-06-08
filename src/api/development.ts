/**
 * Development (Training + Promotion) API
 * Follows the same pattern as src/api/client.ts wrappers throughout the project.
 */
import { api } from './client';

// ── Training ──────────────────────────────────────────────────────────────────

export interface TrainingRequest {
  id: string;
  businessId: string;
  employeeUserId: string;
  requestedByUserId?: string | null;
  title: string;
  trainingType?: string | null;
  provider?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  cost?: number | null;
  status: 'requested' | 'scheduled' | 'completed' | 'cancelled';
  resultData?: Record<string, any>;
  createdAt: string;
  employee?: { id: string; fullName: string; email: string } | null;
  requester?: { id: string; fullName: string } | null;
}

export interface CreateTrainingRequestPayload {
  title: string;
  trainingType?: string;
  provider?: string;
  startDate?: string;
  endDate?: string;
  cost?: number;
  employeeUserId?: string; // defaults to self on backend
}

export interface TrainingListParams {
  page?: number;
  size?: number;
  status?: string;
  employeeUserId?: string;
}

export const trainingApi = {
  list: async (params?: TrainingListParams): Promise<{ rows: TrainingRequest[]; total: number; page: number; totalPages: number }> => {
    const res = await api.get('/api/v1/hr/training', { params });
    return res.data;
  },

  create: async (payload: CreateTrainingRequestPayload): Promise<TrainingRequest> => {
    const res = await api.post('/api/v1/hr/training', payload);
    return res.data.data ?? res.data;
  },

  approve: async (id: string, comment?: string): Promise<TrainingRequest> => {
    const res = await api.post(`/api/v1/hr/training/${id}/approve`, { comment });
    return res.data.data ?? res.data;
  },

  reject: async (id: string, reason?: string): Promise<TrainingRequest> => {
    const res = await api.post(`/api/v1/hr/training/${id}/reject`, { reason });
    return res.data.data ?? res.data;
  },
};

// ── Promotion ─────────────────────────────────────────────────────────────────

export interface PromotionRequest {
  id: string;
  businessId: string;
  employeeUserId: string;
  requestedByUserId?: string | null;
  currentTitle: string;
  targetTitle: string;
  department?: string | null;
  justification: string;
  kpiScore?: number | null;
  yearsInRole?: number | null;
  effectiveDate?: string | null;
  approvalStage: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  deptHeadComment?: string | null;
  adminComment?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  employee?: { id: string; fullName: string; email: string } | null;
}

export interface CreatePromotionPayload {
  currentTitle: string;
  targetTitle: string;
  justification: string;
  department?: string;
  kpiScore?: number;
  yearsInRole?: number;
  effectiveDate?: string;
  employeeUserId?: string; // defaults to self on backend
}

export interface PromotionListParams {
  page?: number;
  size?: number;
  status?: string;
  employeeUserId?: string;
}

export const promotionApi = {
  list: async (params?: PromotionListParams): Promise<{ rows: PromotionRequest[]; total: number; page: number; totalPages: number }> => {
    const res = await api.get('/api/v1/hr/promotions', { params });
    return res.data;
  },

  create: async (payload: CreatePromotionPayload): Promise<PromotionRequest> => {
    const res = await api.post('/api/v1/hr/promotions', payload);
    return res.data.data ?? res.data;
  },

  approve: async (id: string, comment?: string): Promise<PromotionRequest> => {
    const res = await api.post(`/api/v1/hr/promotions/${id}/approve`, { comment });
    return res.data.data ?? res.data;
  },

  reject: async (id: string, reason?: string): Promise<PromotionRequest> => {
    const res = await api.post(`/api/v1/hr/promotions/${id}/reject`, { reason });
    return res.data.data ?? res.data;
  },
};
