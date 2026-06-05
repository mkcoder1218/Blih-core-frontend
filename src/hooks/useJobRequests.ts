import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { JobRequest } from "../types";

type JobRequestsResponse = {
  rows: JobRequest[];
  count: number;
  page: number;
  size: number;
};

export function useJobRequests(params?: {
  status?: "pending" | "approved" | "declined";
  approvedByMe?: boolean;
  approvedByOthers?: boolean;
  includePublished?: boolean;
}) {
  return useQuery({
    queryKey: [
      "job-requests",
      params?.status ?? "",
      params?.approvedByMe ?? false,
      params?.approvedByOthers ?? false,
      params?.includePublished ?? false,
    ],
    queryFn: async () => {
      const res = await api.get("/api/v1/hr/recruitment/job-requests", {
        params,
      });
      const payload: any = res.data;
      const rows: JobRequest[] = payload?.data ?? payload?.rows ?? [];
      const count: number =
        payload?.meta?.total ?? payload?.count ?? rows.length;
      const page: number = payload?.meta?.page ?? payload?.page ?? 1;
      const size: number = payload?.meta?.limit ?? payload?.size ?? rows.length;
      return { rows, count, page, size } as JobRequestsResponse;
    },
  });
}

export function useApproveJobRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(
        `/api/v1/hr/recruitment/job-requests/${id}/approve`,
      );
      return res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["job-requests"] });
    },
  });
}

export function usePublishJobRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(
        `/api/v1/hr/recruitment/job-requests/${id}/publish`,
      );
      return res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["job-requests"] });
    },
  });
}

export function useCloseJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/api/v1/hr/recruitment/job-requests/${id}/close`);
      return res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["job-requests"] });
    },
  });
}

export function useDeclineJobRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { id: string; reason?: string }) => {
      const res = await api.post(
        `/api/v1/hr/recruitment/job-requests/${vars.id}/decline`,
        { reason: vars.reason },
      );
      return res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["job-requests"] });
    },
  });
}

export function usePublicJobs(businessSlug?: string) {
  return useQuery({
    queryKey: ['public-jobs', businessSlug],
    queryFn: async () => {
      if (!businessSlug) return { business: null, jobs: [] };
      const res = await api.get(`/api/v1/hr/public/jobs/${businessSlug}`);
      return res.data?.data ?? res.data;
    },
    enabled: !!businessSlug,
  });
}

export function usePublicJob(businessSlug: string, id: string) {
  return useQuery({
    queryKey: ["public-job", businessSlug, id],
    queryFn: async () => {
      const res = await api.get(`/api/v1/hr/public/jobs/${businessSlug}/${id}`);
      return res.data.data as JobRequest;
    },
    enabled: !!businessSlug && !!id,
  });
}

export function useApplyJob() {
  return useMutation({
    mutationFn: async (vars: { jobId: string; data: any }) => {
      const res = await api.post(
        `/api/v1/hr/public/job-openings/${vars.jobId}/apply`,
        vars.data,
      );
      return res.data;
    },
  });
}

export function useUploadResume() {
  return useMutation({
    mutationFn: async (vars: { jobId: string; file: File }) => {
      const formData = new FormData();
      formData.append("file", vars.file);
      const res = await api.post(
        `/api/v1/hr/public/job-openings/${vars.jobId}/upload-resume`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      return res.data.data; // { fileId, downloadUrl, originalName }
    },
  });
}

export function useJobApplications() {
  return useQuery({
    queryKey: ["job-applications"],
    queryFn: async () => {
      const res = await api.get("/api/v1/hr/recruitment/job-applications");
      return res.data.data as any[];
    },
  });
}

export function useIncrementView() {
  return useMutation({
    mutationFn: async (vars: { businessSlug: string; id: string }) => {
      const res = await api.post(`/api/v1/hr/public/jobs/${vars.businessSlug}/${vars.id}/view`);
      return res.data;
    },
  });
}

export function useScheduleInterview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post(
        "/api/v1/hr/recruitment/interviews/schedule",
        data,
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-applications"] });
      queryClient.invalidateQueries({ queryKey: ["job-requests"] });
    },
  });
}

export function useAdvanceCandidate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { id: string; stage: string }) => {
      const res = await api.patch(
        `/api/v1/hr/recruitment/applications/${vars.id}/stage`,
        { stage: vars.stage },
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-applications"] });
    },
  });
}

// ─── Interviews ───────────────────────────────────────────────────────────────

export function useInterviews() {
  return useQuery({
    queryKey: ["interviews"],
    queryFn: async () => {
      const res = await api.get("/api/v1/hr/recruitment/interviews");
      return res.data.data as any[];
    },
  });
}

export function useInterview(id: string) {
  return useQuery({
    queryKey: ["interview", id],
    queryFn: async () => {
      const res = await api.get(`/api/v1/hr/recruitment/interviews/${id}`);
      return res.data.data as any;
    },
    enabled: !!id,
  });
}

export function useUpdateInterview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { id: string; data: any }) => {
      const res = await api.patch(`/api/v1/hr/recruitment/interviews/${vars.id}`, vars.data);
      return res.data.data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["interviews"] });
      queryClient.invalidateQueries({ queryKey: ["interview", vars.id] });
    },
  });
}

export function useCompleteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { id: string; feedback?: any; score?: number; skillRatings?: any[] }) => {
      const res = await api.post(`/api/v1/hr/recruitment/interviews/${vars.id}/complete-session`, vars);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interviews"] });
      queryClient.invalidateQueries({ queryKey: ["job-applications"] });
    },
  });
}

export function useCancelInterview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/api/v1/hr/recruitment/interviews/${id}/cancel`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interviews"] });
    },
  });
}

// ─── Skills ───────────────────────────────────────────────────────────────────

export function useSkills() {
  return useQuery({
    queryKey: ["skills"],
    queryFn: async () => {
      const res = await api.get("/api/v1/hr/recruitment/skills");
      return res.data.data as any[];
    },
  });
}

export function useCreateSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; category?: string }) => {
      const res = await api.post("/api/v1/hr/recruitment/skills", data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills"] });
    },
  });
}

export function useDeleteSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/api/v1/hr/recruitment/skills/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills"] });
    },
  });
}

// ─── Per-interviewer notes ────────────────────────────────────────────────────

export function useMyInterviewNotes(interviewId: string) {
  return useQuery({
    queryKey: ["interview-my-notes", interviewId],
    queryFn: async () => {
      const res = await api.get(`/api/v1/hr/recruitment/interviews/${interviewId}/my-notes`);
      return res.data.data as { note: any; interviewSkills: any[] };
    },
    enabled: !!interviewId,
  });
}

export function useSaveMyNotes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      interviewId: string;
      questions?: any[];
      notes?: string;
      skillRatings?: { skillId: string; actualRating: number | null }[];
      candidateScore?: number | null;
    }) => {
      const { interviewId, ...data } = vars;
      const res = await api.put(`/api/v1/hr/recruitment/interviews/${interviewId}/my-notes`, data);
      return res.data.data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["interview-my-notes", vars.interviewId] });
    },
  });
}
