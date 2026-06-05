import { api } from "./client";
import type { ApiEnvelope } from "./types";

export interface ProjectEvidenceSummary {
  assignedTasks: number;
  assignedWeight: number;
  completedTasks: number;
  completedWeight: number;
  overdueTasks: number;
  overdueWeight: number;
  onTimeTasks: number;
  onTimeWeight: number;
  blockedTasks: number;
  blockedWeight: number;
  reopenedTasks: number;
  reopenedWeight: number;
  approvedTasks: number;
  approvedWeight: number;
  latePenaltyExcludedTasks: number;
  weightedCompletionRate: number;
  onTimeCompletionRate: number;
}

export interface ProjectEvidenceTask {
  id: string;
  code?: string | null;
  title: string;
  status: string;
  dueDate?: string | null;
  weight: number;
  overdue: boolean;
  onTime: boolean;
  blocked: boolean;
  reopened: boolean;
  approved: boolean;
  excludedLatePenalty: boolean;
  project?: { id: string; code?: string | null; title: string } | null;
}

export interface EmployeeProjectMetrics {
  employee: {
    id: string;
    userId: string;
    name?: string;
    email?: string;
    department?: { id: string; name: string } | null;
  };
  period: {
    periodStart?: string;
    periodEnd?: string;
  };
  summary: ProjectEvidenceSummary;
  tasks: ProjectEvidenceTask[];
}

export interface ProjectDashboardResponse {
  filters: {
    periodStart?: string;
    periodEnd?: string;
  };
  rows: EmployeeProjectMetrics[];
}

export interface PerformanceOverviewResponse {
  summary: {
    mostImprovedDepartment: string | null;
    reviewsDue: number;
    activeOkrs: number;
    onTrackOkrs: number;
  };
  topEmployees: Array<{
    reviewId: string;
    employeeUserId: string;
    name: string;
    department: string;
    score: number;
    okrScore: number;
  }>;
  trend: Array<{ month: string; score: number }>;
  distribution: {
    exceeds: number;
    meets: number;
    below: number;
    needsImprovement: number;
  };
  departments: Array<{
    id: string | null;
    name: string;
    employeeCount: number;
    averageScore: number | null;
  }>;
  projectDashboard: ProjectDashboardResponse;
}

export interface PerformanceReviewRecord {
  id: string;
  employeeUserId: string;
  employeeName: string;
  employeeEmail?: string;
  department?: { id: string; name: string } | null;
  reviewerName?: string | null;
  periodType?: string;
  periodStart: string;
  periodEnd: string;
  score: number | null;
  status: string;
  reviewData: Record<string, any>;
  projectEvidence: EmployeeProjectMetrics;
}

export async function getPerformanceOverview(params?: Record<string, string>) {
  const res = await api.get<ApiEnvelope<PerformanceOverviewResponse>>("/api/v1/hr/performance/overview", { params });
  return res.data.data;
}

export async function getPerformanceReviews(params?: Record<string, string>) {
  const res = await api.get<ApiEnvelope<PerformanceReviewRecord[]>>("/api/v1/hr/performance/reviews", { params });
  return res.data.data || [];
}

export async function getProjectPerformanceDashboard(params?: Record<string, string>) {
  const res = await api.get<ApiEnvelope<ProjectDashboardResponse>>("/api/v1/hr/performance/project-dashboard", { params });
  return res.data.data;
}

export async function getEmployeeProjectEvidence(employeeUserId: string, params?: Record<string, string>) {
  const res = await api.get<ApiEnvelope<{ projectMetrics: EmployeeProjectMetrics; scoringNote: string }>>(
    `/api/v1/hr/performance/evaluations/${employeeUserId}/project-evidence`,
    { params },
  );
  return res.data.data;
}
