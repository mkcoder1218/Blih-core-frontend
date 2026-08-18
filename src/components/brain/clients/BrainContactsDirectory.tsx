import { useCallback, useDeferredValue, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMyPermissions } from "@/hooks/usePermissions";
import { listContactCategories } from "./api/contactCategoriesApi";
import {
  createContact,
  createContactOption,
  deleteContact,
  deleteContactOption,
  listContactOptions,
  listContacts,
  updateContact,
  updateContactOption,
  uploadContactImage,
} from "./api/contactsApi";
import { ContactCategoryBuilderModal } from "./components/ContactCategoryBuilderModal";
import { ContactCategoryTabs } from "./components/ContactCategoryTabs";
import { ContactDetailsDrawer } from "./components/ContactDetailsDrawer";
import { ContactFormModal } from "./components/ContactFormModal";
import { ContactOptionsManager } from "./components/ContactOptionsManager";
import { ContactsTable } from "./components/ContactsTable";
import { ContactsToolbar } from "./components/ContactsToolbar";
import { CustomContactCategoryPanel } from "./components/CustomContactCategoryPanel";
import type { ContactCategory } from "./types/contactCategory.types";
import type {
  BrainContact,
  ContactInput,
  ContactKind,
} from "./types/contact.types";

const PAGE_SIZE = 20;

function requestErrorMessage(error: unknown) {
  return (
    (error as any)?.response?.data?.message ||
    (error as Error | undefined)?.message ||
    "Could not complete the contact request."
  );
}

