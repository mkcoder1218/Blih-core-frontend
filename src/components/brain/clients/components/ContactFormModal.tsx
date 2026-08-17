import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  BrainContact,
  ContactInput,
  ContactKind,
  ContactOption,
  ContactOptionType,
} from "../types/contact.types";
import { ContactImageUpload } from "./ContactImageUpload";
import { InfluencerPlatformsField } from "./InfluencerPlatformsField";
import { OptionSelectWithCreate } from "./OptionSelectWithCreate";
import { PhoneNumbersField } from "./PhoneNumbersField";

type Props = {
  open: boolean;
  initialKind: ContactKind;
  contact?: BrainContact | null;
  options: ContactOption[];
  saving?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: ContactInput) => Promise<void>;
  onCreateOption: (input: {
    type: ContactOptionType;
    label: string;
    color?: string | null;
  }) => Promise<ContactOption>;
  onUploadImage: (file: File) => Promise<string>;
};

function emptyForm(kind: ContactKind): ContactInput {
  return {
    kind,
    name: "",
    phones: [{ number: "", label: "Primary" }],
    email: "",
    fieldOptionId: null,
    behaviorOptionId: null,
    companyOptionId: null,
    positionOptionId: null,
    clientTypeOptionId: null,
    clientStatusOptionId: null,
    location: "",
    notes: "",
    profileImageUrl: null,
    platformAccounts: [],
  };
}

function fromContact(contact: BrainContact): ContactInput {
  return {
    kind: contact.kind,
    name: contact.name || "",
    phones: contact.phones?.length ? contact.phones : [{ number: "", label: "Primary" }],
    email: contact.email || "",
    fieldOptionId: contact.fieldOptionId || null,
    behaviorOptionId: contact.behaviorOptionId || null,
    companyOptionId: contact.companyOptionId || null,
    positionOptionId: contact.positionOptionId || null,
    clientTypeOptionId: contact.clientTypeOptionId || null,
    clientStatusOptionId: contact.clientStatusOptionId || null,
    location: contact.location || "",
    notes: contact.notes || "",
    profileImageUrl: contact.profileImageUrl || null,
    platformAccounts: (contact.platformAccounts || []).map((account) => ({
      id: account.id,
      platformOptionId: account.platformOptionId,
      handle: account.handle || "",
      profileUrl: account.profileUrl || "",
      followerCount: account.followerCount ?? null,
    })),
  };
}

function errorMessage(error: unknown) {
  return (
    (error as any)?.response?.data?.message ||
    (error as Error | undefined)?.message ||
    "Could not save contact."
  );
}

