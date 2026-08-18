import { useEffect, useMemo, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ContactCategory, ContactCategoryField, CustomContact, CustomContactInput } from "../types/contactCategory.types";

const NONE = "__none__";

type Props = {
  open: boolean;
  category: ContactCategory;
  contact?: CustomContact | null;
  saving?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CustomContactInput) => Promise<void>;
};

const defaultValue = (field: ContactCategoryField): unknown => field.type === "checkbox" ? false : field.type === "multi_select" ? [] : "";
const requestError = (error: unknown) => (error as any)?.response?.data?.message || (error as Error | undefined)?.message || "Could not save the contact.";

export function DynamicContactFormModal({ open, category, contact, saving = false, onOpenChange, onSubmit }: Props) {
  const fields = useMemo(() => [...(category.fields || [])].filter((field) => !field.isArchived).sort((a, b) => a.sortOrder - b.sortOrder), [category.fields]);
  const [name, setName] = useState("");
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const next: Record<string, unknown> = {};
    for (const field of fields) {
      if (field.isSystem || field.key === "name") continue;
      next[field.key] = contact?.values?.[field.key] ?? defaultValue(field);
    }
    setName(contact?.name || "");
    setValues(next);
    setError("");
  }, [open, contact, fields]);

  const submit = async () => {
    if (!name.trim()) return setError("Name is required.");
    for (const field of fields) {
      if (field.isSystem || !field.isRequired) continue;
      const value = values[field.key];
      if (value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) return setError(`${field.label} is required.`);
    }
    setError("");
    try {
      await onSubmit({ name: name.trim(), values });
    } catch (cause) {
      setError(requestError(cause));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>{contact ? `Edit ${category.name} contact` : `Add ${category.name} contact`}</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-1 sm:grid-cols-2">
          <label className="grid gap-1.5 sm:col-span-2">
            <span className="text-[11px] font-extrabold text-muted-foreground">Name <span className="text-destructive">*</span></span>
            <Input value={name} onChange={(event) => setName(event.currentTarget.value)} placeholder="Contact name" autoFocus />
          </label>
          {fields.filter((field) => !field.isSystem && field.key !== "name").map((field) => (
            <DynamicField key={field.id} field={field} value={values[field.key]} onChange={(value) => setValues((current) => ({ ...current, [field.key]: value }))} />
          ))}
        </div>
        {error ? <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-xs font-semibold text-destructive">{error}</div> : null}
        <DialogFooter>
          <Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" disabled={saving} onClick={() => void submit()}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{saving ? "Saving..." : contact ? "Save changes" : "Add contact"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DynamicField({ field, value, onChange }: { field: ContactCategoryField; value: unknown; onChange: (value: unknown) => void }) {
  const label = <span className="text-[11px] font-extrabold text-muted-foreground">{field.label} {field.isRequired ? <span className="text-destructive">*</span> : null}</span>;
  if (field.type === "long_text") return <label className="grid gap-1.5 sm:col-span-2">{label}<textarea value={String(value ?? "")} onChange={(event) => onChange(event.currentTarget.value)} rows={4} className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/20" /></label>;
  if (field.type === "dropdown") {
    const selected = typeof value === "string" && value ? value : NONE;
    return <label className="grid gap-1.5">{label}<Select value={selected} onValueChange={(next) => onChange(next === NONE ? "" : next)}><SelectTrigger><SelectValue placeholder="Select option" /></SelectTrigger><SelectContent>{!field.isRequired ? <SelectItem value={NONE}>None</SelectItem> : null}{field.options.map((option) => <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>)}</SelectContent></Select></label>;
  }
  if (field.type === "multi_select") {
    const selected = new Set(Array.isArray(value) ? value.map(String) : []);
    return <fieldset className="grid gap-2 rounded-lg border border-border p-3 sm:col-span-2"><legend className="px-1 text-[11px] font-extrabold text-muted-foreground">{field.label} {field.isRequired ? <span className="text-destructive">*</span> : null}</legend><div className="grid gap-2 sm:grid-cols-2">{field.options.map((option) => <label key={option.id} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-semibold"><input type="checkbox" checked={selected.has(option.id)} onChange={(event) => { const next = new Set(selected); if (event.currentTarget.checked) next.add(option.id); else next.delete(option.id); onChange(Array.from(next)); }} className="h-4 w-4 accent-primary" />{option.label}</label>)}</div>{!field.options.length ? <p className="text-[10px] text-muted-foreground">No options configured.</p> : null}</fieldset>;
  }
  if (field.type === "checkbox") return <label className="flex min-h-10 items-center gap-2 self-end rounded-md border border-border px-3 py-2 text-xs font-bold"><input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.currentTarget.checked)} className="h-4 w-4 accent-primary" />{field.label}</label>;
  const type = field.type === "number" ? "number" : field.type === "email" ? "email" : field.type === "date" ? "date" : field.type === "url" ? "url" : field.type === "phone" ? "tel" : "text";
  return <label className="grid gap-1.5">{label}<Input type={type} value={value === null || value === undefined ? "" : String(value)} onChange={(event) => onChange(event.currentTarget.value)} placeholder={field.type === "phone" ? "+251..." : undefined} /></label>;
}