export function BrainContactsDirectory() {
  const queryClient = useQueryClient();
  const permissions = useMyPermissions();
  const [activeKey, setActiveKey] = useState<string>("client");
  const [kind, setKind] = useState<ContactKind>("client");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [fieldOptionId, setFieldOptionId] = useState<string | null>(null);
  const [behaviorOptionId, setBehaviorOptionId] = useState<string | null>(null);
  const [clientStatusOptionId, setClientStatusOptionId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<BrainContact | null>(null);
  const [detailsContact, setDetailsContact] = useState<BrainContact | null>(null);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [categoryBuilderOpen, setCategoryBuilderOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ContactCategory | null>(null);
  const deferredSearch = useDeferredValue(search.trim());
  const systemTabActive = activeKey === "client" || activeKey === "influencer";

  const canViewCategories = permissions.can("brain.contact_categories.view");
  const canCreateCategory = permissions.can("brain.contact_categories.create");
  const canManageCategory = permissions.hasAny(
    "brain.contact_categories.update",
    "brain.contact_categories.archive",
    "brain.contact_fields.create",
    "brain.contact_fields.update",
    "brain.contact_fields.archive",
    "brain.contact_fields.reorder",
  );
  const canCreateContact = permissions.can("brain.contacts.create");
  const canUpdateContact = permissions.can("brain.contacts.update");
  const canDeleteContact = permissions.can("brain.contacts.delete");

  useEffect(() => {
    setPage(1);
  }, [kind, deferredSearch, fieldOptionId, behaviorOptionId, clientStatusOptionId]);

  useEffect(() => {
    if (kind === "influencer") setClientStatusOptionId(null);
  }, [kind]);

  const categoriesQuery = useQuery({
    queryKey: ["brain-contact-categories"],
    queryFn: () => listContactCategories(true),
    staleTime: 30_000,
    enabled: canViewCategories && !permissions.isLoading,
  });

  const optionsQuery = useQuery({
    queryKey: ["brain-contact-options"],
    queryFn: () => listContactOptions(),
    staleTime: 30_000,
    enabled: systemTabActive,
  });

  const contactsQuery = useQuery({
    queryKey: [
      "brain-contacts",
      kind,
      page,
      deferredSearch,
      fieldOptionId,
      behaviorOptionId,
      clientStatusOptionId,
    ],
    queryFn: () =>
      listContacts({
        page,
        size: PAGE_SIZE,
        kind,
        search: deferredSearch || undefined,
        fieldOptionId: fieldOptionId || undefined,
        behaviorOptionId: behaviorOptionId || undefined,
        clientStatusOptionId:
          kind === "client" ? clientStatusOptionId || undefined : undefined,
      }),
    enabled: systemTabActive,
  });

  const refreshContacts = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["brain-contacts"] }),
      queryClient.invalidateQueries({ queryKey: ["brain-clients"] }),
      queryClient.invalidateQueries({ queryKey: ["shared-clients"] }),
    ]);
  };

  const createMutation = useMutation({
    mutationFn: createContact,
    onSuccess: refreshContacts,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: ContactInput }) => updateContact(id, input),
    onSuccess: refreshContacts,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteContact,
    onSuccess: refreshContacts,
  });

  const createOptionMutation = useMutation({
    mutationFn: createContactOption,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["brain-contact-options"] });
    },
  });

  const updateOptionMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: { label?: string; color?: string | null } }) =>
      updateContactOption(id, input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["brain-contact-options"] }),
        queryClient.invalidateQueries({ queryKey: ["brain-contacts"] }),
      ]);
    },
  });

  const deleteOptionMutation = useMutation({
    mutationFn: deleteContactOption,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["brain-contact-options"] }),
        queryClient.invalidateQueries({ queryKey: ["brain-contacts"] }),
      ]);
    },
  });

  const categories = categoriesQuery.data || [];
  const activeCategories = categories.filter((category) => category.isActive);
  const activeCustomCategory = activeCategories.find((category) => category.id === activeKey) || null;
  const rows = contactsQuery.data?.rows || [];
  const count = contactsQuery.data?.count || 0;
  const pages = Math.max(contactsQuery.data?.pages || 1, 1);
  const options = optionsQuery.data || [];
  const saving = createMutation.isPending || updateMutation.isPending;

  const changeTab = (key: string) => {
    setActiveKey(key);
    if (key === "client" || key === "influencer") {
      setKind(key);
      setPage(1);
    }
  };

  const openCreateCategory = () => {
    if (!canCreateCategory) return;
    setEditingCategory(null);
    setCategoryBuilderOpen(true);
  };

  const openManageCategory = (category: ContactCategory) => {
    if (!canManageCategory) return;
    const latest = categories.find((item) => item.id === category.id) || category;
    setEditingCategory(latest);
    setCategoryBuilderOpen(true);
  };

  const upsertCategoryCache = useCallback((category: ContactCategory) => {
    queryClient.setQueryData<ContactCategory[]>(["brain-contact-categories"], (current) => {
      const rows = current || [];
      const found = rows.some((item) => item.id === category.id);
      return found ? rows.map((item) => (item.id === category.id ? category : item)) : [...rows, category];
    });
  }, [queryClient]);

  const openCreate = () => {
    setEditingContact(null);
    setFormOpen(true);
  };

  const openEdit = (contact: BrainContact) => {
    setDetailsContact(null);
    setEditingContact(contact);
    setFormOpen(true);
  };

  const submit = async (input: ContactInput) => {
    if (editingContact) {
      const updated = await updateMutation.mutateAsync({ id: editingContact.id, input });
      setDetailsContact((current) => (current?.id === updated.id ? updated : current));
    } else {
      await createMutation.mutateAsync(input);
    }
    setFormOpen(false);
    setEditingContact(null);
  };

  const remove = async (contact: BrainContact) => {
    if (!window.confirm(`Remove ${contact.name}? The record will be soft-deleted.`)) return;
    try {
      await deleteMutation.mutateAsync(contact.id);
      if (detailsContact?.id === contact.id) setDetailsContact(null);
    } catch (error) {
      window.alert(requestErrorMessage(error));
    }
  };

  return (
    <div className="space-y-5 text-foreground">
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <ContactCategoryTabs
          activeKey={activeKey}
          categories={activeCategories}
          canCreateCategory={canCreateCategory}
          onChange={changeTab}
          onAddCategory={openCreateCategory}
        />

        {categoriesQuery.isError ? (
          <div className="border-b border-border bg-destructive/5 px-5 py-2.5 text-[11px] font-semibold text-destructive sm:px-6">
            {requestErrorMessage(categoriesQuery.error)}
          </div>
        ) : null}

        {activeCustomCategory ? (
          <CustomContactCategoryPanel
            category={activeCustomCategory}
            canManageCategory={canManageCategory}
            canCreateContact={canCreateContact}
            canUpdateContact={canUpdateContact}
            canDeleteContact={canDeleteContact}
            onManageCategory={() => openManageCategory(activeCustomCategory)}
            onCategoryChanged={upsertCategoryCache}
          />
        ) : (
          <>
            <ContactsToolbar
              kind={kind}
              count={count}
              search={search}
              fieldOptionId={fieldOptionId}
              behaviorOptionId={behaviorOptionId}
              clientStatusOptionId={clientStatusOptionId}
              options={options}
              showKindTabs={false}
              onKindChange={(next) => changeTab(next)}
              onSearchChange={setSearch}
              onFieldChange={setFieldOptionId}
              onBehaviorChange={setBehaviorOptionId}
              onClientStatusChange={setClientStatusOptionId}
              onAdd={openCreate}
              onManageOptions={() => setOptionsOpen(true)}
            />

            {optionsQuery.isError ? (
              <div className="border-b border-border bg-destructive/5 px-5 py-2.5 text-[11px] font-semibold text-destructive sm:px-6">
                {requestErrorMessage(optionsQuery.error)}
              </div>
            ) : null}

            <ContactsTable
              kind={kind}
              rows={rows}
              loading={contactsQuery.isLoading}
              error={contactsQuery.isError ? requestErrorMessage(contactsQuery.error) : null}
              onView={setDetailsContact}
              onEdit={openEdit}
              onDelete={(contact) => void remove(contact)}
            />

            {pages > 1 ? (
              <div className="flex items-center justify-between border-t border-border px-5 py-3 sm:px-6">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-lg"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(current - 1, 1))}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </Button>
                <span className="text-[10px] font-bold text-muted-foreground">
                  Page {page} of {pages}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-lg"
                  disabled={page >= pages}
                  onClick={() => setPage((current) => Math.min(current + 1, pages))}
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : null}
          </>
        )}
      </section>

      <ContactCategoryBuilderModal
        open={categoryBuilderOpen}
        category={editingCategory}
        onOpenChange={(open) => {
          setCategoryBuilderOpen(open);
          if (!open) setEditingCategory(null);
        }}
        onSaved={(category) => {
          upsertCategoryCache(category);
          setActiveKey(category.id);
          setEditingCategory(category);
          void queryClient.invalidateQueries({ queryKey: ["brain-contact-categories"] });
        }}
        onArchived={(categoryId) => {
          queryClient.setQueryData<ContactCategory[]>(["brain-contact-categories"], (current) =>
            (current || []).map((category) => category.id === categoryId ? { ...category, isActive: false } : category),
          );
          if (activeKey === categoryId) changeTab("client");
          void queryClient.invalidateQueries({ queryKey: ["brain-contact-categories"] });
        }}
      />

      <ContactFormModal
        open={formOpen}
        initialKind={editingContact?.kind || kind}
        contact={editingContact}
        options={options}
        saving={saving}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingContact(null);
        }}
        onSubmit={submit}
        onCreateOption={async (input) => createOptionMutation.mutateAsync(input)}
        onUploadImage={uploadContactImage}
      />

      <ContactOptionsManager
        open={optionsOpen}
        options={options}
        onOpenChange={setOptionsOpen}
        onCreate={async (input) => createOptionMutation.mutateAsync(input)}
        onUpdate={async (id, input) => updateOptionMutation.mutateAsync({ id, input })}
        onDelete={async (id) => deleteOptionMutation.mutateAsync(id)}
      />

      <ContactDetailsDrawer
        contact={detailsContact}
        onClose={() => setDetailsContact(null)}
        onEdit={openEdit}
      />
    </div>
  );
}
