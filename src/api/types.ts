export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  requestId?: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type SafeUser = {
  id: string;
  businessId: string;
  fullName: string;
  email: string;
  phone?: string | null;
  status: string;
  isPlatformSuperAdmin: boolean;
  lastLoginAt?: string | null;
};

export type Business = {
  id: string;
  name: string;
  slug: string;
  email?: string | null;
  phone?: string | null;
  status: string;
  planId?: string | null;
  sectorFocusId?: string | null;
};

export type Plan = {
  id: string;
  name: string;
  key: string;
  priceMonthly: string | number;
  userLimit?: number | null;
  status: string;
  settings?: any;
};

export type SectorFocus = {
  id: string;
  name: string;
  key: string;
  description?: string | null;
  status: string;
};

export type EnabledModule = {
  moduleKey: string;
  moduleName: string;
  status: string;
  enabledAt?: string | null;
};

export type LoginSuccessResponse = {
  accessToken: string;
  refreshToken: string;
  user: SafeUser;
  business: Business | null;
  roles: string[];
  permissions: string[];
  enabledModules: EnabledModule[];
};

export type WorkspaceOption = { id: string; name: string; slug: string; status: string };

export type LoginRequiresWorkspace = {
  requiresWorkspaceSelection: true;
  businesses: WorkspaceOption[];
};

export type LoginResponse = LoginSuccessResponse | LoginRequiresWorkspace;

export type MeResponse = {
  user: SafeUser;
  business: Business | null;
  roles: string[];
  permissions: string[];
  enabledModules: EnabledModule[];
};

export type CreateBusinessRequest = {
  name: string;
  slug: string;
  email: string;
  phone: string;
  planId: string;
  sectorFocusId?: string | null;
};

export type BusinessesResponse = {
  businesses: Business[];
};

export type PlansResponse = {
  plans: Plan[];
};

export type SectorFocusesResponse = {
  sectorFocuses: SectorFocus[];
};

export type UpdateBusinessRequest = Partial<CreateBusinessRequest> & {
  status?: "active" | "inactive";
};

export type CreatePlanRequest = {
  name: string;
  key: string;
  priceMonthly: number;
  userLimit?: number | null;
  status?: "active" | "inactive";
  settings?: any;
};

export type UpdatePlanRequest = Partial<CreatePlanRequest>;

export type CreateSectorFocusRequest = {
  name: string;
  key: string;
  description?: string | null;
  status?: "active" | "inactive";
};

export type UpdateSectorFocusRequest = Partial<CreateSectorFocusRequest>;

export type CreateBusinessAdminRequest = {
  fullName: string;
  email: string;
  phone?: string | null;
  password: string;
};

export type CreateBusinessAdminResponse = {
  user: SafeUser;
};

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
