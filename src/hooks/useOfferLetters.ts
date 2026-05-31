import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getOfferLetters,
  getOfferLetterTemplates,
  createOfferLetterTemplate,
  updateOfferLetterTemplate,
  deleteOfferLetterTemplate,
  createOfferLetter,
  updateOfferLetter,
  deleteOfferLetter,
  generateOfferLetterPdf,
  sendOfferLetter,
  previewOfferLetter,
} from "../api/offerLetters";

// ─── Offer Letter Templates ───────────────────────────────────────────────────

export function useOfferLetterTemplates() {
  return useQuery({
    queryKey: ["offer-letter-templates"],
    queryFn: async () => {
      const res = await getOfferLetterTemplates();
      return (res.data?.data as any[]) ?? [];
    },
  });
}

export function useCreateOfferLetterTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => createOfferLetterTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offer-letter-templates"] });
    },
  });
}

export function useUpdateOfferLetterTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updateOfferLetterTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offer-letter-templates"] });
    },
  });
}

export function useDeleteOfferLetterTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteOfferLetterTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offer-letter-templates"] });
    },
  });
}

// ─── Offer Letters ────────────────────────────────────────────────────────────

export function useOfferLetters(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ["offer-letters", params?.limit, params?.offset],
    queryFn: async () => {
      const res = await getOfferLetters(params ?? {});
      return (res.data?.data as any[]) ?? [];
    },
  });
}

export function useCreateOfferLetter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => createOfferLetter(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offer-letters"] });
    },
  });
}

export function useUpdateOfferLetter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updateOfferLetter(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offer-letters"] });
    },
  });
}

export function useDeleteOfferLetter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteOfferLetter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offer-letters"] });
    },
  });
}

export function useGenerateOfferLetterPdf() {
  return useMutation({
    mutationFn: (id: string) => generateOfferLetterPdf(id),
  });
}

export function useSendOfferLetter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      sendOfferLetter(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offer-letters"] });
    },
  });
}

export function usePreviewOfferLetter() {
  return useMutation({
    mutationFn: ({ templateId, data }: { templateId: string; data: any }) =>
      previewOfferLetter(templateId, data),
  });
}
