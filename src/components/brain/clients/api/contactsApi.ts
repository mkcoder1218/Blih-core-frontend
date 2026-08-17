import { api } from "@/api/client";
import type {
  BrainContact,
  ContactInput,
  ContactListPage,
  ContactListParams,
  ContactOption,
  ContactOptionType,
} from "../types/contact.types";

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

const BASE = "/api/v1/brain/clients/directory";

export async function listContacts(params: ContactListParams): Promise<ContactListPage> {
  const response = await api.get<ApiEnvelope<ContactListPage>>(BASE, { params });
  const data = response.data.data;
  return {
    rows: Array.isArray(data?.rows) ? data.rows : [],
    count: Number(data?.count || 0),
    page: Number(data?.page || params.page || 1),
    size: Number(data?.size || params.size || 20),
    pages: Math.max(Number(data?.pages || 1), 1),
  };
}

export async function getContact(id: string): Promise<BrainContact> {
  const response = await api.get<ApiEnvelope<{ contact: BrainContact }>>(`${BASE}/${id}`);
  return response.data.data.contact;
}

export async function createContact(input: ContactInput): Promise<BrainContact> {
  const response = await api.post<ApiEnvelope<{ contact: BrainContact }>>(BASE, input);
  return response.data.data.contact;
}

export async function updateContact(id: string, input: Partial<ContactInput>): Promise<BrainContact> {
  const response = await api.patch<ApiEnvelope<{ contact: BrainContact }>>(`${BASE}/${id}`, input);
  return response.data.data.contact;
}

export async function deleteContact(id: string): Promise<void> {
  await api.delete(`${BASE}/${id}`);
}

export async function listContactOptions(type?: ContactOptionType): Promise<ContactOption[]> {
  const response = await api.get<ApiEnvelope<{ rows: ContactOption[] }>>(`${BASE}/options`, {
    params: type ? { type } : undefined,
  });
  return Array.isArray(response.data.data?.rows) ? response.data.data.rows : [];
}

export async function createContactOption(input: {
  type: ContactOptionType;
  label: string;
  color?: string | null;
}): Promise<ContactOption> {
  const response = await api.post<ApiEnvelope<{ option: ContactOption }>>(`${BASE}/options`, input);
  return response.data.data.option;
}

export async function updateContactOption(
  id: string,
  input: { label?: string; color?: string | null },
): Promise<ContactOption> {
  const response = await api.patch<ApiEnvelope<{ option: ContactOption }>>(`${BASE}/options/${id}`, input);
  return response.data.data.option;
}

export async function deleteContactOption(id: string): Promise<void> {
  await api.delete(`${BASE}/options/${id}`);
}

export async function uploadContactImage(file: File): Promise<string> {
  const body = new FormData();
  body.append("image", file);
  const response = await api.post<ApiEnvelope<{ imageUrl: string }>>(`${BASE}/profile-image`, body, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.data.imageUrl;
}
