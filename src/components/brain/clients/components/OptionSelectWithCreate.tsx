import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
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

const NONE = "__none__";

type Props = {
  label: string;
  type: ContactOptionType;
  value?: string | null;
  options: ContactOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  onChange: (value: string | null) => void;
  onCreate: (input: {
    type: ContactOptionType;
    label: string;
    color?: string | null;
  }) => Promise<ContactOption>;
};

export function OptionSelectWithCreate({
  label,
  type,
  value,
  options,
  placeholder = "Select",
  required,
  disabled,
  onChange,
  onCreate,
}: Props) {
  const [createOpen, setCreateOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [color, setColor] = useState<string>(BEHAVIOR_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const filtered = useMemo(
    () => options.filter((option) => option.type === type),
    [options, type],
  );

  const submit = async () => {
    const clean = newLabel.trim();
    if (!clean) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const created = await onCreate({
        type,
        label: clean,
        color: type === "behavior" ? color : null,
      });
      onChange(created.id);
      setNewLabel("");
      setCreateOpen(false);
    } catch (cause) {
      setError(
        (cause as any)?.response?.data?.message ||
          (cause as Error)?.message ||
          "Could not create option.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-1.5">
      <span className="text-[11px] font-bold text-muted-foreground">
        {label}{required ? " *" : ""}
      </span>
      <div className="flex gap-2">
        <Select
          value={value || NONE}
          disabled={disabled}
          onValueChange={(next) => onChange(next === NONE ? null : next)}
        >
          <SelectTrigger className="h-10 min-w-0 flex-1 rounded-xl">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Not set</SelectItem>
            {filtered.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                <span className="inline-flex items-center gap-2">
                  {option.color ? (
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: option.color }}
                    />
                  ) : null}
                  {option.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10 shrink-0 rounded-xl"
          disabled={disabled}
          onClick={() => {
            setError("");
            setCreateOpen(true);
          }}
          aria-label={`Create ${label}`}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create {label.toLowerCase()}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-1">
            <label className="grid gap-1.5">
              <span className="text-[11px] font-bold text-muted-foreground">Name *</span>
              <Input
                autoFocus
                value={newLabel}
                onChange={(event) => setNewLabel(event.currentTarget.value)}
                placeholder={`New ${label.toLowerCase()}`}
                className="rounded-xl"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void submit();
                  }
                }}
              />
            </label>

            {type === "behavior" ? (
              <div className="grid gap-2">
                <span className="text-[11px] font-bold text-muted-foreground">Color</span>
                <div className="flex flex-wrap gap-2">
                  {BEHAVIOR_COLORS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={`h-8 w-8 rounded-full border-2 transition ${
                        color === item ? "scale-110 border-foreground" : "border-transparent"
                      }`}
                      style={{ backgroundColor: item }}
                      onClick={() => setColor(item)}
                      aria-label={`Use color ${item}`}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {error ? (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs font-medium text-destructive">
                {error}
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={saving} onClick={() => void submit()}>
              {saving ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
