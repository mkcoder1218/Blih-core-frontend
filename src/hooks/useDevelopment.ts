/**
 * useDevelopment — React Query hooks for Training & Promotion requests.
 * Follows the same pattern as useLeave.ts.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  trainingApi,
  promotionApi,
  type TrainingRequest,
  type PromotionRequest,
  type CreateTrainingRequestPayload,
  type CreatePromotionPayload,
  type TrainingListParams,
  type PromotionListParams,
} from '../api/development';

// ── Training Queries ──────────────────────────────────────────────────────────

export function useTrainingRequests(params?: TrainingListParams) {
  return useQuery({
    queryKey: ['training-requests', params],
    queryFn: () => trainingApi.list(params),
    staleTime: 30_000,
  });
}

export function useMyTrainingRequests() {
  return useTrainingRequests({ size: 50 }); // backend scopes to self if career.self only
}

export function useSubmitTrainingRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTrainingRequestPayload) => trainingApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['training-requests'] }),
  });
}

export function useApproveTrainingRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) => trainingApi.approve(id, comment),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['training-requests'] }),
  });
}

export function useRejectTrainingRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => trainingApi.reject(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['training-requests'] }),
  });
}

// ── Promotion Queries ─────────────────────────────────────────────────────────

export function usePromotionRequests(params?: PromotionListParams) {
  return useQuery({
    queryKey: ['promotion-requests', params],
    queryFn: () => promotionApi.list(params),
    staleTime: 30_000,
  });
}

export function useMyPromotionRequests() {
  return usePromotionRequests({ size: 50 });
}

export function useSubmitPromotionRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePromotionPayload) => promotionApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promotion-requests'] }),
  });
}

export function useApprovePromotionRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) => promotionApi.approve(id, comment),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promotion-requests'] }),
  });
}

export function useRejectPromotionRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => promotionApi.reject(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promotion-requests'] }),
  });
}
