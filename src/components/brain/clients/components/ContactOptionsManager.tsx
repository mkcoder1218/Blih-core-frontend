import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
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
import {
  BEHAVIOR_COLORS,
  type ContactOption,
  type ContactOptionType,
} from "../types/contact.types";
import { uniqueOptionsOfType } from "../utils/contactOptions";

const TYPES: Array<{ type: ContactOptionType; label: string }> = [
  { type: "field", label: "Fields" },
  { type: "behavior", label: "Behaviors" },
  { type: "platform", label: "Platforms" },
  { type: "client_status", label: "Client statuses" },
  { type: "client_type", label: "Client types" },
  { type: "position", label: "Positions" },
  { type: "company", label: "Companies" },
];

type Props = {
  open: boolean;
  options: ContactOption[];
  onOpenChange: (open: boolean) => void;
  onCreate: (input: {
    type: ContactOptionType;
    label: string;
    color?: string | null;
  }) => Promise<ContactOption>;
  onUpdate: (id: string, input: { label?: string; color?: string | null }) => Promise<ContactOption>;
  onDelete: (id: string) => Promise<void>;
};

export function ContactOptionsManager({
  open,
  options,
  onOpenChange,
  onCreate,
  onUpdate,
  onDelete,
}: Props) {
  const [type, setType] = useState<ContactOptionType>("field");
  const [label, setLabel] = useState("");
  const [color, setColor] = useState<string>(BEHAVIOR_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const rows = useMemo(
    () => uniqueOptionsOfType(options, type),
    [options, type],
  );

  const resetEditor = () => {
    setEditingId(null);
    setLabel("");
    setColor(BEHAVIOR_COLORS[0]);
    setError("");
  };

  const save = async () => {
    const clean = label.trim();
    if (!clean) {
      setError("Name is required.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (editingId) {
        await onUpdate(editingId, {
          label: clean,
          color: type === "behavior" ? color : null,
        });
      } else {
        await onCreate({
          type,
          label: clean,
          color: type === "behavior" ? color : null,
        });
      }
      resetEditor();
    } catch (cause) {
      setError(
        (cause as any)?.response?.data?.message ||
          (cause as Error)?.message ||
          "Could not save option.",
      );
    } finally {
      setBusy(false);
    }
  };

  const remove = async (option: ContactOption) => {
    if (!window.confirm(`Remove “${option.label}”? Existing contacts will not be deleted.`)) return;
    setBusy(true);
    setError("");
    try {
      await onDelete(option.id);
      if (editingId === option.id) resetEditor();
    } catch (cause) {
      setError(
        (cause as any)?.response?.data?.message ||
          (cause as Error)?.message ||
          "Could not remove option.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) resetEditor();
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage contact options</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-1">
          <Select
            value={type}
            onValueChange={(value) => {
              setType(value as ContactOptionType);
              resetEditor();
            }}
          >
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPES.map((item) => (
                <SelectItem key={item.type} value={item.type}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="rounded-2xl border border-border bg-muted/15 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-extrabold">
                  {editingId ? "Edit option" : "Create option"}
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  These values appear in contact dropdowns for everyone in the company.
                </p>
              </div>
              {editingId ? (
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={resetEditor}>
                  <X className="h-4 w-4" />
                </Button>
              ) : null}
            </div>

            <div className="mt-3 flex gap-2">
              <Input
                value={label}
                onChange={(event) => setLabel(event.currentTarget.value)}
                placeholder="Option name"
                className="rounded-xl"
              />
              <Button type="button" className="rounded-xl" disabled={busy} onClick={() => void save()}>
                <Plus className="h-4 w-4" />
                {editingId ? "Update" : "Add"}
              </Button>
            </div>

            {type === "behavior" ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {BEHAVIOR_COLORS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`h-7 w-7 rounded-full border-2 transition ${
                      color === item ? "scale-110 border-foreground" : "border-transparent"
                    }`}
                    style={{ backgroundColor: item }}
                    onClick={() => setColor(item)}
                    aria-label={`Use color ${item}`}
                  />
                ))}
              </div>
            ) : null}

            {error ? (
              <p className="mt-3 rounded-xl border border-destructive/20 bg-destructive/5 p-2.5 text-[11px] font-semibold text-destructive">
                {error}
              </p>
            ) : null}
          </div>

          <div className="max-h-[310px] overflow-y-auto rounded-2xl border border-border">
            {rows.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">No options yet.</div>
            ) : (
              <div className="divide-y divide-border">
                {rows.map((option) => (
                  <div key={option.id} className="flex items-center gap-3 px-4 py-3">
                    {option.color ? (
                      <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: option.color }} />
                    ) : null}
                    <span className="min-w-0 flex-1 truncate text-xs font-bold">{option.label}</span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-lg"
                      disabled={busy}
                      onClick={() => {
                        setEditingId(option.id);
                        setLabel(option.label);
                        setColor(option.color || BEHAVIOR_COLORS[0]);
                        setError("");
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive"
                      disabled={busy}
                      onClick={() => void remove(option)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
