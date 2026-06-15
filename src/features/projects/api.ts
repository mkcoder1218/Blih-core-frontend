import { api } from "../../api/client";
import type { ApiEnvelope } from "../../api/types";
import type { Paginated, Project, ProjectMember, ProjectTask, ProjectWorkflowForm, ProjectWorkflowFormDefinition } from "./types";

function unwrapPage<T>(res: any): Paginated<T> {
  const payload = res.data?.data;
  const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.rows) ? payload.rows : [];
  const total = res.data?.meta?.total ?? payload?.count ?? payload?.total ?? rows.length;
  return {
    rows,
    total,
    page: res.data?.meta?.page ?? payload?.page ?? 1,
    size: res.data?.meta?.limit ?? res.data?.meta?.size ?? payload?.size ?? 20,
    totalPages: res.data?.meta?.totalPages ?? payload?.totalPages ?? Math.max(1, Math.ceil(total / (res.data?.meta?.limit ?? 20))),
  };
}

export async function listProjects(params?: Record<string, unknown>) {
  const res = await api.get("/api/v1/projects", { params });
  return unwrapPage<Project>(res);
}

export async function getProject(id: string) {
  const res = await api.get<ApiEnvelope<Project>>(`/api/v1/projects/${id}`);
  return res.data.data;
}

export async function createProject(data: Partial<Project>) {
  const res = await api.post<ApiEnvelope<Project>>("/api/v1/projects", data);
  return res.data.data;
}

export async function updateProject(id: string, data: Partial<Project>) {
  const res = await api.patch<ApiEnvelope<Project>>(`/api/v1/projects/${id}`, data);
  return res.data.data;
}

export async function archiveProject(id: string) {
  const res = await api.patch<ApiEnvelope<Project>>(`/api/v1/projects/${id}/archive`);
  return res.data.data;
}

export async function changeProjectStatus(id: string, status: string) {
  const res = await api.patch<ApiEnvelope<Project>>(`/api/v1/projects/${id}/status`, { status });
  return res.data.data;
}

export async function listProjectTasks(projectId: string, params?: Record<string, unknown>) {
  const res = await api.get(`/api/v1/projects/${projectId}/tasks`, { params });
  return unwrapPage<ProjectTask>(res);
}

async function listAllPages<T>(fetchPage: (page: number) => Promise<Paginated<T>>) {
  const firstPage = await fetchPage(1);
  if (firstPage.totalPages <= 1) return firstPage;

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.totalPages - 1 }, (_, index) => fetchPage(index + 2))
  );
  const rows = [firstPage, ...remainingPages].flatMap((page) => page.rows);

  return {
    ...firstPage,
    rows,
    page: 1,
    size: rows.length,
  };
}

export async function listAllProjectTasks(projectId: string, params?: Record<string, unknown>) {
  return listAllPages<ProjectTask>((page) => listProjectTasks(projectId, { ...params, page, size: 100 }));
}

export async function listMyTasks(params?: Record<string, unknown>) {
  const res = await api.get("/api/v1/projects/my-tasks", { params });
  return unwrapPage<ProjectTask>(res);
}

export async function listAllMyTasks(params?: Record<string, unknown>) {
  return listAllPages<ProjectTask>((page) => listMyTasks({ ...params, page, size: 100 }));
}

export async function createProjectTask(projectId: string, data: Partial<ProjectTask>) {
  const res = await api.post<ApiEnvelope<ProjectTask>>(`/api/v1/projects/${projectId}/tasks`, data);
  return res.data.data;
}

export async function updateProjectTask(projectId: string, taskId: string, data: Partial<ProjectTask>) {
  const res = await api.patch<ApiEnvelope<ProjectTask>>(`/api/v1/projects/${projectId}/tasks/${taskId}`, data);
  return res.data.data;
}

export async function changeTaskStatus(projectId: string, taskId: string, status: string) {
  const res = await api.patch<ApiEnvelope<ProjectTask>>(`/api/v1/projects/${projectId}/tasks/${taskId}/status`, { status });
  return res.data.data;
}

export async function listProjectMembers(projectId: string) {
  const res = await api.get<ApiEnvelope<ProjectMember[]>>(`/api/v1/projects/${projectId}/members`);
  return res.data.data ?? [];
}

export async function addProjectMember(projectId: string, data: Partial<ProjectMember>) {
  const res = await api.post<ApiEnvelope<ProjectMember>>(`/api/v1/projects/${projectId}/members`, data);
  return res.data.data;
}

export async function getProjectWorkflowCatalog() {
  const res = await api.get<ApiEnvelope<ProjectWorkflowFormDefinition[]>>("/api/v1/projects/workflow/catalog");
  return res.data.data ?? [];
}

export async function listProjectWorkflowForms(projectId: string, params?: Record<string, unknown>) {
  const res = await api.get<ApiEnvelope<ProjectWorkflowForm[]>>(`/api/v1/projects/${projectId}/workflow-forms`, { params });
  return res.data.data ?? [];
}

export async function createProjectWorkflowForm(projectId: string, data: Partial<ProjectWorkflowForm> & { formKey: string }) {
  const res = await api.post<ApiEnvelope<ProjectWorkflowForm>>(`/api/v1/projects/${projectId}/workflow-forms`, data);
  return res.data.data;
}

export async function updateProjectWorkflowForm(projectId: string, formId: string, data: Partial<ProjectWorkflowForm>) {
  const res = await api.patch<ApiEnvelope<ProjectWorkflowForm>>(`/api/v1/projects/${projectId}/workflow-forms/${formId}`, data);
  return res.data.data;
}

export async function changeProjectWorkflowFormStatus(projectId: string, formId: string, status: string, metadata?: Record<string, unknown>) {
  const res = await api.patch<ApiEnvelope<ProjectWorkflowForm>>(`/api/v1/projects/${projectId}/workflow-forms/${formId}/status`, { status, metadata });
  return res.data.data;
}
