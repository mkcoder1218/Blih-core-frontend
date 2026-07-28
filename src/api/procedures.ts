import { api } from "./client";
import { KnowledgeCategory } from "./brain";

export interface ProcedureStep {
  instruction: string;
  expectedResult?: string | null;
}

export interface Procedure {
  id: string;
  businessId: string;
  categoryId?: string | null;
  authorUserId: string;
  ownerUserId: string;
  responsibleDepartmentId?: string | null;
  title: string;
  slug: string;
  purpose?: string | null;
  scope?: string | null;
  responsibilities?: string | null;
  prerequisites?: string | null;
  instructions?: string | null; // Backwards compatibility for rich-text instruction editor
  expectedResult?: string | null;
  steps?: ProcedureStep[];
  visibility: "company" | "department" | "private";
  status: "draft" | "in_review" | "changes_requested" | "approved" | "published" | "archived";
  version: number;
  effectiveDate?: string | null;
  reviewDueDate?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  category?: KnowledgeCategory | null;
  author?: {
    id: string;
    fullName?: string;
    email?: string;
  } | null;
  owner?: {
    id: string;
    fullName?: string;
    email?: string;
  } | null;
  responsibleDepartment?: {
    id: string;
    name?: string;
  } | null;
}

export interface ProcedureListParams {
  page?: number;
  size?: number;
  search?: string;
  categoryId?: string;
  status?: "draft" | "in_review" | "changes_requested" | "approved" | "published" | "archived";
  visibility?: "company" | "department" | "private";
  ownerUserId?: string;
  responsibleDepartmentId?: string;
  mine?: boolean;
  includeArchived?: boolean;
  sortBy?: "title" | "createdAt" | "updatedAt" | "version";
  sortDirection?: "ASC" | "DESC" | "asc" | "desc";
}

export interface ProcedureListResponse {
  rows: Procedure[];
  count: number;
  page: number;
  size: number;
  pages: number;
}

export interface CreateProcedureInput {
  title: string;
  categoryId?: string | null;
  ownerUserId: string;
  responsibleDepartmentId?: string | null;
  visibility?: "company" | "department" | "private";
  purpose?: string | null;
  scope?: string | null;
  responsibilities?: string | null;
  prerequisites?: string | null;
  expectedResult?: string | null;
  steps?: ProcedureStep[];
  effectiveDate?: string | null;
  reviewDueDate?: string | null;
  metadata?: any;
}

export interface UpdateProcedureInput {
  title?: string;
  categoryId?: string | null;
  ownerUserId?: string;
  responsibleDepartmentId?: string | null;
  visibility?: "company" | "department" | "private";
  purpose?: string | null;
  scope?: string | null;
  responsibilities?: string | null;
  prerequisites?: string | null;
  expectedResult?: string | null;
  steps?: ProcedureStep[];
  effectiveDate?: string | null;
  reviewDueDate?: string | null;
  metadata?: any;
  changeSummary?: string | null;
}

export interface ProcedureRevision {
  id: string;
  businessId: string;
  procedureId: string;
  revisedByUserId: string;
  version: number;
  changeSummary?: string | null;
  contentSnapshot?: any;
  createdAt: string;
  revisedBy?: {
    id: string;
    fullName?: string;
    email?: string;
  } | null;
}

export interface ProcedureRevisionListResponse {
  rows: ProcedureRevision[];
  count: number;
  page: number;
  size: number;
  pages: number;
}

export const proceduresApi = {
  list: async (params?: ProcedureListParams): Promise<ProcedureListResponse> => {
    const res = await api.get<ProcedureListResponse>("/api/procedures", {
      params,
    });
    return res.data;
  },

  get: async (id: string): Promise<Procedure> => {
    const res = await api.get<{ procedure: Procedure }>(`/api/procedures/${id}`);
    return res.data.procedure;
  },

  create: async (input: CreateProcedureInput): Promise<Procedure> => {
    const res = await api.post<{ procedure: Procedure }>("/api/procedures", input);
    return res.data.procedure;
  },

  update: async (id: string, input: UpdateProcedureInput): Promise<Procedure> => {
    const res = await api.patch<{ procedure: Procedure }>(`/api/procedures/${id}`, input);
    return res.data.procedure;
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete<{ success: boolean; message: string }>(`/api/procedures/${id}`);
    return res.data;
  },

  restore: async (id: string): Promise<Procedure> => {
    const res = await api.patch<{ procedure: Procedure }>(`/api/procedures/${id}/restore`);
    return res.data.procedure;
  },

  submitReview: async (id: string): Promise<Procedure> => {
    const res = await api.post<{ procedure: Procedure }>(`/api/procedures/${id}/submit-review`);
    return res.data.procedure;
  },

  approve: async (id: string): Promise<Procedure> => {
    const res = await api.post<{ procedure: Procedure }>(`/api/procedures/${id}/approve`);
    return res.data.procedure;
  },

  requestChanges: async (id: string, comment: string): Promise<Procedure> => {
    const res = await api.post<{ procedure: Procedure }>(`/api/procedures/${id}/request-changes`, {
      comment,
    });
    return res.data.procedure;
  },

  publish: async (id: string): Promise<Procedure> => {
    const res = await api.post<{ procedure: Procedure }>(`/api/procedures/${id}/publish`);
    return res.data.procedure;
  },

  unpublish: async (id: string): Promise<Procedure> => {
    const res = await api.post<{ procedure: Procedure }>(`/api/procedures/${id}/unpublish`);
    return res.data.procedure;
  },

  archive: async (id: string): Promise<Procedure> => {
    const res = await api.post<{ procedure: Procedure }>(`/api/procedures/${id}/archive`);
    return res.data.procedure;
  },

  listRevisions: async (
    id: string,
    params?: { page?: number; size?: number }
  ): Promise<ProcedureRevisionListResponse> => {
    const res = await api.get<ProcedureRevisionListResponse>(`/api/procedures/${id}/revisions`, {
      params,
    });
    return res.data;
  },

  getRevision: async (id: string, revisionId: string): Promise<ProcedureRevision> => {
    const res = await api.get<{ revision: ProcedureRevision }>(
      `/api/procedures/${id}/revisions/${revisionId}`
    );
    return res.data.revision;
  },

  restoreRevision: async (id: string, revisionId: string): Promise<Procedure> => {
    const res = await api.post<{ procedure: Procedure }>(
      `/api/procedures/${id}/revisions/${revisionId}/restore`
    );
    return res.data.procedure;
  },
};
