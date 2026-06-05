export const projectKeys = {
  all: ["projects"] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) => [...projectKeys.lists(), params ?? {}] as const,
  detail: (id: string) => [...projectKeys.all, "detail", id] as const,
  tasks: (projectId: string, params?: Record<string, unknown>) => [...projectKeys.detail(projectId), "tasks", params ?? {}] as const,
  taskLists: (projectId: string) => [...projectKeys.detail(projectId), "tasks"] as const,
  myTaskLists: () => [...projectKeys.all, "my-tasks"] as const,
  myTasks: (params?: Record<string, unknown>) => [...projectKeys.all, "my-tasks", params ?? {}] as const,
  members: (projectId: string) => [...projectKeys.detail(projectId), "members"] as const,
  workflowCatalog: () => [...projectKeys.all, "workflow-catalog"] as const,
  workflowForms: (projectId: string, params?: Record<string, unknown>) => [...projectKeys.detail(projectId), "workflow-forms", params ?? {}] as const,
  workflowFormLists: (projectId: string) => [...projectKeys.detail(projectId), "workflow-forms"] as const,
};
