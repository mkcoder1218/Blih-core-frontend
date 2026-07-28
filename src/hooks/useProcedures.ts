import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  proceduresApi,
  CreateProcedureInput,
  ProcedureListParams,
  UpdateProcedureInput,
} from "../api/procedures";

// ── Procedures Hooks ──

export function useProcedures(params?: ProcedureListParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["brain", "procedures", params],
    queryFn: () => proceduresApi.list(params),
    enabled: options?.enabled ?? true,
  });
}

export function useProcedure(id: string | null | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["brain", "procedure", id],
    queryFn: () => proceduresApi.get(id!),
    enabled: Boolean(id) && (options?.enabled ?? true),
  });
}

export function useCreateProcedure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProcedureInput) => proceduresApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brain", "procedures"] });
    },
  });
}

export function useUpdateProcedure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProcedureInput }) =>
      proceduresApi.update(id, input),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["brain", "procedures"] });
      queryClient.invalidateQueries({ queryKey: ["brain", "procedure", variables.id] });
    },
  });
}

export function useDeleteProcedure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => proceduresApi.delete(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ["brain", "procedures"] });
      queryClient.invalidateQueries({ queryKey: ["brain", "procedure", id] });
    },
  });
}

export function useRestoreProcedure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => proceduresApi.restore(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ["brain", "procedures"] });
      queryClient.invalidateQueries({ queryKey: ["brain", "procedure", id] });
    },
  });
}

// ── Procedure Workflow Action Hooks ──

export function useSubmitProcedureReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => proceduresApi.submitReview(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ["brain", "procedures"] });
      queryClient.invalidateQueries({ queryKey: ["brain", "procedure", id] });
      queryClient.invalidateQueries({ queryKey: ["brain", "procedure", id, "revisions"] });
    },
  });
}

export function useApproveProcedure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => proceduresApi.approve(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ["brain", "procedures"] });
      queryClient.invalidateQueries({ queryKey: ["brain", "procedure", id] });
      queryClient.invalidateQueries({ queryKey: ["brain", "procedure", id, "revisions"] });
    },
  });
}

export function useRequestProcedureChanges() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment: string }) =>
      proceduresApi.requestChanges(id, comment),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["brain", "procedures"] });
      queryClient.invalidateQueries({ queryKey: ["brain", "procedure", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["brain", "procedure", variables.id, "revisions"] });
    },
  });
}

export function usePublishProcedure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => proceduresApi.publish(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ["brain", "procedures"] });
      queryClient.invalidateQueries({ queryKey: ["brain", "procedure", id] });
      queryClient.invalidateQueries({ queryKey: ["brain", "procedure", id, "revisions"] });
    },
  });
}

export function useUnpublishProcedure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => proceduresApi.unpublish(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ["brain", "procedures"] });
      queryClient.invalidateQueries({ queryKey: ["brain", "procedure", id] });
      queryClient.invalidateQueries({ queryKey: ["brain", "procedure", id, "revisions"] });
    },
  });
}

export function useArchiveProcedure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => proceduresApi.archive(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ["brain", "procedures"] });
      queryClient.invalidateQueries({ queryKey: ["brain", "procedure", id] });
      queryClient.invalidateQueries({ queryKey: ["brain", "procedure", id, "revisions"] });
    },
  });
}

// ── Revisions Hooks ──

export function useProcedureRevisions(
  procedureId: string | null | undefined,
  params?: { page?: number; size?: number },
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ["brain", "procedure", procedureId, "revisions", params],
    queryFn: () => proceduresApi.listRevisions(procedureId!, params),
    enabled: Boolean(procedureId) && (options?.enabled ?? true),
  });
}

export function useProcedureRevision(
  procedureId: string | null | undefined,
  revisionId: string | null | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ["brain", "procedure", procedureId, "revision", revisionId],
    queryFn: () => proceduresApi.getRevision(procedureId!, revisionId!),
    enabled: Boolean(procedureId) && Boolean(revisionId) && (options?.enabled ?? true),
  });
}

export function useRestoreProcedureRevision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ procedureId, revisionId }: { procedureId: string; revisionId: string }) =>
      proceduresApi.restoreRevision(procedureId, revisionId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["brain", "procedures"] });
      queryClient.invalidateQueries({ queryKey: ["brain", "procedure", variables.procedureId] });
      queryClient.invalidateQueries({ queryKey: ["brain", "procedure", variables.procedureId, "revisions"] });
    },
  });
}
