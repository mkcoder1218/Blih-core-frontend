import { api } from './client';

// ─── Admin (authenticated) ────────────────────────────────────────────────────

export const initializeOnboarding = (data: {
  offerId: string;
  sections?: string[];
  resources?: any[];
  requiredDocuments?: { name: string; required: boolean }[];
  requiredPolicies?: { title: string; content: string; required: boolean }[];
}) => api.post('/api/v1/hr/onboarding/initialize', data);

export const listOnboardings = (params?: { limit?: number; offset?: number }) =>
  api.get('/api/v1/hr/onboarding', { params });

export const getOnboardingById = (id: string) =>
  api.get(`/api/v1/hr/onboarding/${id}`);

export const getOnboardingByOfferId = (offerId: string) =>
  api.get(`/api/v1/hr/onboarding/by-offer/${offerId}`);

// ─── Public (no auth needed — candidate-facing) ───────────────────────────────

export const getPublicOnboarding = (onboardingId: string) =>
  api.get(`/api/v1/hr/public/onboarding/${onboardingId}`);

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
