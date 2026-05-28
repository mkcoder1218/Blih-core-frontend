export type TemplateField = {
  name: string; // e.g. "fullName", "age", "phone"
  label: string; // e.g. "Full Name", "Age", "Phone"
  componentType: "input" | "select" | "textarea" | "checkbox" | "date" | "number";
  required?: boolean;
  hasValidation?: boolean;
  validationMessage?: string;
  placeholder?: string;
  options?: { label: string; value: string }[]; // for select
};

export type ProfileTemplate = {
  id: string;
  name: string;
  description: string;
  fields: TemplateField[];
};

export type ProfileDraft = {
  id: string;
  templateId: string;
  status: "draft" | "completed";
  data: Record<string, any>;
  createdAt: string;
  updatedAt: string;
};
