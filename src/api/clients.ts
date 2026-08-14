import { api } from "./client";

export type ClientStatus = "active" | "inactive";

export type CompanyClient = {
  id: string;
  businessId?: string;
  accountManagerUserId?: string | null;
  companyName: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  industry?: string | null;
  status?: ClientStatus;
  createdAt?: string;
  updatedAt?: string;
  accountManager?: {
    id: string;
    fullName?: string | null;
    email?: string | null;
  } | null;
};

export type CompanyClientListParams = {
  page?: number;
  size?: number;
  search?: string;
  status?: ClientStatus;
};

export type CompanyClientListPage = {
  rows: CompanyClient[];
  count: number;
  page: number;
  size: number;
  pages: number;
};

export type CreateCompanyClientInput = {
  companyName: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  industry?: string | null;
  status?: ClientStatus;
};

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

export async function listCompanyClientsPage(
  params?: CompanyClientListParams,
): Promise<CompanyClientListPage> {
  const response = await api.get<ApiEnvelope<CompanyClientListPage>>(
    "/api/v1/brain/clients",
    {
      params: {
        page: 1,
        size: 20,
        ...params,
      },
    },
  );

  const payload = response.data?.data;

  return {
    rows: Array.isArray(payload?.rows) ? payload.rows : [],
    count: Number(payload?.count || 0),
    page: Number(payload?.page || params?.page || 1),
    size: Number(payload?.size || params?.size || 20),
    pages: Math.max(Number(payload?.pages || 1), 1),
  };
}

export async function listCompanyClients(
  params?: CompanyClientListParams,
): Promise<CompanyClient[]> {
  const page = await listCompanyClientsPage({
    page: 1,
    size: 100,
    ...params,
  });

  return page.rows;
}

export async function createCompanyClient(
  input: CreateCompanyClientInput,
): Promise<CompanyClient> {
  const response = await api.post<ApiEnvelope<{ client: CompanyClient }>>(
    "/api/v1/brain/clients",
    input,
  );

  return response.data.data.client;
}
