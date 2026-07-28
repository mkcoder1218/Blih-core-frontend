import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  brainCategoriesApi,
  brainArticlesApi,
  CreateKnowledgeCategoryInput,
  KnowledgeCategoryListParams,
  UpdateKnowledgeCategoryInput,
  CreateKnowledgeArticleInput,
  KnowledgeArticleListParams,
  UpdateKnowledgeArticleInput,
} from "../api/brain";

// ── Categories Hooks ──

export function useBrainCategories(params?: KnowledgeCategoryListParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["brain", "categories", params],
    queryFn: () => brainCategoriesApi.list(params),
    enabled: options?.enabled ?? true,
  });
}

export function useBrainCategory(id: string | null | undefined) {
  return useQuery({
    queryKey: ["brain", "category", id],
    queryFn: () => brainCategoriesApi.get(id!),
    enabled: Boolean(id),
  });
}

export function useCreateBrainCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateKnowledgeCategoryInput) => brainCategoriesApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brain", "categories"] });
    },
  });
}

export function useUpdateBrainCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateKnowledgeCategoryInput }) =>
      brainCategoriesApi.update(id, input),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["brain", "categories"] });
      queryClient.invalidateQueries({ queryKey: ["brain", "category", variables.id] });
    },
  });
}

export function useDeleteBrainCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => brainCategoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brain", "categories"] });
    },
  });
}

export function useRestoreBrainCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => brainCategoriesApi.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brain", "categories"] });
    },
  });
}

// ── Articles Hooks ──

export function useBrainArticles(params?: KnowledgeArticleListParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["brain", "articles", params],
    queryFn: () => brainArticlesApi.list(params),
    enabled: options?.enabled ?? true,
  });
}

export function useBrainArticle(id: string | null | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["brain", "article", id],
    queryFn: () => brainArticlesApi.get(id!),
    enabled: Boolean(id) && (options?.enabled ?? true),
  });
}

export function useCreateBrainArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateKnowledgeArticleInput) => brainArticlesApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brain", "articles"] });
    },
  });
}

export function useUpdateBrainArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateKnowledgeArticleInput }) =>
      brainArticlesApi.update(id, input),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["brain", "articles"] });
      queryClient.invalidateQueries({ queryKey: ["brain", "article", variables.id] });
    },
  });
}

export function useDeleteBrainArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => brainArticlesApi.delete(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ["brain", "articles"] });
      queryClient.invalidateQueries({ queryKey: ["brain", "article", id] });
    },
  });
}

export function useRestoreBrainArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => brainArticlesApi.restore(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ["brain", "articles"] });
      queryClient.invalidateQueries({ queryKey: ["brain", "article", id] });
    },
  });
}

// ── Article Workflow Action Hooks ──

export function useSubmitBrainArticleReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => brainArticlesApi.submitReview(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ["brain", "articles"] });
      queryClient.invalidateQueries({ queryKey: ["brain", "article", id] });
      queryClient.invalidateQueries({ queryKey: ["brain", "article", id, "revisions"] });
    },
  });
}

export function useApproveBrainArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => brainArticlesApi.approve(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ["brain", "articles"] });
      queryClient.invalidateQueries({ queryKey: ["brain", "article", id] });
      queryClient.invalidateQueries({ queryKey: ["brain", "article", id, "revisions"] });
    },
  });
}

export function useRequestBrainArticleChanges() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment: string }) =>
      brainArticlesApi.requestChanges(id, comment),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["brain", "articles"] });
      queryClient.invalidateQueries({ queryKey: ["brain", "article", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["brain", "article", variables.id, "revisions"] });
    },
  });
}

export function usePublishBrainArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => brainArticlesApi.publish(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ["brain", "articles"] });
      queryClient.invalidateQueries({ queryKey: ["brain", "article", id] });
      queryClient.invalidateQueries({ queryKey: ["brain", "article", id, "revisions"] });
    },
  });
}

export function useUnpublishBrainArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => brainArticlesApi.unpublish(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ["brain", "articles"] });
      queryClient.invalidateQueries({ queryKey: ["brain", "article", id] });
      queryClient.invalidateQueries({ queryKey: ["brain", "article", id, "revisions"] });
    },
  });
}

export function useArchiveBrainArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => brainArticlesApi.archive(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ["brain", "articles"] });
      queryClient.invalidateQueries({ queryKey: ["brain", "article", id] });
      queryClient.invalidateQueries({ queryKey: ["brain", "article", id, "revisions"] });
    },
  });
}

// ── Revisions Hooks ──

export function useBrainRevisions(
  articleId: string | null | undefined,
  params?: { page?: number; size?: number },
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ["brain", "article", articleId, "revisions", params],
    queryFn: () => brainArticlesApi.listRevisions(articleId!, params),
    enabled: Boolean(articleId) && (options?.enabled ?? true),
  });
}

export function useBrainRevision(
  articleId: string | null | undefined,
  revisionId: string | null | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ["brain", "article", articleId, "revision", revisionId],
    queryFn: () => brainArticlesApi.getRevision(articleId!, revisionId!),
    enabled: Boolean(articleId) && Boolean(revisionId) && (options?.enabled ?? true),
  });
}

export function useRestoreBrainRevision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ articleId, revisionId }: { articleId: string; revisionId: string }) =>
      brainArticlesApi.restoreRevision(articleId, revisionId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["brain", "articles"] });
      queryClient.invalidateQueries({ queryKey: ["brain", "article", variables.articleId] });
      queryClient.invalidateQueries({ queryKey: ["brain", "article", variables.articleId, "revisions"] });
    },
  });
}
