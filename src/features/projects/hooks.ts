import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addProjectMember,
  archiveProject,
  changeProjectStatus,
  changeTaskStatus,
  changeProjectWorkflowFormStatus,
  createProject,
  createProjectTask,
  createProjectWorkflowForm,
  getProjectWorkflowCatalog,
  getProject,
  listAllMyTasks,
  listAllProjectTasks,
  listProjectMembers,
  listProjectTasks,
  listProjectWorkflowForms,
  listProjects,
  updateProject,
  updateProjectTask,
  updateProjectWorkflowForm,
} from "./api";
import { projectKeys } from "./queryKeys";
import type { Project } from "./types";

export function useProjects(params?: Record<string, unknown>) {
  return useQuery({ queryKey: projectKeys.list(params), queryFn: () => listProjects(params), staleTime: 30_000 });
}

export function useProject(id?: string) {
  return useQuery({ queryKey: projectKeys.detail(id || ""), queryFn: () => getProject(id!), enabled: Boolean(id) });
}

export function useProjectTasks(projectId?: string, params?: Record<string, unknown>) {
  return useQuery({
    queryKey: projectKeys.tasks(projectId || "", params),
    queryFn: () => listAllProjectTasks(projectId!, params),
    enabled: Boolean(projectId),
    staleTime: 20_000,
  });
}

export function useMyProjectTasks(params?: Record<string, unknown>) {
  return useQuery({ queryKey: projectKeys.myTasks(params), queryFn: () => listAllMyTasks(params), staleTime: 20_000 });
}

export function useAllVisibleProjectTasks(projects: Project[] = [], enabled = true) {
  const queries = useQueries({
    queries: projects.map((project) => ({
      queryKey: projectKeys.tasks(project.id, { board: true }),
      queryFn: () => listAllProjectTasks(project.id),
      enabled,
      staleTime: 20_000,
    })),
  });

  return {
    rows: queries.flatMap((query) => query.data?.rows ?? []),
    total: queries.reduce((sum, query) => sum + (query.data?.total ?? 0), 0),
    isLoading: queries.some((query) => query.isLoading),
    isError: queries.some((query) => query.isError),
  };
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createProject, onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.all }) });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateProject(id, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: projectKeys.all });
      qc.invalidateQueries({ queryKey: projectKeys.detail(vars.id) });
    },
  });
}

export function useArchiveProject() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: archiveProject, onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.all }) });
}

export function useChangeProjectStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => changeProjectStatus(id, status),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: projectKeys.all });
      qc.invalidateQueries({ queryKey: projectKeys.detail(vars.id) });
    },
  });
}

export function useCreateProjectTask(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => createProjectTask(projectId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.taskLists(projectId) });
      qc.invalidateQueries({ queryKey: projectKeys.myTaskLists() });
      qc.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      qc.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

export function useChangeProjectTaskStatus(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) => changeTaskStatus(projectId, taskId, status),
    onMutate: async ({ taskId, status }) => {
      await qc.cancelQueries({ queryKey: projectKeys.detail(projectId) });
      await qc.cancelQueries({ queryKey: projectKeys.all });
      const taskKeys = qc.getQueriesData<any>({ queryKey: projectKeys.all });
      taskKeys.forEach(([key, page]) => {
        if (!page?.rows) return;
        qc.setQueryData(key, { ...page, rows: page.rows.map((task: any) => task.id === taskId ? { ...task, status } : task) });
      });
      return { taskKeys };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.taskKeys?.forEach(([key, data]: any) => qc.setQueryData(key, data));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: projectKeys.taskLists(projectId) });
      qc.invalidateQueries({ queryKey: projectKeys.myTaskLists() });
      qc.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      qc.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

export function useUpdateProjectTask(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: any }) => updateProjectTask(projectId, taskId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.taskLists(projectId) });
      qc.invalidateQueries({ queryKey: projectKeys.myTaskLists() });
      qc.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      qc.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

export function useMoveProjectTaskStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, taskId, status }: { projectId: string; taskId: string; status: string }) => changeTaskStatus(projectId, taskId, status),
    onMutate: async ({ taskId, status }) => {
      await qc.cancelQueries({ queryKey: projectKeys.all });
      const snapshots = qc.getQueriesData<any>({ queryKey: projectKeys.all });
      snapshots.forEach(([key, page]) => {
        if (!page?.rows) return;
        qc.setQueryData(key, { ...page, rows: page.rows.map((task: any) => task.id === taskId ? { ...task, status } : task) });
      });
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshots?.forEach(([key, data]: any) => qc.setQueryData(key, data));
    },
    onSettled: (_data, _error, vars) => {
      qc.invalidateQueries({ queryKey: projectKeys.myTaskLists() });
      qc.invalidateQueries({ queryKey: projectKeys.taskLists(vars.projectId) });
      qc.invalidateQueries({ queryKey: projectKeys.detail(vars.projectId) });
      qc.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

export function useProjectMembers(projectId?: string) {
  return useQuery({
    queryKey: projectKeys.members(projectId || ""),
    queryFn: () => listProjectMembers(projectId!),
    enabled: Boolean(projectId),
  });
}

export function useAddProjectMember(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => addProjectMember(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.members(projectId) }),
  });
}

export function useProjectWorkflowCatalog() {
  return useQuery({ queryKey: projectKeys.workflowCatalog(), queryFn: getProjectWorkflowCatalog, staleTime: 300_000 });
}

export function useProjectWorkflowForms(projectId?: string, params?: Record<string, unknown>) {
  return useQuery({
    queryKey: projectKeys.workflowForms(projectId || "", params),
    queryFn: () => listProjectWorkflowForms(projectId!, params),
    enabled: Boolean(projectId),
    staleTime: 20_000,
  });
}

export function useCreateProjectWorkflowForm(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => createProjectWorkflowForm(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.workflowFormLists(projectId) }),
  });
}

export function useUpdateProjectWorkflowForm(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ formId, data }: { formId: string; data: any }) => updateProjectWorkflowForm(projectId, formId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.workflowFormLists(projectId) }),
  });
}

export function useChangeProjectWorkflowFormStatus(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ formId, status, metadata }: { formId: string; status: string; metadata?: Record<string, unknown> }) => changeProjectWorkflowFormStatus(projectId, formId, status, metadata),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.workflowFormLists(projectId) }),
  });
}
