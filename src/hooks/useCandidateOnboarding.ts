import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listOnboardings,
  listAvailableOnboardingPolicies,
  getOnboardingById,
  getOnboardingByOfferId,
  getPublicOnboarding,
  initializeOnboarding,
  saveOnboardingSection,
  respondToOnboardingResources,
  submitOnboarding,
} from '../api/candidateOnboarding';

// ─── Admin hooks ──────────────────────────────────────────────────────────────

export function useOnboardings(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['onboardings', params],
    queryFn: async () => {
      const res = await listOnboardings(params);
      // res.data = { success, message, data: { rows, count } }
      return res.data?.data ?? res.data;
    },
  });
}

export function useAvailableOnboardingPolicies() {
  return useQuery({
    queryKey: ['onboarding-available-policies'],
    queryFn: async () => {
      const res = await listAvailableOnboardingPolicies();
      return res.data?.data ?? res.data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useOnboardingById(id: string | null) {
  return useQuery({
    queryKey: ['onboarding', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const res = await getOnboardingById(id!);
      return res.data?.data ?? res.data;
    },
  });
}

export function useOnboardingByOfferId(offerId: string | null) {
  return useQuery({
    queryKey: ['onboarding-by-offer', offerId],
    enabled: Boolean(offerId),
    queryFn: async () => {
      const res = await getOnboardingByOfferId(offerId!);
      return res.data?.data ?? null; // null if not initialized yet
    },
    retry: false,
  });
}

export function useInitializeOnboarding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
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
    }) => {
      const res = await initializeOnboarding(data);
      // res.data = { success, message, data: { onboarding, onboardingUrl } }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboardings'] });
      queryClient.invalidateQueries({ queryKey: ['offer-letters'] });
    },
  });
}

// ─── Public (candidate-facing) hooks ─────────────────────────────────────────

export function usePublicOnboarding(onboardingId: string | null) {
  return useQuery({
    queryKey: ['public-onboarding', onboardingId],
    enabled: Boolean(onboardingId),
    queryFn: async () => {
      const res = await getPublicOnboarding(onboardingId!);
      // res.data = { success, data: <onboarding record> }
      return res.data?.data ?? res.data;
    },
    retry: false,
  });
}

export function useSaveOnboardingSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      onboardingId,
      section,
      data,
    }: {
      onboardingId: string;
      section: string;
      data: any;
    }) => {
      const res = await saveOnboardingSection(onboardingId, { section, data });
      return res.data?.data ?? res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['public-onboarding', variables.onboardingId] });
    },
  });
}

export function useRespondToResources() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      onboardingId,
      responses,
    }: {
      onboardingId: string;
      responses: { resourceIndex: number; status: string; comment?: string }[];
    }) => {
      const res = await respondToOnboardingResources(onboardingId, responses);
      return res.data?.data ?? res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['public-onboarding', variables.onboardingId] });
    },
  });
}

export function useSubmitOnboarding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ onboardingId, password }: { onboardingId: string; password: string }) => {
      const res = await submitOnboarding(onboardingId, password);
      return res.data?.data ?? res.data;
    },
    onSuccess: (_data, { onboardingId }) => {
      queryClient.invalidateQueries({ queryKey: ['public-onboarding', onboardingId] });
    },
  });
}