export function ContactFormModal({
  open,
  initialKind,
  contact,
  options,
  saving,
  onOpenChange,
  onSubmit,
  onCreateOption,
  onUploadImage,
}: Props) {
  const [form, setForm] = useState<ContactInput>(() => emptyForm(initialKind));
  const [error, setError] = useState("");
  const [platformDialogOpen, setPlatformDialogOpen] = useState(false);
  const [platformName, setPlatformName] = useState("");
  const [creatingPlatform, setCreatingPlatform] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(contact ? fromContact(contact) : emptyForm(initialKind));
    setError("");
  }, [open, contact, initialKind]);

  const platformOptions = useMemo(
    () => options.filter((option) => option.type === "platform"),
    [options],
  );

  const set = <K extends keyof ContactInput>(key: K, value: ContactInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = async () => {
    const name = form.name.trim();
    const phones = form.phones
      .map((phone) => ({ ...phone, number: phone.number.trim(), label: phone.label?.trim() || null }))
      .filter((phone) => phone.number);

    if (name.length < 2) {
      setError("Name must contain at least 2 characters.");
      return;
    }
    if (!phones.length) {
      setError("Add at least one phone number.");
      return;
    }
    if (
      form.kind === "influencer" &&
      (form.platformAccounts || []).some((account) => !account.platformOptionId)
    ) {
      setError("Choose a platform for every influencer account.");
      return;
    }

    setError("");
    try {
      await onSubmit({
        ...form,
        name,
        phones,
        email: form.email?.trim() || null,
        location: form.location?.trim() || null,
        notes: form.notes?.trim() || null,
        platformAccounts:
          form.kind === "influencer"
            ? form.platformAccounts || []
            : [],
        companyOptionId: form.kind === "client" ? form.companyOptionId || null : null,
        positionOptionId: form.kind === "client" ? form.positionOptionId || null : null,
        clientTypeOptionId: form.kind === "client" ? form.clientTypeOptionId || null : null,
        clientStatusOptionId: form.kind === "client" ? form.clientStatusOptionId || null : null,
      });
    } catch (cause) {
      setError(errorMessage(cause));
    }
  };

  const createPlatform = async () => {
    const label = platformName.trim();
    if (!label) return;
    setCreatingPlatform(true);
    try {
      const created = await onCreateOption({ type: "platform", label });
      setForm((current) => ({
        ...current,
        platformAccounts: [
          ...(current.platformAccounts || []),
          {
            platformOptionId: created.id,
            handle: "",
            profileUrl: "",
            followerCount: null,
          },
        ],
      }));
      setPlatformName("");
      setPlatformDialogOpen(false);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setCreatingPlatform(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{contact ? "Edit contact" : "Add contact"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-1 sm:grid-cols-2">
            <label className="grid gap-1.5">
              <span className="text-[11px] font-bold text-muted-foreground">Contact type *</span>
              <Select
                value={form.kind}
                disabled={saving}
                onValueChange={(value) => {
                  const kind = value as ContactKind;
                  setForm((current) => ({
                    ...current,
                    kind,
                    companyOptionId: kind === "client" ? current.companyOptionId : null,
                    positionOptionId: kind === "client" ? current.positionOptionId : null,
                    clientTypeOptionId: kind === "client" ? current.clientTypeOptionId : null,
                    clientStatusOptionId: kind === "client" ? current.clientStatusOptionId : null,
                    platformAccounts: kind === "influencer" ? current.platformAccounts || [] : [],
                  }));
                }}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="influencer">Influencer</SelectItem>
                </SelectContent>
              </Select>
            </label>

            <label className="grid gap-1.5">
              <span className="text-[11px] font-bold text-muted-foreground">Name *</span>
              <Input
                autoFocus
                value={form.name}
                disabled={saving}
                onChange={(event) => set("name", event.currentTarget.value)}
                placeholder="Full name"
                className="rounded-xl"
              />
            </label>

            <ContactImageUpload
              value={form.profileImageUrl}
              disabled={saving}
              onChange={(value) => set("profileImageUrl", value)}
              onUpload={onUploadImage}
            />

            <PhoneNumbersField
              value={form.phones}
              disabled={saving}
              onChange={(phones) => set("phones", phones)}
            />

            <label className="grid gap-1.5">
              <span className="text-[11px] font-bold text-muted-foreground">Email</span>
              <Input
                type="email"
                value={form.email || ""}
                disabled={saving}
                onChange={(event) => set("email", event.currentTarget.value)}
                placeholder="contact@example.com"
                className="rounded-xl"
              />
            </label>

            <label className="grid gap-1.5">
              <span className="text-[11px] font-bold text-muted-foreground">Location</span>
              <Input
                value={form.location || ""}
                disabled={saving}
                onChange={(event) => set("location", event.currentTarget.value)}
                placeholder="Addis Ababa"
                className="rounded-xl"
              />
            </label>

            <OptionSelectWithCreate
              label="Field"
              type="field"
              value={form.fieldOptionId}
              options={options}
              disabled={saving}
              onChange={(value) => set("fieldOptionId", value)}
              onCreate={onCreateOption}
            />

            <OptionSelectWithCreate
              label="Behavior"
              type="behavior"
              value={form.behaviorOptionId}
              options={options}
              disabled={saving}
              onChange={(value) => set("behaviorOptionId", value)}
              onCreate={onCreateOption}
            />

            {form.kind === "client" ? (
              <>
                <OptionSelectWithCreate
                  label="Company"
                  type="company"
                  value={form.companyOptionId}
                  options={options}
                  disabled={saving}
                  onChange={(value) => set("companyOptionId", value)}
                  onCreate={onCreateOption}
                />
                <OptionSelectWithCreate
                  label="Position"
                  type="position"
                  value={form.positionOptionId}
                  options={options}
                  disabled={saving}
                  onChange={(value) => set("positionOptionId", value)}
                  onCreate={onCreateOption}
                />
                <OptionSelectWithCreate
                  label="Client type"
                  type="client_type"
                  value={form.clientTypeOptionId}
                  options={options}
                  disabled={saving}
                  onChange={(value) => set("clientTypeOptionId", value)}
                  onCreate={onCreateOption}
                />
                <OptionSelectWithCreate
                  label="Status"
                  type="client_status"
                  value={form.clientStatusOptionId}
                  options={options}
                  disabled={saving}
                  onChange={(value) => set("clientStatusOptionId", value)}
                  onCreate={onCreateOption}
                />
              </>
            ) : (
              <InfluencerPlatformsField
                value={form.platformAccounts || []}
                options={platformOptions}
                disabled={saving}
                onChange={(platformAccounts) => set("platformAccounts", platformAccounts)}
                onCreatePlatform={() => setPlatformDialogOpen(true)}
              />
            )}

            <label className="grid gap-1.5 sm:col-span-2">
              <span className="text-[11px] font-bold text-muted-foreground">Notes</span>
              <textarea
                value={form.notes || ""}
                disabled={saving}
                onChange={(event) => set("notes", event.currentTarget.value)}
                placeholder="Anything the team should know about this contact..."
                rows={4}
                className="min-h-[104px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </label>

            {error ? (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs font-medium text-destructive sm:col-span-2">
                {error}
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={saving} onClick={() => void submit()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {contact ? "Save changes" : "Add contact"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={platformDialogOpen} onOpenChange={setPlatformDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create platform</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-1">
            <Input
              autoFocus
              value={platformName}
              onChange={(event) => setPlatformName(event.currentTarget.value)}
              placeholder="e.g. LinkedIn"
              className="rounded-xl"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void createPlatform();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPlatformDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={creatingPlatform || !platformName.trim()} onClick={() => void createPlatform()}>
              <Plus className="h-4 w-4" />
              {creatingPlatform ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
