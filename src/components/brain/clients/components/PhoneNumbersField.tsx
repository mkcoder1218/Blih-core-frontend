import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ContactPhone } from "../types/contact.types";

type Props = {
  value: ContactPhone[];
  disabled?: boolean;
  onChange: (phones: ContactPhone[]) => void;
};

export function PhoneNumbersField({ value, disabled, onChange }: Props) {
  const phones = value.length ? value : [{ number: "", label: "Primary" }];

  const update = (index: number, patch: Partial<ContactPhone>) => {
    onChange(phones.map((phone, itemIndex) => (itemIndex === index ? { ...phone, ...patch } : phone)));
  };

  const remove = (index: number) => {
    const next = phones.filter((_, itemIndex) => itemIndex !== index);
    onChange(next.length ? next : [{ number: "", label: "Primary" }]);
  };

  return (
    <div className="grid gap-2 sm:col-span-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-muted-foreground">Phone numbers *</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 rounded-md px-2 text-[11px]"
          disabled={disabled}
          onClick={() => onChange([...phones, { number: "", label: "Other" }])}
        >
          <Plus className="h-3.5 w-3.5" />
          Add phone
        </Button>
      </div>

      <div className="grid gap-2">
        {phones.map((phone, index) => (
          <div key={phone.id || index} className="grid grid-cols-[110px_minmax(0,1fr)_40px] gap-2">
            <Input
              value={phone.label || ""}
              disabled={disabled}
              onChange={(event) => update(index, { label: event.currentTarget.value })}
              placeholder="Primary"
              className="rounded-md"
            />
            <Input
              type="tel"
              value={phone.number}
              disabled={disabled}
              onChange={(event) => update(index, { number: event.currentTarget.value })}
              placeholder="+251 9..."
              className="rounded-md"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-md text-muted-foreground hover:text-destructive"
              disabled={disabled || phones.length === 1}
              onClick={() => remove(index)}
              aria-label="Remove phone"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
