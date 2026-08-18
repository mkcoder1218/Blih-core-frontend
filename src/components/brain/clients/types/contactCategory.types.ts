export type ContactFieldType =
  | "text"
  | "long_text"
  | "number"
  | "phone"
  | "email"
  | "date"
  | "url"
  | "dropdown"
  | "multi_select"
  | "checkbox";

export type ContactFieldOption = { id: string; label: string };

export type ContactCategoryField = {
  id: string;
  businessId?: string;
  categoryId: string;
  key: string;
  label: string;
  type: ContactFieldType;
  isRequired: boolean;
  showInTable: boolean;
  sortOrder: number;
  options: ContactFieldOption[];
  isSystem: boolean;
  isArchived: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ContactCategory = {
  id: string;
  businessId?: string;
  name: string;
  iconName: string;
  description?: string | null;
  isActive: boolean;
  sortOrder: number;
  fields: ContactCategoryField[];
  contactCount: number;
  createdAt?: string;
  updatedAt?: string;
};

export type ContactCategoryFieldInput = {
  label: string;
  type: ContactFieldType;
  isRequired: boolean;
  showInTable: boolean;
  options: ContactFieldOption[];
};

export type ContactCategoryInput = {
  name: string;
  iconName: string;
  description?: string | null;
  fields?: ContactCategoryFieldInput[];
};

export type CustomContact = {
  id: string;
  businessId?: string;
  categoryId: string;
  name: string;
  values: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type CustomContactInput = { name: string; values: Record<string, unknown> };
export type CustomContactPage = { category: ContactCategory; rows: CustomContact[]; count: number; page: number; size: number; pages: number };
export type ColumnPreference = { categoryId: string; visibleFieldIds: string[] };
