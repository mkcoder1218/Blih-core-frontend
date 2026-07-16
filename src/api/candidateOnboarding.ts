import { api } from './client';

// ─── Admin (authenticated) ────────────────────────────────────────────────────

export const initializeOnboarding = (data: {
  offerId: string;
  sections?: string[];
  resources?: any[];
  requiredDocuments?: { name: string; required: boolean }[];
  requiredPolicies?: { policyId?: string; title: string; content?: string; required: boolean }[];
  inventoryItemIds?: string[];
  assignedEmail?: string;
  expiresAt?: string;
  deadlineDays?: number;
  policyTypes?: string[];
}) => api.post('/api/v1/hr/onboarding/initialize', data);

export const listOnboardings = (params?: { limit?: number; offset?: number }) =>
  api.get('/api/v1/hr/onboarding', { params });

export interface OnboardingAnalyticsParams {
  dateFrom?: string;
  dateTo?: string;
  departmentId?: string;
  managerId?: string;
  status?: string;
  search?: string;
  interval?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  attentionPage?: number;
  activePage?: number;
  pageSize?: number;
}

export const getOnboardingAnalytics = (params?: OnboardingAnalyticsParams) =>
  api.get('/api/v1/hr/onboarding/analytics', { params });

export const listAvailableOnboardingPolicies = () =>
  api.get('/api/v1/hr/onboarding/available-policies');

export const getOnboardingById = (id: string) =>
  api.get(`/api/v1/hr/onboarding/${id}`);

export const getOnboardingByOfferId = (offerId: string) =>
  api.get(`/api/v1/hr/onboarding/by-offer/${offerId}`);

// ─── Public (no auth needed — candidate-facing) ───────────────────────────────

export const getPublicOnboarding = (onboardingId: string) =>
  api.get(`/api/v1/hr/public/onboarding/${onboardingId}`);

export const getPublicOnboardingPolicy = (onboardingId: string, policyType: string) =>
  api.get(`/api/v1/hr/public/onboarding/${onboardingId}/policies/${encodeURIComponent(policyType)}`);

export const saveOnboardingSection = (
  onboardingId: string,
  data: { section: string; data: any }
) => api.patch(`/api/v1/hr/public/onboarding/${onboardingId}/section`, data);

export const respondToOnboardingResources = (
  onboardingId: string,
  responses: { resourceIndex: number; status: string; comment?: string }[]
) => api.patch(`/api/v1/hr/public/onboarding/${onboardingId}/resources`, { responses });

export const submitOnboarding = (onboardingId: string, password: string) =>
  api.post(`/api/v1/hr/public/onboarding/${onboardingId}/submit`, { password });

export const uploadOnboardingDocument = (onboardingId: string, file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post(`/api/v1/hr/public/onboarding/${onboardingId}/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
