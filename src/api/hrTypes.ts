import type { EmploymentStatus, EmploymentType } from "../constants/employee";
import type { SafeUser } from "./types";

export type ProfileTemplateField = {
  name: string;
  label: string;
  componentType: "input" | "select" | "textarea" | "checkbox" | "date" | "number";
  required?: boolean;
  hasValidation?: boolean;
  validationMessage?: string;
  placeholder?: string;
  options?: { label: string; value: string }[];
};

export type ProfileTemplate = {
  id: string;
  businessId: string;
  name: string;
  description?: string | null;
  fields: ProfileTemplateField[];
  createdAt: string;
  updatedAt: string;
};

export type ProfileDraft = {
  id: string;
  businessId: string;
  templateId: string;
  status: "draft" | "completed";
  data: Record<string, any>;
  createdById: string;
  createdAt: string;
  updatedAt: string;
};

export type ProfileTemplatesResponse = { templates: ProfileTemplate[] };
export type ProfileDraftsResponse = { drafts: ProfileDraft[] };

export type CreateProfileTemplateRequest = {
  name: string;
  description?: string | null;
  fields: ProfileTemplateField[];
};

export type UpdateProfileTemplateRequest = Partial<CreateProfileTemplateRequest>;

export type CreateProfileDraftRequest = {
  templateId: string;
  status?: "draft" | "completed";
  data: Record<string, any>;
};

export type UpdateProfileDraftRequest = Partial<Pick<CreateProfileDraftRequest, "status" | "data">>;

export type Department = {
  id: string;
  name: string;
  businessId: string;
  status: "active" | "inactive";
  parentId?: string | null;
};

export type DepartmentsResponse = {
  departments: Department[];
  count?: number;
};

export type CreateDepartmentRequest = {
  name: string;
  status?: "active" | "inactive";
  parentId?: string | null;
};

export type Position = {
  id: string;
  title: string;
  businessId: string;
  status: "active" | "inactive";
  departmentId?: string | null;
};

export type PositionsResponse = {
  positions: Position[];
  count?: number;
};

export type CreatePositionRequest = {
  title: string;
  status?: "active" | "inactive";
  departmentId?: string | null;
};

export type User = SafeUser;

export type UsersResponse = {
  rows: User[];
  count: number;
};

export type EmployeeSalaryInfo = {
  baseSalary: number | string | null;
  currency: string;
};

export type EmployeeEmergencyContact = {
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  country: string | null;
};

export type EmployeeMetadata = {
  dateOfBirth?: string | null;
  city?: string | null;
  countryOfBirth?: string | null;
  additionalPhone?: string | null;
  branch?: string | null;
  bankDetails?: { bankName?: string | null; accountNumber?: string | null }[];
  assetsAndCredentials?: any[];
  additionalNotes?: string | null;
  uploads?: Record<string, any>;
  [key: string]: any;
};

export type EmployeeRecord = {
  id: string;
  businessId: string;
  userId: string;
  employeeCode: string;
  departmentId?: string | null;
  positionId?: string | null;
  managerUserId?: string | null;
  employmentType?: EmploymentType | null;
  employmentStatus: EmploymentStatus;
  hireDate: string;
  contractStartDate?: string | null;
  probationEndDate?: string | null;
  contractEndDate?: string | null;
  salaryInfo?: EmployeeSalaryInfo;
  emergencyContact?: EmployeeEmergencyContact;
  metadata?: EmployeeMetadata;
  user?: User;
  department?: Department | null;
  position?: Position | null;
};

