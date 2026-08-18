import { useEffect, useMemo, useState } from "react";
import { Archive, GripVertical, Plus, RotateCcw, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  archiveContactCategory,
  archiveContactCategoryField,
  createContactCategory,
  createContactCategoryField,
  listContactCategories,
  reorderContactCategoryFields,
  updateContactCategory,
  updateContactCategoryField,
} from "../api/contactCategoriesApi";
import type { ContactCategory, ContactCategoryField, ContactFieldOption, ContactFieldType } from "../types/contactCategory.types";
import { CONTACT_ICON_NAMES, ContactCategoryIcon } from "./ContactCategoryIcon";

const FIELD_TYPES: Array<{ value: ContactFieldType; label: string }> = [
  { value: "text", label: "Text" },
  { value: "long_text", label: "Long text / Notes" },
  { value: "number", label: "Number" },
  { value: "phone", label: "Phone" },
  { value: "email", label: "Email" },
  { value: "date", label: "Date" },
  { value: "url", label: "URL" },
  { value: "dropdown", label: "Dropdown" },
  { value: "multi_select", label: "Multi-select" },
  { value: "checkbox", label: "Checkbox" },
];

type BuilderField = {
  rowKey: string;
  id?: string;
  label: string;
  type: ContactFieldType;
  isRequired: boolean;
  showInTable: boolean;
  options: ContactFieldOption[];
  isSystem: boolean;
  isArchived: boolean;
};

type Props = {
  open: boolean;
  category?: ContactCategory | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (category: ContactCategory) => void;
  onArchived: (categoryId: string) => void;
};

const tempId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const nameField = (): BuilderField => ({ rowKey: "system-name", label: "Name", type: "text", isRequired: true, showInTable: true, options: [], isSystem: true, isArchived: false });
const newField = (): BuilderField => ({ rowKey: tempId("field"), label: "", type: "text", isRequired: false, showInTable: true, options: [], isSystem: false, isArchived: false });
const fromApi = (field: ContactCategoryField): BuilderField => ({ rowKey: field.id, id: field.id, label: field.label, type: field.type, isRequired: field.isRequired, showInTable: field.showInTable, options: field.options || [], isSystem: field.isSystem, isArchived: field.isArchived });
const errorText = (error: unknown) => (error as any)?.response?.data?.message || (error as Error | undefined)?.message || "Could not save the contact category.";

