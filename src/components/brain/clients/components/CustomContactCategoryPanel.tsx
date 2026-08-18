import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Columns3, Plus, Search, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createCustomContact,
  deleteCustomContact,
  getContactColumnPreference,
  listCustomContacts,
  updateContactColumnPreference,
  updateCustomContact,
} from "../api/contactCategoriesApi";
import type {
  ContactCategory,
  CustomContact,
  CustomContactInput,
} from "../types/contactCategory.types";
import { ContactCategoryIcon } from "./ContactCategoryIcon";
import { DynamicContactFormModal } from "./DynamicContactFormModal";
import { DynamicContactsTable } from "./DynamicContactsTable";

const PAGE_SIZE = 20;

type Props = {
  category: ContactCategory;
  onManageCategory: () => void;
  onCategoryChanged: (category: ContactCategory) => void;
};

function requestError(error: unknown) {
  return (
    (error as any)?.response?.data?.message ||
    (error as Error | undefined)?.message ||
    "Could not complete the contact request."
  );
}

export function CustomContactCategoryPanel({ category, onManageCategory, onCategoryChanged }: Props) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const [formOpen, setFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<CustomContact | null>(null);

  useEffect(() => {
    setPage(1);
    setSearch("");
    setFormOpen(false);
    setEditingContact(null);
  }, [category.id]);

  useEffect(() => setPage(1), [deferredSearch]);

  const contactsQuery = useQuery({
    queryKey: ["brain-custom-contacts", category.id, page, deferredSearch],
    queryFn: () => listCustomContacts(category.id, { page, size: PAGE_SIZE, search: deferredSearch || undefined }),
  });

  const preferenceQuery = useQuery({
    queryKey: ["brain-contact-column-preference", category.id],
    queryFn: () => getContactColumnPreference(category.id),
  });

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["brain-custom-contacts", category.id] }),
      queryClient.invalidateQueries({ queryKey: ["brain-contact-categories"] }),
    ]);
  };

  const createMutation = useMutation({
    mutationFn: (input: CustomContactInput) => createCustomContact(category.id, input),
    onSuccess: refresh,
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: CustomContactInput }) => updateCustomContact(category.id, id, input),
    onSuccess: refresh,
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCustomContact(category.id, id),
    onSuccess: refresh,
  });
  const preferenceMutation = useMutation({
    mutationFn: (ids: string[]) => updateContactColumnPreference(category.id, ids),
    onSuccess: (preference) => {
      queryClient.setQueryData(["brain-contact-column-preference", category.id], preference);
    },
  });

  const currentCategory = contactsQuery.data?.category || category;
  useEffect(() => {
    if (contactsQuery.data?.category && contactsQuery.data.category.id === category.id) {
      onCategoryChanged(contactsQuery.data.category);
    }
  }, [contactsQuery.data?.category, category.id, onCategoryChanged]);

  const activeFields = useMemo(
    () => [...(currentCategory.fields || [])].filter((field) => !field.isArchived).sort((a, b) => a.sortOrder - b.sortOrder),
    [currentCategory.fields],
  );
  const defaultVisibleIds = useMemo(
    () => activeFields.filter((field) => field.showInTable || field.isSystem).map((field) => field.id),
    [activeFields],
  );
  const visibleIds = preferenceQuery.data?.visibleFieldIds || defaultVisibleIds;
  const rows = contactsQuery.data?.rows || [];
  const count = contactsQuery.data?.count ?? currentCategory.contactCount ?? 0;
  const pages = Math.max(contactsQuery.data?.pages || 1, 1);
  const saving = createMutation.isPending || updateMutation.isPending;

  const submit = async (input: CustomContactInput) => {
    if (editingContact) await updateMutation.mutateAsync({ id: editingContact.id, input });
    else await createMutation.mutateAsync(input);
    setFormOpen(false);
    setEditingContact(null);
  };

  const remove = async (contact: CustomContact) => {
    if (!window.confirm(`Remove ${contact.name}? The contact will be soft-deleted.`)) return;
    try {
      await deleteMutation.mutateAsync(contact.id);
    } catch (cause) {
      window.alert(requestError(cause));
    }
  };

  const toggleColumn = (fieldId: string, checked: boolean) => {
    const nameField = activeFields.find((field) => field.isSystem);
    const next = new Set(visibleIds);
    if (checked) next.add(fieldId);
    else if (fieldId !== nameField?.id) next.delete(fieldId);
    void preferenceMutation.mutateAsync(Array.from(next));
  };

  return (
    <>
      <div className="flex flex-col gap-4 border-b border-border px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ContactCategoryIcon name={currentCategory.iconName} className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-extrabold tracking-tight">{currentCategory.name}</h1>
            <p className="mt-1 max-w-2xl text-xs font-medium leading-5 text-muted-foreground">
              {currentCategory.description || "Custom Brain contact category."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-lg border border-border bg-muted/30 px-3.5 py-2 text-right">
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Contacts</p>
            <p className="text-sm font-extrabold">{count}</p>
          </div>
          <ColumnsMenu
            fields={activeFields}
            visibleIds={visibleIds}
            busy={preferenceMutation.isPending}
            onToggle={toggleColumn}
          />
          <Button type="button" size="sm" variant="outline" className="rounded-md" onClick={onManageCategory}>
            <Settings2 className="h-4 w-4" />
            Manage category
          </Button>
          <Button
            type="button"
            size="sm"
            className="rounded-md"
            onClick={() => {
              setEditingContact(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Add contact
          </Button>
        </div>
      </div>

      <div className="border-b border-border px-5 py-4 sm:px-6">
        <label className="grid max-w-xl gap-1.5">
          <span className="text-[11px] font-bold text-muted-foreground">Search</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
              placeholder={`Search ${currentCategory.name.toLowerCase()}...`}
              className="h-10 rounded-md pl-9"
            />
          </div>
        </label>
      </div>

      <DynamicContactsTable
        fields={activeFields}
        visibleFieldIds={visibleIds}
        rows={rows}
        loading={contactsQuery.isLoading}
        error={contactsQuery.isError ? requestError(contactsQuery.error) : null}
        onEdit={(contact) => {
          setEditingContact(contact);
          setFormOpen(true);
        }}
        onDelete={(contact) => void remove(contact)}
      />

      {pages > 1 ? (
        <div className="flex items-center justify-between border-t border-border px-5 py-3 sm:px-6">
          <Button type="button" size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((value) => Math.max(value - 1, 1))}>
            <ChevronLeft className="h-3.5 w-3.5" />
            Previous
          </Button>
          <span className="text-[10px] font-bold text-muted-foreground">Page {page} of {pages}</span>
          <Button type="button" size="sm" variant="outline" disabled={page >= pages} onClick={() => setPage((value) => Math.min(value + 1, pages))}>
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : null}

      <DynamicContactFormModal
        open={formOpen}
        category={currentCategory}
        contact={editingContact}
        saving={saving}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingContact(null);
        }}
        onSubmit={submit}
      />
    </>
  );
}

function ColumnsMenu({
  fields,
  visibleIds,
  busy,
  onToggle,
}: {
  fields: ContactCategory["fields"];
  visibleIds: string[];
  busy: boolean;
  onToggle: (fieldId: string, checked: boolean) => void;
}) {
  const visible = new Set(visibleIds);
  return (
    <details className="relative">
      <summary className="inline-flex h-9 cursor-pointer list-none items-center gap-2 rounded-md border border-input bg-background px-3 text-xs font-bold shadow-xs transition hover:bg-accent hover:text-accent-foreground [&::-webkit-details-marker]:hidden">
        <Columns3 className="h-4 w-4" />
        Columns
      </summary>
      <div className="absolute right-0 z-40 mt-2 min-w-56 rounded-lg border border-border bg-popover p-2 shadow-xl">
        <p className="px-2 pb-2 text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground">Visible columns</p>
        <div className="grid max-h-64 gap-1 overflow-y-auto">
          {fields.map((field) => (
            <label key={field.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-xs font-semibold hover:bg-muted">
              <input
                type="checkbox"
                checked={visible.has(field.id)}
                disabled={busy || field.isSystem}
                onChange={(event) => onToggle(field.id, event.currentTarget.checked)}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <span className="min-w-0 flex-1 truncate">{field.label}</span>
              {field.isSystem ? <span className="text-[9px] text-muted-foreground">Required</span> : null}
            </label>
          ))}
        </div>
      </div>
    </details>
  );
}
