import { api } from "./client";

export interface EvaluationQuestion {
  id?: string;
  businessId?: string;
  sectionId?: string;
  type: 'TEXT' | 'TEXTAREA' | 'NUMBER' | 'RATING' | 'SINGLE_SELECT' | 'MULTI_SELECT' | 'BOOLEAN' | 'DATE' | 'KPI_REFERENCE' | 'OKR_REFERENCE';
  label: string;
  description?: string;
  isRequired: boolean;
  options?: any;
  validationRules?: any;
  scoreWeight: number;
  orderIndex: number;
}

export interface EvaluationSection {
  id?: string;
  businessId?: string;
  templateId?: string;
  title: string;
  description?: string;
  orderIndex: number;
  questions: EvaluationQuestion[];
}

export interface EvaluationTemplate {
  id?: string;
  businessId?: string;
  title: string;
  description?: string;
  category: 'PERFORMANCE_REVIEW' | 'KPI_ASSESSMENT' | 'OKR_CHECK_IN' | 'COMPETENCY_SURVEY' | 'CUSTOM';
  targetAudience: string;
  frequency: 'ONE_TIME' | 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL';
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  createdById?: string;
  createdAt?: string;
  sections?: EvaluationSection[];
}

export interface EvaluationAssignment {
  id: string;
  businessId: string;
  templateId: string;
  targetType: 'EMPLOYEE' | 'DEPARTMENT' | 'ROLE';
  targetId?: string | null;
  evaluatorType: 'SELF' | 'MANAGER' | 'PEER' | 'HR' | 'DEPARTMENT_HEAD' | 'CUSTOM';
  evaluatorUserId: string;
  participantUserId: string;
  dueDate: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'OVERDUE' | 'CANCELLED';
  templateSnapshot: any;
  completedAt?: string;
  evaluator?: { id: string; fullName: string; email: string };
  participant?: { id: string; fullName: string; email: string };
  template?: { id: string; title: string; category: string };
  response?: EvaluationResponse;
}

export interface EvaluationAnswer {
  id?: string;
  responseId?: string;
  questionId: string;
  textValue?: string | null;
  numberValue?: number | null;
  dateValue?: string | null;
  optionValues?: any;
  referencedKpiId?: string | null;
  referencedObjectiveId?: string | null;
  referencedKeyResultId?: string | null;
  capturedValue?: number | null;
}

export interface EvaluationResponse {
  id?: string;
  assignmentId: string;
  templateId: string;
  submitterUserId?: string;
  status: 'SUBMITTED' | 'DRAFT';
  score?: number | null;
  submittedAt?: string;
  answers: EvaluationAnswer[];
}

export interface EvaluationTemplateListResponse {
  templates: EvaluationTemplate[];
  count: number;
}

export interface TemplateStats {
  totalCount: number;
  submittedCount: number;
  pendingCount: number;
  inProgressCount: number;
  overdueCount: number;
  completionRate: number;
}

export async function getTemplates(params?: Record<string, string>) {
  const res = await api.get<EvaluationTemplateListResponse>("/api/v1/evaluations/templates", { params });
  return res.data;
}

export async function createTemplate(data: Partial<EvaluationTemplate>) {
  const res = await api.post<{ template: EvaluationTemplate }>("/api/v1/evaluations/templates", data);
  return res.data.template;
}

export async function getTemplate(id: string) {
  const res = await api.get<{ template: EvaluationTemplate }>(`/api/v1/evaluations/templates/${id}`);
  return res.data.template;
}

export async function updateTemplate(id: string, data: Partial<EvaluationTemplate>) {
  const res = await api.patch<{ template: EvaluationTemplate }>(`/api/v1/evaluations/templates/${id}`, data);
  return res.data.template;
}

export async function deleteTemplate(id: string) {
  const res = await api.delete<{ message: string }>(`/api/v1/evaluations/templates/${id}`);
  return res.data;
}

export async function duplicateTemplate(id: string) {
  const res = await api.post<{ template: EvaluationTemplate }>(`/api/v1/evaluations/templates/${id}/duplicate`);
  return res.data.template;
}

export function getTemplateSchemaDownloadUrl(id: string) {
  return `/api/v1/evaluations/templates/${id}/schema`;
}

export async function getTemplateStats(id: string) {
  const res = await api.get<{ stats: TemplateStats }>(`/api/v1/evaluations/templates/${id}/stats`);
  return res.data.stats;
}

// --- Assignments & Responses ---
export async function assignTemplate(data: {
  templateId: string;
  targetType: 'EMPLOYEE' | 'DEPARTMENT' | 'ROLE';
  targetId?: string | null;
  evaluatorType: 'SELF' | 'MANAGER' | 'PEER' | 'HR' | 'DEPARTMENT_HEAD' | 'CUSTOM';
  evaluatorUserIds: string[];
  participantUserIds: string[];
  dueDate: string;
}) {
  const res = await api.post<{ assignments: EvaluationAssignment[] }>("/api/v1/evaluations/assignments", data);
  return res.data.assignments;
}

export async function getAssignments(params?: Record<string, string>) {
  const res = await api.get<{ assignments: EvaluationAssignment[] }>("/api/v1/evaluations/assignments", { params });
  return res.data.assignments;
}

export async function getAssignment(id: string) {
  const res = await api.get<{ assignment: EvaluationAssignment }>(`/api/v1/evaluations/assignments/${id}`);
  return res.data.assignment;
}

export async function submitResponse(data: {
  assignmentId: string;
  answers: EvaluationAnswer[];
  isDraft: boolean;
}) {
  const res = await api.post<{ response: EvaluationResponse }>("/api/v1/evaluations/assignments/submit", data);
  return res.data.response;
}

export async function getResponse(assignmentId: string) {
  const res = await api.get<{ response: EvaluationResponse }>(`/api/v1/evaluations/assignments/${assignmentId}/response`);
  return res.data.response;
}
