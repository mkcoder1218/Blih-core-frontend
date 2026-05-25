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