export function ContactCategoryBuilderModal({ open, category, onOpenChange, onSaved, onArchived }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [iconName, setIconName] = useState("Users");
  const [iconSearch, setIconSearch] = useState("");
  const [fields, setFields] = useState<BuilderField[]>([nameField()]);
  const [dragged, setDragged] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(category?.name || "");
    setDescription(category?.description || "");
    setIconName(category?.iconName || "Users");
    setIconSearch("");
    const loaded = category?.fields?.map(fromApi) || [];
    setFields(loaded.some((field) => field.isSystem) ? loaded : [nameField(), ...loaded]);
    setDragged(null);
    setBusy(false);
    setError("");
  }, [open, category]);

  const active = useMemo(() => {
    const rows = fields.filter((field) => !field.isArchived);
    const system = rows.find((field) => field.isSystem);
    return system ? [system, ...rows.filter((field) => !field.isSystem)] : rows;
  }, [fields]);
  const archived = useMemo(() => fields.filter((field) => field.isArchived), [fields]);
  const icons = useMemo(() => {
    const search = iconSearch.trim().toLowerCase();
    return CONTACT_ICON_NAMES.filter((icon) => !search || icon.toLowerCase().includes(search)).slice(0, 100);
  }, [iconSearch]);

  const patch = (rowKey: string, value: Partial<BuilderField>) => setFields((rows) => rows.map((field) => field.rowKey === rowKey ? { ...field, ...value } : field));
  const remove = (field: BuilderField) => field.id ? patch(field.rowKey, { isArchived: true }) : setFields((rows) => rows.filter((item) => item.rowKey !== field.rowKey));

  const move = (from: string, to: string) => {
    if (from === to) return;
    setFields((rows) => {
      const current = rows.filter((field) => !field.isArchived);
      const fromIndex = current.findIndex((field) => field.rowKey === from);
      const toIndex = current.findIndex((field) => field.rowKey === to);
      if (fromIndex <= 0 || toIndex <= 0) return rows;
      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return [...next, ...rows.filter((field) => field.isArchived)];
    });
  };

  const save = async () => {
    if (!name.trim()) return setError("Category name is required.");
    if (active.some((field) => !field.isSystem && !field.label.trim())) return setError("Every field needs a name.");
    setBusy(true);
    setError("");
    try {
      if (!category) {
        const created = await createContactCategory({
          name: name.trim(),
          iconName,
          description: description.trim() || null,
          fields: active.filter((field) => !field.isSystem).map((field) => ({
            label: field.label.trim(), type: field.type, isRequired: field.isRequired, showInTable: field.showInTable, options: field.options,
          })),
        });
        onSaved(created);
        onOpenChange(false);
        return;
      }

      await updateContactCategory(category.id, { name: name.trim(), iconName, description: description.trim() || null });
      const ids = new Map<string, string>();
      for (const field of fields) {
        if (field.id) ids.set(field.rowKey, field.id);
        if (field.isSystem) {
          if (field.id) await updateContactCategoryField(category.id, field.id, { showInTable: true });
          continue;
        }
        if (field.id && field.isArchived) {
          await archiveContactCategoryField(category.id, field.id);
          continue;
        }
        if (field.isArchived) continue;
        const payload = { label: field.label.trim(), type: field.type, isRequired: field.isRequired, showInTable: field.showInTable, options: field.options };
        if (field.id) {
          const updated = await updateContactCategoryField(category.id, field.id, { ...payload, isArchived: false });
          ids.set(field.rowKey, updated.id);
        } else {
          const created = await createContactCategoryField(category.id, payload);
          ids.set(field.rowKey, created.id);
        }
      }
      const ordered = active.map((field) => ids.get(field.rowKey)).filter((id): id is string => Boolean(id));
      if (ordered.length === active.length) await reorderContactCategoryFields(category.id, ordered);
      const reloaded = (await listContactCategories(true)).find((item) => item.id === category.id);
      if (!reloaded) throw new Error("Saved category could not be reloaded.");
      onSaved(reloaded);
      onOpenChange(false);
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setBusy(false);
    }
  };

  const archiveCategory = async () => {
    if (!category || !window.confirm(`Archive “${category.name}”? Existing contacts and field data will be preserved.`)) return;
    setBusy(true);
    setError("");
    try {
      await archiveContactCategory(category.id);
      onArchived(category.id);
      onOpenChange(false);
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader><DialogTitle>{category ? `Manage ${category.name}` : "Create contact category"}</DialogTitle></DialogHeader>

        <div className="grid gap-5 py-1">
          <div className="grid gap-4 rounded-xl border border-border bg-muted/10 p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
            <div className="grid gap-3">
              <label className="grid gap-1.5">
                <span className="text-[11px] font-extrabold text-muted-foreground">Category name</span>
                <Input value={name} onChange={(event) => setName(event.currentTarget.value)} placeholder="Partners" />
              </label>
              <label className="grid gap-1.5">
                <span className="text-[11px] font-extrabold text-muted-foreground">Description</span>
                <textarea value={description} onChange={(event) => setDescription(event.currentTarget.value)} placeholder="Optional description" rows={3} className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/20" />
              </label>
            </div>
            <div className="rounded-lg border border-border bg-background p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><ContactCategoryIcon name={iconName} className="h-5 w-5" /></div>
                <div><p className="text-xs font-extrabold">Lucide icon</p><p className="text-[10px] text-muted-foreground">{iconName}</p></div>
              </div>
              <div className="relative mt-3">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input value={iconSearch} onChange={(event) => setIconSearch(event.currentTarget.value)} placeholder="Search Lucide icons..." className="h-9 pl-8 text-xs" />
              </div>
              <div className="mt-3 grid max-h-40 grid-cols-8 gap-1 overflow-y-auto sm:grid-cols-10">
                {icons.map((icon) => (
                  <button key={icon} type="button" title={icon} onClick={() => setIconName(icon)} className={`flex h-8 w-8 items-center justify-center rounded-md border transition ${icon === iconName ? "border-primary bg-primary/10 text-primary" : "border-transparent text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground"}`}>
                    <ContactCategoryIcon name={icon} className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div><p className="text-sm font-extrabold">Fields</p><p className="text-[10px] text-muted-foreground">Drag fields to reorder them. The same order is used in forms and tables.</p></div>
              <Button type="button" size="sm" variant="outline" onClick={() => setFields((rows) => [...rows, newField()])}><Plus className="h-4 w-4" />Add field</Button>
            </div>
            <div className="grid gap-2">
              {active.map((field) => (
                <FieldEditor key={field.rowKey} field={field} dragging={dragged === field.rowKey} onPatch={(value) => patch(field.rowKey, value)} onArchive={() => remove(field)} onDragStart={() => setDragged(field.rowKey)} onDragEnd={() => setDragged(null)} onDrop={() => { if (dragged) move(dragged, field.rowKey); setDragged(null); }} />
              ))}
            </div>
          </div>

          {archived.length ? (
            <div className="rounded-xl border border-dashed border-border p-4">
              <p className="text-xs font-extrabold">Archived fields</p><p className="text-[10px] text-muted-foreground">Historical contact values are preserved.</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {archived.map((field) => (
                  <div key={field.rowKey} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5">
                    <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{field.label}</p><p className="text-[10px] text-muted-foreground">{FIELD_TYPES.find((item) => item.value === field.type)?.label}</p></div>
                    <Button type="button" size="sm" variant="ghost" onClick={() => patch(field.rowKey, { isArchived: false })}><RotateCcw className="h-3.5 w-3.5" />Restore</Button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {error ? <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-xs font-semibold text-destructive">{error}</div> : null}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <div>{category ? <Button type="button" variant="ghost" className="text-destructive hover:text-destructive" disabled={busy} onClick={() => void archiveCategory()}><Archive className="h-4 w-4" />Archive category</Button> : null}</div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="button" disabled={busy} onClick={() => void save()}>{busy ? "Saving..." : category ? "Save changes" : "Create category"}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FieldEditor({ field, dragging, onPatch, onArchive, onDragStart, onDragEnd, onDrop }: {
  field: BuilderField;
  dragging: boolean;
  onPatch: (value: Partial<BuilderField>) => void;
  onArchive: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDrop: () => void;
}) {
  const [optionName, setOptionName] = useState("");
  const hasOptions = field.type === "dropdown" || field.type === "multi_select";
  const addOption = () => {
    const label = optionName.trim();
    if (!label || field.options.some((item) => item.label.toLowerCase() === label.toLowerCase())) return;
    onPatch({ options: [...field.options, { id: crypto.randomUUID(), label }] });
    setOptionName("");
  };

  return (
    <div draggable={!field.isSystem} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); onDrop(); }} className={`rounded-xl border bg-card p-3 transition ${dragging ? "border-primary/50 opacity-60" : "border-border"}`}>
      <div className="grid gap-3 md:grid-cols-[28px_minmax(160px,1fr)_170px_auto] md:items-start">
        <div className={`mt-2 hidden h-8 items-center justify-center text-muted-foreground md:flex ${field.isSystem ? "opacity-30" : "cursor-grab"}`}><GripVertical className="h-4 w-4" /></div>
        <label className="grid gap-1"><span className="text-[10px] font-bold text-muted-foreground">Field name</span><Input value={field.label} disabled={field.isSystem} onChange={(event) => onPatch({ label: event.currentTarget.value })} placeholder="Company" className="h-9 text-xs" /></label>
        <label className="grid gap-1"><span className="text-[10px] font-bold text-muted-foreground">Type</span>
          <Select value={field.type} disabled={field.isSystem} onValueChange={(value) => onPatch({ type: value as ContactFieldType, options: value === "dropdown" || value === "multi_select" ? field.options : [] })}>
            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger><SelectContent>{FIELD_TYPES.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
          </Select>
        </label>
        <div className="flex flex-wrap items-end gap-3 pt-5">
          <label className="inline-flex items-center gap-2 text-[11px] font-bold"><input type="checkbox" checked={field.isRequired} disabled={field.isSystem} onChange={(event) => onPatch({ isRequired: event.currentTarget.checked })} className="h-4 w-4 accent-primary" />Required</label>
          <label className="inline-flex items-center gap-2 text-[11px] font-bold"><input type="checkbox" checked={field.showInTable} disabled={field.isSystem} onChange={(event) => onPatch({ showInTable: event.currentTarget.checked })} className="h-4 w-4 accent-primary" />Show in table</label>
          {!field.isSystem ? <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={onArchive}>{field.id ? <Archive className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}</Button> : null}
        </div>
      </div>
      {hasOptions ? (
        <div className="mt-3 rounded-lg border border-border bg-muted/10 p-3 md:ml-7">
          <div className="flex gap-2"><Input value={optionName} onChange={(event) => setOptionName(event.currentTarget.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addOption(); } }} placeholder="Add option" className="h-8 text-xs" /><Button type="button" size="sm" variant="outline" className="h-8" onClick={addOption}><Plus className="h-3.5 w-3.5" />Add</Button></div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {field.options.map((option) => <span key={option.id} className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[10px] font-bold">{option.label}<button type="button" className="text-muted-foreground hover:text-destructive" onClick={() => onPatch({ options: field.options.filter((item) => item.id !== option.id) })} aria-label={`Remove ${option.label}`}><X className="h-3 w-3" /></button></span>)}
            {!field.options.length ? <span className="text-[10px] text-muted-foreground">No options yet.</span> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
