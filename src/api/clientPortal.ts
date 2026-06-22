import { api } from "./client";

export type ClientPortalProject = {
  id: string;
  title: string;
  code?: string | null;
  status: string;
  startDate?: string | null;
  endDate?: string | null;
  description?: string | null;
  progressPercent: number;
  taskProgress: { totalTasks: number; completedTasks: number; openTasks: number };
  tasks: { id: string; title: string; status: string; priority?: string; dueDate?: string | null }[];
  milestones: { id: string; name: string; status: string; dueDate?: string | null; completedAt?: string | null }[];
  updates: Array<string | { title?: string; body?: string; date?: string }>;
};

export async function listClientPortalProjects() {
  const res = await api.get("/api/v1/client-portal/my-projects");
  return (res.data?.projects || res.data?.data?.projects || []) as ClientPortalProject[];
}
