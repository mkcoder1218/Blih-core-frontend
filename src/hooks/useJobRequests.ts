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

export function usePublicJobs() {
  return useQuery({
    queryKey: ["public-jobs"],
    queryFn: async () => {
      const res = await api.get("/api/v1/hr/public/jobs");
      return res.data.data as JobRequest[];
    },
  });
}

export function usePublicJob(id: string) {
  return useQuery({
    queryKey: ["public-job", id],
    queryFn: async () => {
      const res = await api.get(`/api/v1/hr/public/jobs/${id}`);
      return res.data.data as JobRequest;
    },
    enabled: !!id,
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
    mutationFn: async (id: string) => {
      const res = await api.post(`/api/v1/hr/public/jobs/${id}/view`);
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
