import { useDeferredValue, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { ContactDetailsDrawer } from "./components/ContactDetailsDrawer";
import { ContactFormModal } from "./components/ContactFormModal";
import { ContactOptionsManager } from "./components/ContactOptionsManager";
import { ContactsTable } from "./components/ContactsTable";
import { ContactsToolbar } from "./components/ContactsToolbar";
import type {
  BrainContact,
  ContactInput,
  ContactKind,
  ContactOptionType,
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
  const deferredSearch = useDeferredValue(search.trim());

  useEffect(() => {
    setPage(1);
  }, [kind, deferredSearch, fieldOptionId, behaviorOptionId, clientStatusOptionId]);

  useEffect(() => {
    if (kind === "influencer") setClientStatusOptionId(null);
  }, [kind]);

  const optionsQuery = useQuery({
    queryKey: ["brain-contact-options"],
    queryFn: () => listContactOptions(),
    staleTime: 30_000,
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

  const rows = contactsQuery.data?.rows || [];
  const count = contactsQuery.data?.count || 0;
  const pages = Math.max(contactsQuery.data?.pages || 1, 1);
  const options = optionsQuery.data || [];
  const saving = createMutation.isPending || updateMutation.isPending;

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
        <ContactsToolbar
          kind={kind}
          count={count}
          search={search}
          fieldOptionId={fieldOptionId}
          behaviorOptionId={behaviorOptionId}
          clientStatusOptionId={clientStatusOptionId}
          options={options}
          onKindChange={setKind}
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
      </section>

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
