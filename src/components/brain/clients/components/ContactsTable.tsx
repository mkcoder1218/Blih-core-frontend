import {
  Building2,
  Eye,
  Loader2,
  Megaphone,
  Pencil,
  Phone,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BrainContact, ContactKind } from "../types/contact.types";

type Props = {
  kind: ContactKind;
  rows: BrainContact[];
  loading?: boolean;
  error?: string | null;
  onView: (contact: BrainContact) => void;
  onEdit: (contact: BrainContact) => void;
  onDelete: (contact: BrainContact) => void;
};

function compactFollowers(value?: number | null) {
  if (value === null || value === undefined) return null;
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function ContactsTable({ kind, rows, loading, error, onView, onEdit, onDelete }: Props) {
  if (loading) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
        <p className="text-xs font-semibold">Loading contacts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5 sm:p-6">
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-xs font-medium text-destructive">
          {error}
        </div>
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          {kind === "client" ? <Building2 className="h-5 w-5" /> : <Megaphone className="h-5 w-5" />}
        </div>
        <h2 className="mt-3 text-sm font-extrabold">No {kind === "client" ? "clients" : "influencers"} found</h2>
        <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
          Add a contact or adjust the current filters.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] text-left text-xs">
        <thead className="border-b border-border bg-muted/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-5 py-3 sm:px-6">Contact</th>
            <th className="px-4 py-3">Phone</th>
            <th className="px-4 py-3">Field</th>
            <th className="px-4 py-3">Behavior</th>
            <th className="px-4 py-3">{kind === "client" ? "Company / status" : "Platforms"}</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((contact) => (
            <tr key={contact.id} className="transition hover:bg-muted/25">
              <td className="px-5 py-4 sm:px-6">
                <button type="button" className="flex items-center gap-3 text-left" onClick={() => onView(contact)}>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10 text-primary">
                    {contact.profileImageUrl ? (
                      <img src={contact.profileImageUrl} alt="" className="h-full w-full object-cover" />
                    ) : contact.kind === "client" ? (
                      <Building2 className="h-4 w-4" />
                    ) : (
                      <Megaphone className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="max-w-[230px] truncate font-extrabold text-foreground">{contact.name}</p>
                    <p className="mt-1 max-w-[230px] truncate text-[10px] text-muted-foreground">
                      {contact.email || contact.location || "No additional contact info"}
                    </p>
                  </div>
                </button>
              </td>
              <td className="px-4 py-4 text-muted-foreground">
                {contact.phones?.[0]?.number ? (
                  <div>
                    <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                      <Phone className="h-3.5 w-3.5" />
                      {contact.phones[0].number}
                    </span>
                    {contact.phones.length > 1 ? (
                      <p className="mt-1 text-[10px]">+{contact.phones.length - 1} more</p>
                    ) : null}
                  </div>
                ) : (
                  "Not set"
                )}
              </td>
              <td className="px-4 py-4 text-muted-foreground">{contact.field?.label || "Not set"}</td>
              <td className="px-4 py-4">
                {contact.behavior ? (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold"
                    style={{
                      color: contact.behavior.color || undefined,
                      backgroundColor: contact.behavior.color ? `${contact.behavior.color}18` : undefined,
                    }}
                  >
                    {contact.behavior.color ? (
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: contact.behavior.color }} />
                    ) : null}
                    {contact.behavior.label}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Not set</span>
                )}
              </td>
              <td className="px-4 py-4">
                {kind === "client" ? (
                  <div>
                    <p className="font-bold">{contact.company?.label || "No company"}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {contact.clientStatus?.label || contact.clientType?.label || "No status"}
                    </p>
                  </div>
                ) : contact.platformAccounts.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {contact.platformAccounts.slice(0, 3).map((account) => (
                      <span key={account.id || `${account.platformOptionId}-${account.handle}`} className="rounded-lg bg-muted px-2 py-1 text-[10px] font-bold">
                        {account.platform?.label || "Platform"}
                        {compactFollowers(account.followerCount) ? ` · ${compactFollowers(account.followerCount)}` : ""}
                      </span>
                    ))}
                    {contact.platformAccounts.length > 3 ? (
                      <span className="rounded-lg bg-muted px-2 py-1 text-[10px] font-bold">+{contact.platformAccounts.length - 3}</span>
                    ) : null}
                  </div>
                ) : (
                  <span className="text-muted-foreground">No platforms</span>
                )}
              </td>
              <td className="px-4 py-4">
                <div className="flex justify-end gap-1">
                  <Button type="button" size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => onView(contact)}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button type="button" size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => onEdit(contact)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive"
                    onClick={() => onDelete(contact)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
