import { api } from "./client";
import type { ApiEnvelope } from "./types";

export type BulkEmployeeAction = "CREATE" | "UPDATE" | "SKIP";
export type BulkEmployeeValidationStatus = "READY_TO_CREATE" | "READY_TO_UPDATE" | "UNCHANGED" | "INVALID" | "CONFLICT";
export type BulkEmployeeWriteStatus = "CREATED" | "UPDATED" | "SKIPPED" | "UNCHANGED" | "FAILED" | "CONFLICT";

export type BulkEmployeeRow = {
  rowNumber: number;
  action?: BulkEmployeeAction;
  employeeId?: string;
  referenceActions?: {
    department?: "CREATE" | "SKIP";
    position?: "CREATE" | "SKIP";
  };
  account: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    password?: string | null;
  };
  profile: {
    employeeCode: string;
    roleKeys: string[];
    departmentName?: string | null;
    positionName?: string | null;
    managerEmail?: string | null;
    branch?: string | null;
    employmentType: "full_time" | "part_time" | "contractor" | "intern";
    employmentStatus: "onboarding" | "active" | "inactive" | "on_leave" | "terminated";
    hireDate: string;
    probationEndDate?: string | null;
    contractStartDate?: string | null;
    contractEndDate?: string | null;
    monthlySalary?: number | null;
    salaryCurrency?: string | null;
    dateOfBirth?: string | null;
    city?: string | null;
    countryOfBirth?: string | null;
    additionalPhone?: string | null;
    additionalNotes?: string | null;
    emergencyFirstName?: string | null;
    emergencyLastName?: string | null;
    emergencyPhone?: string | null;
    emergencyEmail?: string | null;
    emergencyCity?: string | null;
    emergencyCountry?: string | null;
    bankDetails?: Array<{ bankName?: string | null; accountNumber?: string | null }>;
  };
};

export type BulkEmployeeError = { field: string; code?: string; message: string; allowCreate?: boolean };
export type BulkEmployeeChange = { field: string; currentValue: unknown; uploadedValue: unknown };

export type BulkEmployeeValidationResult = {
  rowNumber: number;
  status: BulkEmployeeValidationStatus;
  normalizedRow?: BulkEmployeeRow;
  errors: BulkEmployeeError[];
  changes: BulkEmployeeChange[];
  matchedBy?: "employeeCode" | "email" | "none" | "conflict";
  existingEmployeeRecordId?: string;
  existingUserId?: string;
};

export type BulkEmployeeValidationResponse = {
  summary: Record<BulkEmployeeValidationStatus, number> & { total: number };
  results: BulkEmployeeValidationResult[];
};

export type BulkEmployeeWriteResponse = {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  unchanged: number;
  failed: number;
  conflicts: number;
  results: Array<{
    rowNumber: number;
    status: BulkEmployeeWriteStatus;
    employeeId?: string;
    employeeCode?: string;
    errors?: BulkEmployeeError[];
  }>;
};

export async function validateBulkEmployees(rows: BulkEmployeeRow[]) {
  const res = await api.post<ApiEnvelope<BulkEmployeeValidationResponse>>("/api/v1/hr/records/bulk/validate", { rows });
  return res.data.data;
}

export async function bulkImportEmployees(rows: BulkEmployeeRow[]) {
  const res = await api.post<ApiEnvelope<BulkEmployeeWriteResponse>>("/api/v1/hr/records/bulk", { rows });
  return res.data.data;
}
