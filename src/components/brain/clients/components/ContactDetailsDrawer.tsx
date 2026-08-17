import { Building2, Mail, MapPin, Megaphone, Pencil, Phone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BrainContact } from "../types/contact.types";

type Props = {
  contact: BrainContact | null;
  onClose: () => void;
  onEdit: (contact: BrainContact) => void;
};

function Detail({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="grid gap-1">
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-xs font-semibold text-foreground">{value}</span>
    </div>
  );
}

export function ContactDetailsDrawer({ contact, onClose, onEdit }: Props) {
  if (!contact) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close contact details"
        className="absolute inset-0 bg-black/35 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-border bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {contact.kind === "client" ? "Client" : "Influencer"}
            </p>
            <h2 className="mt-0.5 text-base font-extrabold">Contact details</h2>
          </div>
          <Button type="button" variant="ghost" size="icon" className="rounded-xl" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 text-primary">
              {contact.profileImageUrl ? (
                <img src={contact.profileImageUrl} alt="" className="h-full w-full object-cover" />
              ) : contact.kind === "client" ? (
                <Building2 className="h-6 w-6" />
              ) : (
                <Megaphone className="h-6 w-6" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-xl font-extrabold">{contact.name}</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {contact.field ? (
                  <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold">{contact.field.label}</span>
                ) : null}
                {contact.behavior ? (
                  <span
                    className="rounded-full px-2.5 py-1 text-[10px] font-bold"
                    style={{
                      color: contact.behavior.color || undefined,
                      backgroundColor: contact.behavior.color ? `${contact.behavior.color}18` : undefined,
                    }}
                  >
                    {contact.behavior.label}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <section className="mt-6 rounded-2xl border border-border p-4">
            <h4 className="text-xs font-extrabold">Contact</h4>
            <div className="mt-4 grid gap-4">
              {contact.email ? (
                <div className="flex items-center gap-2 text-xs">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">{contact.email}</span>
                </div>
              ) : null}
              {contact.location ? (
                <div className="flex items-center gap-2 text-xs">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">{contact.location}</span>
                </div>
              ) : null}
              <div className="grid gap-2">
                {contact.phones.map((phone) => (
                  <div key={phone.id || phone.number} className="flex items-center gap-2 text-xs">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{phone.number}</span>
                    {phone.label ? <span className="text-[10px] text-muted-foreground">{phone.label}</span> : null}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {contact.kind === "client" ? (
            <section className="mt-4 rounded-2xl border border-border p-4">
              <h4 className="text-xs font-extrabold">Client profile</h4>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <Detail label="Company" value={contact.company?.label} />
                <Detail label="Position" value={contact.position?.label} />
                <Detail label="Client type" value={contact.clientType?.label} />
                <Detail label="Status" value={contact.clientStatus?.label} />
              </div>
            </section>
          ) : (
            <section className="mt-4 rounded-2xl border border-border p-4">
              <h4 className="text-xs font-extrabold">Influencer platforms</h4>
              <div className="mt-3 grid gap-3">
                {contact.platformAccounts.length ? (
                  contact.platformAccounts.map((account) => (
                    <div key={account.id || `${account.platformOptionId}-${account.handle}`} className="rounded-xl bg-muted/40 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-extrabold">{account.platform?.label || "Platform"}</p>
                        {account.followerCount !== null && account.followerCount !== undefined ? (
                          <span className="text-[10px] font-bold text-muted-foreground">
                            {new Intl.NumberFormat("en").format(account.followerCount)} followers
                          </span>
                        ) : null}
                      </div>
                      {account.handle ? <p className="mt-1 text-[11px] font-semibold">{account.handle}</p> : null}
                      {account.profileUrl ? (
                        <a
                          href={account.profileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 block truncate text-[10px] font-semibold text-primary hover:underline"
                        >
                          {account.profileUrl}
                        </a>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">No platform accounts added.</p>
                )}
              </div>
            </section>
          )}

          {contact.notes ? (
            <section className="mt-4 rounded-2xl border border-border p-4">
              <h4 className="text-xs font-extrabold">Notes</h4>
              <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-muted-foreground">{contact.notes}</p>
            </section>
          ) : null}
        </div>

        <div className="border-t border-border p-4">
          <Button type="button" className="w-full rounded-xl" onClick={() => onEdit(contact)}>
            <Pencil className="h-4 w-4" />
            Edit contact
          </Button>
        </div>
      </aside>
    </div>
  );
}
