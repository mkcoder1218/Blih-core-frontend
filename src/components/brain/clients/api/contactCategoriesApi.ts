import { api } from "../../../../api/client";
import type {
  ColumnPreference,
  ContactCategory,
  ContactCategoryField,
  ContactCategoryFieldInput,
  ContactCategoryInput,
  CustomContact,
  CustomContactInput,
  CustomContactPage,
} from "../types/contactCategory.types";

type ApiEnvelope<T> = { success: boolean; message: string; data: T };
const BASE = "/api/v1/brain/clients/directory/categories";

export async function listContactCategories(includeArchived = false): Promise<ContactCategory[]> {
  const response = await api.get<ApiEnvelope<{ rows: ContactCategory[] }>>(BASE, { params: { includeArchived } });
  return Array.isArray(response.data.data?.rows) ? response.data.data.rows : [];
}

export async function createContactCategory(input: ContactCategoryInput): Promise<ContactCategory> {
  const response = await api.post<ApiEnvelope<{ category: ContactCategory }>>(BASE, input);
  return response.data.data.category;
}

export async function updateContactCategory(id: string, input: Partial<Pick<ContactCategory, "name" | "iconName" | "description" | "isActive">>): Promise<ContactCategory> {
  const response = await api.patch<ApiEnvelope<{ category: ContactCategory }>>(`${BASE}/${id}`, input);
  return response.data.data.category;
}

export async function archiveContactCategory(id: string): Promise<ContactCategory> {
  const response = await api.delete<ApiEnvelope<{ category: ContactCategory }>>(`${BASE}/${id}`);
  return response.data.data.category;
}

export async function createContactCategoryField(categoryId: string, input: ContactCategoryFieldInput): Promise<ContactCategoryField> {
  const response = await api.post<ApiEnvelope<{ field: ContactCategoryField }>>(`${BASE}/${categoryId}/fields`, input);
  return response.data.data.field;
}

export async function updateContactCategoryField(categoryId: string, fieldId: string, input: Partial<ContactCategoryFieldInput> & { isArchived?: boolean }): Promise<ContactCategoryField> {
  const response = await api.patch<ApiEnvelope<{ field: ContactCategoryField }>>(`${BASE}/${categoryId}/fields/${fieldId}`, input);
  return response.data.data.field;
}

export async function archiveContactCategoryField(categoryId: string, fieldId: string): Promise<ContactCategoryField> {
  const response = await api.delete<ApiEnvelope<{ field: ContactCategoryField }>>(`${BASE}/${categoryId}/fields/${fieldId}`);
  return response.data.data.field;
}

export async function reorderContactCategoryFields(categoryId: string, orderedFieldIds: string[]): Promise<ContactCategory> {
  const response = await api.patch<ApiEnvelope<{ category: ContactCategory }>>(`${BASE}/${categoryId}/fields-reorder`, { orderedFieldIds });
  return response.data.data.category;
}

export async function listCustomContacts(categoryId: string, params: { page?: number; size?: number; search?: string }): Promise<CustomContactPage> {
  const response = await api.get<ApiEnvelope<CustomContactPage>>(`${BASE}/${categoryId}/contacts`, { params });
  const data = response.data.data;
  return {
    category: data.category,
    rows: Array.isArray(data.rows) ? data.rows : [],
    count: Number(data.count || 0),
    page: Number(data.page || params.page || 1),
    size: Number(data.size || params.size || 20),
    pages: Math.max(Number(data.pages || 1), 1),
  };
}

export async function createCustomContact(categoryId: string, input: CustomContactInput): Promise<CustomContact> {
  const response = await api.post<ApiEnvelope<{ contact: CustomContact }>>(`${BASE}/${categoryId}/contacts`, input);
  return response.data.data.contact;
}

export async function updateCustomContact(categoryId: string, contactId: string, input: CustomContactInput): Promise<CustomContact> {
  const response = await api.patch<ApiEnvelope<{ contact: CustomContact }>>(`${BASE}/${categoryId}/contacts/${contactId}`, input);
  return response.data.data.contact;
}

export async function deleteCustomContact(categoryId: string, contactId: string): Promise<void> {
  await api.delete(`${BASE}/${categoryId}/contacts/${contactId}`);
}

export async function getContactColumnPreference(categoryId: string): Promise<ColumnPreference> {
  const response = await api.get<ApiEnvelope<{ preference: ColumnPreference }>>(`${BASE}/${categoryId}/column-preferences`);
  return response.data.data.preference;
}

export async function updateContactColumnPreference(categoryId: string, visibleFieldIds: string[]): Promise<ColumnPreference> {
  const response = await api.put<ApiEnvelope<{ preference: ColumnPreference }>>(`${BASE}/${categoryId}/column-preferences`, { visibleFieldIds });
  return response.data.data.preference;
}
