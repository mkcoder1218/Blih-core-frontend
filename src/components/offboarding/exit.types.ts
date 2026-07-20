export type ExitInitiator =
  | "employee"
  | "employer";

export type ExitMode =
  | "immediate"
  | "urgent"
  | "standard_notice";

export type ExitStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "clearance"
  | "completed"
  | "cancelled";

export type ExitReasonInitiator =
  | "employee"
  | "employer"
  | "both";

export interface ExitEmployee {
  id: string;
  fullName: string;
  email?: string;
  department?: string;
  position?: string;
  avatarUrl?: string;
}

export interface ExitReason {
  id: string;
  businessId: string;

  name: string;
  description?: string | null;

  allowedInitiator: ExitReasonInitiator;

  requiresExplanation: boolean;
  isActive: boolean;
  sortOrder: number;

  createdAt?: string;
  updatedAt?: string;
}

export interface ExitProcess {
  id: string;
  businessId: string;

  employeeUserId: string;
  initiatedByUserId: string;

  initiatedByType: ExitInitiator;
  exitMode: ExitMode;

  exitType:
    | "resignation"
    | "termination"
    | "redundancy";

  exitReasonId?: string | null;
  exitReasonNameSnapshot?: string | null;

  reason?: string | null;
  letterHtml?: string | null;

  noticePeriodDays: number;
  effectiveDate: string;

  status: ExitStatus;

  approvalNote?: string | null;
  rejectionReason?: string | null;

  clearanceData?: Record<string, unknown>;
  finalPayData?: Record<string, unknown>;

  employee?: {
    id?: string;
    fullName?: string;
    email?: string;

    BusinessUserProfile?: {
      department?: {
        id?: string;
        name?: string;
      };

      position?: {
        id?: string;
        title?: string;
      };
    };
  };

  createdAt: string;
  updatedAt?: string;
}

export interface ExitRequestRow {
  id: string;

  employeeName: string;
  department: string;
  position: string;

  initiatedBy: ExitInitiator;
  mode: ExitMode;

  reason: string;
  effectiveDate: string;
  noticeDays: number;

  status: ExitStatus;

  raw: ExitProcess;
}

export interface CreateEmployeeExitInput {
  initiatedByType: "employee";

  exitMode: ExitMode;

  exitReasonId: string;
  reason?: string;

  effectiveDate: string;
  noticePeriodDays: number;

  letterHtml: string;
}

export interface CreateEmployerExitInput {
  initiatedByType: "employer";

  employeeUserId: string;

  exitType:
    | "termination"
    | "redundancy";

  exitMode: ExitMode;

  exitReasonId: string;
  reason?: string;

  effectiveDate: string;
  noticePeriodDays: number;

  letterHtml: string;
}
