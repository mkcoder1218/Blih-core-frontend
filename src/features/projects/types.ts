export type ProjectStatus = "DRAFT" | "PLANNED" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "CANCELLED" | "ARCHIVED";
export type ProjectPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
export type ProjectTaskStatus = "BACKLOG" | "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "BLOCKED" | "DONE" | "CANCELLED";
export type ProjectTaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface ProjectPerson {
  id: string;
  userId?: string;
  employeeCode?: string;
  user?: { id: string; fullName: string; email: string };
}

export interface ProjectMember {
  id: string;
  businessId: string;
  projectId: string;
  employeeId: string;
  role: "OWNER" | "MANAGER" | "MEMBER" | "VIEWER" | "STAKEHOLDER";
  allocationPercent: number;
  status: string;
  employee?: ProjectPerson;
}

export interface Project {
  id: string;
  businessId: string;
  title: string;
  code?: string | null;
  description?: string | null;
  status: ProjectStatus;
  priority?: ProjectPriority;
  progressPercent?: number;
  startDate?: string | null;
  endDate?: string | null;
  budget?: number;
  currency?: string;
  ownerEmployeeId?: string | null;
  managerEmployeeId?: string | null;
  owner?: ProjectPerson | null;
  manager?: ProjectPerson | null;
  members?: ProjectMember[];
  metadata?: { progress?: { totalTasks: number; completedTasks: number; progressPercent: number }; [key: string]: unknown };
  createdAt: string;
}

export interface ProjectTask {
  id: string;
  businessId: string;
  projectId: string;
  code?: string | null;
  title: string;
  description?: string | null;
  status: ProjectTaskStatus;
  priority: ProjectTaskPriority;
  assigneeEmployeeId?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
  project?: Pick<Project, "id" | "title" | "code" | "status">;
  employeeAssignee?: ProjectPerson | null;
  createdAt: string;
}

export type ProjectWorkflowStatus = "draft" | "submitted" | "approved" | "rejected" | "returned-for-revision" | "archived";

export interface ProjectWorkflowFormDefinition {
  key: string;
  name: string;
  group: "setup" | "milestones" | "tasks" | "deliverables" | "change_requests" | "issues" | "risks" | "closure" | "lessons" | "evaluations";
  entity: "project" | "milestone" | "task";
  approvalChain?: string[];
  requiredFields?: string[];
  schema?: Record<string, { label: string; type: string; required?: boolean; options?: string[] }>;
}

export interface ProjectWorkflowForm {
  id: string;
  businessId: string;
  projectId: string;
  milestoneId?: string | null;
  taskId?: string | null;
  fileAssetId?: string | null;
  approvalRequestId?: string | null;
  formKey: string;
  formName: string;
  workflowGroup: ProjectWorkflowFormDefinition["group"];
  status: ProjectWorkflowStatus;
  data: Record<string, unknown>;
  adapters?: Record<string, { enabled: boolean; config?: Record<string, unknown> }>;
  metadata?: Record<string, unknown>;
  milestone?: { id: string; name: string; status: string; dueDate?: string | null };
  task?: { id: string; code?: string | null; title: string; status: string };
  submitter?: { id: string; fullName: string; email: string };
  reviewer?: { id: string; fullName: string; email: string };
  createdAt: string;
  updatedAt: string;
}

export interface Paginated<T> {
  rows: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

export type ProjectsTab = "overview" | "all" | "mine" | "my-tasks" | "board";
