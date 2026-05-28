import { api } from './client';
import { ApiEnvelope } from './types';

// Templates
export const getOfferLetterTemplates = () => api.get<ApiEnvelope<any>>('/api/v1/offer-letters/templates');
export const createOfferLetterTemplate = (data: any) => api.post<ApiEnvelope<any>>('/api/v1/offer-letters/templates', data);
export const updateOfferLetterTemplate = (id: string, data: any) => api.patch<ApiEnvelope<any>>(`/api/v1/offer-letters/templates/${id}`, data);
export const deleteOfferLetterTemplate = (id: string) => api.delete<ApiEnvelope<any>>(`/api/v1/offer-letters/templates/${id}`);

// Offer Letters
export const getOfferLetters = (params: { limit?: number; offset?: number }) => api.get<ApiEnvelope<any>>('/api/v1/offer-letters', { params });
export const getOfferLetter = (id: string) => api.get<ApiEnvelope<any>>(`/api/v1/offer-letters/${id}`);
export const previewOfferLetter = (templateId: string, data: any) => api.post<ApiEnvelope<any>>('/api/v1/offer-letters/preview', { templateId, data });
export const createOfferLetter = (data: any) => api.post<ApiEnvelope<any>>('/api/v1/offer-letters', data);
export const updateOfferLetter = (id: string, data: any) => api.patch<ApiEnvelope<any>>(`/api/v1/offer-letters/${id}`, data);
export const deleteOfferLetter = (id: string) => api.delete<ApiEnvelope<any>>(`/api/v1/offer-letters/${id}`);
export const generateOfferLetterPdf = (id: string) => api.post<ApiEnvelope<any>>(`/api/v1/offer-letters/${id}/generate-pdf`);
export const sendOfferLetter = (id: string, data: any) => api.post<ApiEnvelope<any>>(`/api/v1/offer-letters/${id}/send`, { data });
