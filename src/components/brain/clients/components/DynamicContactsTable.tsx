import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  ContactCategoryField,
  CustomContact,
} from "../types/contactCategory.types";

type Props = {
  fields: ContactCategoryField[];
  visibleFieldIds: string[];
  rows: CustomContact[];
  loading: boolean;
  error?: string | null;
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit: (contact: CustomContact) => void;
  onDelete: (contact: CustomContact) => void;
};

export function DynamicContactsTable({
  fields,
  visibleFieldIds,
  rows,
  loading,
  error,
  canEdit = false,
  canDelete = false,
  onEdit,
  onDelete,
}: Props) {
  const visibleSet = new Set(visibleFieldIds);
  const columns = [...fields]
    .filter((field) => !field.isArchived && visibleSet.has(field.id))
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const showActions = canEdit || canDelete;
  const colSpan = Math.max(columns.length + (showActions ? 1 : 0), 1);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead>
          <tr className="border-b border-border bg-muted/20">
            {columns.map((field) => (
              <th key={field.id} className="px-5 py-3 text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground sm:px-6">
                {field.label}
              </th>
            ))}
            {showActions ? (
              <th className="w-24 px-5 py-3 text-right text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground sm:px-6">
                Actions
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={colSpan} className="px-6 py-12 text-center text-xs text-muted-foreground">Loading contacts...</td></tr>
          ) : error ? (
            <tr><td colSpan={colSpan} className="px-6 py-10 text-center text-xs font-semibold text-destructive">{error}</td></tr>
          ) : rows.length === 0 ? (
            <tr><td colSpan={colSpan} className="px-6 py-12 text-center text-xs text-muted-foreground">No contacts in this category yet.</td></tr>
          ) : (
            rows.map((contact) => (
              <tr key={contact.id} className="border-b border-border/70 transition hover:bg-muted/15 last:border-b-0">
                {columns.map((field) => (
                  <td key={field.id} className="max-w-[280px] px-5 py-3.5 text-xs sm:px-6">
                    {renderValue(contact, field)}
                  </td>
                ))}
                {showActions ? (
                  <td className="px-5 py-3 text-right sm:px-6">
                    <div className="inline-flex items-center gap-1">
                      {canEdit ? (
                        <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(contact)} aria-label={`Edit ${contact.name}`}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      ) : null}
                      {canDelete ? (
                        <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onDelete(contact)} aria-label={`Delete ${contact.name}`}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      ) : null}
                    </div>
                  </td>
                ) : null}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function renderValue(contact: CustomContact, field: ContactCategoryField) {
  if (field.isSystem || field.key === "name") {
    return <span className="font-extrabold text-foreground">{contact.name}</span>;
  }
  const value = contact.values?.[field.key];
  if (value === null || value === undefined || value === "" || (Array.isArray(value) && !value.length)) {
    return <span className="text-muted-foreground">—</span>;
  }

  if (field.type === "checkbox") {
    return <span className="font-semibold">{Boolean(value) ? "Yes" : "No"}</span>;
  }
  if (field.type === "dropdown") {
    const option = field.options.find((item) => item.id === String(value));
    return <span className="font-semibold">{option?.label || String(value)}</span>;
  }
  if (field.type === "multi_select") {
    const ids = Array.isArray(value) ? value.map(String) : [];
    const labels = ids.map((id) => field.options.find((item) => item.id === id)?.label || id);
    return <span className="line-clamp-2 font-semibold">{labels.join(", ") || "—"}</span>;
  }
  if (field.type === "url") {
    const url = String(value);
    return (
      <a href={url} target="_blank" rel="noreferrer" className="block max-w-[240px] truncate font-semibold text-primary hover:underline">
        {url}
      </a>
    );
  }
  return <span className="block max-w-[260px] truncate font-semibold">{String(value)}</span>;
}
