import { api } from "./client";

export interface KnowledgeCategory {
  id: string;
  businessId: string;
  parentCategoryId?: string | null;
  name: string;
  key: string;
  description?: string | null;
  visibility: "company" | "department" | "private";
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  parentCategory?: KnowledgeCategory | null;
  subcategories?: KnowledgeCategory[];
}

export interface KnowledgeCategoryListParams {
  page?: number;
  size?: number;
  search?: string;
  status?: "active" | "archived";
  visibility?: "company" | "department" | "private";
  parentCategoryId?: string | null;
  includeArchived?: boolean;
}

export interface KnowledgeCategoryListResponse {
  rows: KnowledgeCategory[];
  count: number;
  page: number;
  size: number;
  pages: number;
}

export interface CreateKnowledgeCategoryInput {
  name: string;
  key?: string;
  description?: string | null;
  parentCategoryId?: string | null;
  visibility?: "company" | "department" | "private";
  status?: "active" | "archived";
}

export interface UpdateKnowledgeCategoryInput {
  name?: string;
  key?: string;
  description?: string | null;
  parentCategoryId?: string | null;
  visibility?: "company" | "department" | "private";
  status?: "active" | "archived";
}

export interface KnowledgeArticle {
  id: string;
  businessId: string;
  categoryId?: string | null;
  authorUserId: string;
  title: string;
  slug: string;
  summary?: string | null;
  content?: string | null;
  contentText?: string | null;
  visibility: "company" | "department" | "private";
  status: "draft" | "in_review" | "changes_requested" | "approved" | "published" | "archived";
  version: number;
  submittedAt?: string | null;
  submittedByUserId?: string | null;
  reviewedAt?: string | null;
  reviewedByUserId?: string | null;
  publishedAt?: string | null;
  publishedByUserId?: string | null;
  archivedAt?: string | null;
  archivedByUserId?: string | null;
  metadata?: {
    departmentIds?: string[];
    reviewComment?: string;
    restoredFromRevisionId?: string;
    restoredFromVersion?: number;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  category?: KnowledgeCategory | null;
  author?: {
    id: string;
    fullName?: string;
    email?: string;
  } | null;
}

export interface KnowledgeArticleListParams {
  page?: number;
  size?: number;
  search?: string;
  categoryId?: string;
  status?: "draft" | "in_review" | "changes_requested" | "approved" | "published" | "archived";
  visibility?: "company" | "department" | "private";
  authorUserId?: string;
  mine?: boolean;
  includeArchived?: boolean;
  sortBy?: "title" | "createdAt" | "updatedAt" | "publishedAt" | "version";
  sortDirection?: "ASC" | "DESC" | "asc" | "desc";
}

export interface KnowledgeArticleListResponse {
  rows: KnowledgeArticle[];
  count: number;
  page: number;
  size: number;
  pages: number;
}

export interface CreateKnowledgeArticleInput {
  title: string;
  summary?: string | null;
  content?: string | null;
  categoryId?: string | null;
  visibility?: "company" | "department" | "private";
  metadata?: {
    departmentIds?: string[];
    [key: string]: any;
  };
}

export interface UpdateKnowledgeArticleInput {
  title?: string;
  summary?: string | null;
  content?: string | null;
  categoryId?: string | null;
  visibility?: "company" | "department" | "private";
  metadata?: {
    departmentIds?: string[];
    [key: string]: any;
  };
  changeSummary?: string | null;
}

export interface KnowledgeRevision {
  id: string;
  businessId: string;
  articleId: string;
  revisedByUserId: string;
  version: number;
  changeSummary?: string | null;
  contentSnapshot?: {
    action?: string;
    title?: string;
    slug?: string;
    summary?: string;
    content?: string;
    contentText?: string;
    categoryId?: string;
    visibility?: "company" | "department" | "private";
    status?: string;
    reviewComment?: string;
    metadata?: any;
    version?: number;
    actorUserId?: string;
    oldPublishedAt?: string;
    oldPublishedByUserId?: string;
    restoredFromRevisionId?: string;
    restoredFromVersion?: number;
    [key: string]: any;
  };
  createdAt: string;
  revisedBy?: {
    id: string;
    fullName?: string;
    email?: string;
  } | null;
}

export interface KnowledgeRevisionListResponse {
  rows: KnowledgeRevision[];
  count: number;
  page: number;
  size: number;
  pages: number;
}

export const brainCategoriesApi = {
  list: async (params?: KnowledgeCategoryListParams): Promise<KnowledgeCategoryListResponse> => {
    const res = await api.get<KnowledgeCategoryListResponse>("/api/v1/brain/categories", {
      params,
    });
    return res.data;
  },

  get: async (id: string): Promise<KnowledgeCategory> => {
    const res = await api.get<{ category: KnowledgeCategory }>(`/api/v1/brain/categories/${id}`);
    return res.data.category;
  },

  create: async (input: CreateKnowledgeCategoryInput): Promise<KnowledgeCategory> => {
    const res = await api.post<{ category: KnowledgeCategory }>("/api/v1/brain/categories", input);
    return res.data.category;
  },

  update: async (id: string, input: UpdateKnowledgeCategoryInput): Promise<KnowledgeCategory> => {
    const res = await api.patch<{ category: KnowledgeCategory }>(`/api/v1/brain/categories/${id}`, input);
    return res.data.category;
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete<{ success: boolean; message: string }>(`/api/v1/brain/categories/${id}`);
    return res.data;
  },

  restore: async (id: string): Promise<KnowledgeCategory> => {
    const res = await api.patch<{ category: KnowledgeCategory }>(`/api/v1/brain/categories/${id}/restore`);
    return res.data.category;
  },
};

export const brainArticlesApi = {
  list: async (params?: KnowledgeArticleListParams): Promise<KnowledgeArticleListResponse> => {
    const res = await api.get<KnowledgeArticleListResponse>("/api/v1/brain/articles", {
      params,
    });
    return res.data;
  },

  get: async (id: string): Promise<KnowledgeArticle> => {
    const res = await api.get<{ article: KnowledgeArticle }>(`/api/v1/brain/articles/${id}`);
    return res.data.article;
  },

  create: async (input: CreateKnowledgeArticleInput): Promise<KnowledgeArticle> => {
    const res = await api.post<{ article: KnowledgeArticle }>("/api/v1/brain/articles", input);
    return res.data.article;
  },

  update: async (id: string, input: UpdateKnowledgeArticleInput): Promise<KnowledgeArticle> => {
    const res = await api.patch<{ article: KnowledgeArticle }>(`/api/v1/brain/articles/${id}`, input);
    return res.data.article;
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete<{ success: boolean; message: string }>(`/api/v1/brain/articles/${id}`);
    return res.data;
  },

  restore: async (id: string): Promise<KnowledgeArticle> => {
    const res = await api.patch<{ article: KnowledgeArticle }>(`/api/v1/brain/articles/${id}/restore`);
    return res.data.article;
  },

  // ── Article Workflow Actions ──

  submitReview: async (id: string): Promise<KnowledgeArticle> => {
    const res = await api.post<{ article: KnowledgeArticle }>(`/api/v1/brain/articles/${id}/submit-review`);
    return res.data.article;
  },

  approve: async (id: string): Promise<KnowledgeArticle> => {
    const res = await api.post<{ article: KnowledgeArticle }>(`/api/v1/brain/articles/${id}/approve`);
    return res.data.article;
  },

  requestChanges: async (id: string, comment: string): Promise<KnowledgeArticle> => {
    const res = await api.post<{ article: KnowledgeArticle }>(`/api/v1/brain/articles/${id}/request-changes`, {
      comment,
    });
    return res.data.article;
  },

  publish: async (id: string): Promise<KnowledgeArticle> => {
    const res = await api.post<{ article: KnowledgeArticle }>(`/api/v1/brain/articles/${id}/publish`);
    return res.data.article;
  },

  unpublish: async (id: string): Promise<KnowledgeArticle> => {
    const res = await api.post<{ article: KnowledgeArticle }>(`/api/v1/brain/articles/${id}/unpublish`);
    return res.data.article;
  },

  archive: async (id: string): Promise<KnowledgeArticle> => {
    const res = await api.post<{ article: KnowledgeArticle }>(`/api/v1/brain/articles/${id}/archive`);
    return res.data.article;
  },

  // ── Revisions ──

  listRevisions: async (
    id: string,
    params?: { page?: number; size?: number }
  ): Promise<KnowledgeRevisionListResponse> => {
    const res = await api.get<KnowledgeRevisionListResponse>(`/api/v1/brain/articles/${id}/revisions`, {
      params,
    });
    return res.data;
  },

  getRevision: async (id: string, revisionId: string): Promise<KnowledgeRevision> => {
    const res = await api.get<{ revision: KnowledgeRevision }>(
      `/api/v1/brain/articles/${id}/revisions/${revisionId}`
    );
    return res.data.revision;
  },

  restoreRevision: async (id: string, revisionId: string): Promise<KnowledgeArticle> => {
    const res = await api.post<{ article: KnowledgeArticle }>(
      `/api/v1/brain/articles/${id}/revisions/${revisionId}/restore`
    );
    return res.data.article;
  },
};
