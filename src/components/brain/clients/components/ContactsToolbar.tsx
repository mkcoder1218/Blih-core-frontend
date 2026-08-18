import { Building2, Megaphone, Plus, Search, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ContactKind, ContactOption } from "../types/contact.types";
import { uniqueOptionsOfType } from "../utils/contactOptions";

const ALL = "__all__";

type Props = {
  kind: ContactKind;
  count: number;
  search: string;
  fieldOptionId: string | null;
  behaviorOptionId: string | null;
  clientStatusOptionId: string | null;
  options: ContactOption[];
  showKindTabs?: boolean;
  onKindChange: (kind: ContactKind) => void;
  onSearchChange: (value: string) => void;
  onFieldChange: (value: string | null) => void;
  onBehaviorChange: (value: string | null) => void;
  onClientStatusChange: (value: string | null) => void;
  onAdd: () => void;
  onManageOptions: () => void;
};

export function ContactsToolbar({
  kind,
  count,
  search,
  fieldOptionId,
  behaviorOptionId,
  clientStatusOptionId,
  options,
  showKindTabs = true,
  onKindChange,
  onSearchChange,
  onFieldChange,
  onBehaviorChange,
  onClientStatusChange,
  onAdd,
  onManageOptions,
}: Props) {
  const fields = uniqueOptionsOfType(options, "field");
  const behaviors = uniqueOptionsOfType(options, "behavior");
  const statuses = uniqueOptionsOfType(options, "client_status");

  return (
    <>
      <div className="flex flex-col gap-4 border-b border-border px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {kind === "client" ? <Building2 className="h-5 w-5" /> : <Megaphone className="h-5 w-5" />}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-extrabold tracking-tight">Contacts</h1>
            <p className="mt-1 max-w-2xl text-xs font-medium leading-5 text-muted-foreground">
              One Brain directory for company clients and influencer relationships.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-lg border border-border bg-muted/30 px-3.5 py-2 text-right">
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              {kind === "client" ? "Clients" : "Influencers"}
            </p>
            <p className="text-sm font-extrabold">{count}</p>
          </div>
          <Button type="button" size="sm" variant="outline" className="rounded-md" onClick={onManageOptions}>
            <Settings2 className="h-4 w-4" />
            Manage options
          </Button>
          <Button type="button" size="sm" className="rounded-md" onClick={onAdd}>
            <Plus className="h-4 w-4" />
            Add contact
          </Button>
        </div>
      </div>

      {showKindTabs ? (
        <div className="border-b border-border px-5 pt-4 sm:px-6">
          <div className="inline-flex rounded-lg bg-muted p-1">
            <button
              type="button"
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs font-extrabold transition ${
                kind === "client" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => onKindChange("client")}
            >
              <Building2 className="h-3.5 w-3.5" />
              Clients
            </button>
            <button
              type="button"
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs font-extrabold transition ${
                kind === "influencer" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => onKindChange("influencer")}
            >
              <Megaphone className="h-3.5 w-3.5" />
              Influencers
            </button>
          </div>
        </div>
      ) : null}

      <div className={`grid gap-3 border-b border-border px-5 py-4 sm:px-6 ${kind === "client" ? "lg:grid-cols-[minmax(260px,1fr)_180px_180px_180px]" : "lg:grid-cols-[minmax(260px,1fr)_200px_200px]"}`}>
        <label className="grid gap-1.5">
          <span className="text-[11px] font-bold text-muted-foreground">Search</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => onSearchChange(event.currentTarget.value)}
              placeholder="Search name, phone, company, platform..."
              className="h-10 rounded-md pl-9"
            />
          </div>
        </label>

        <FilterSelect
          label="Field"
          allLabel="All fields"
          value={fieldOptionId}
          options={fields}
          onChange={onFieldChange}
        />
        <FilterSelect
          label="Behavior"
          allLabel="All behaviors"
          value={behaviorOptionId}
          options={behaviors}
          onChange={onBehaviorChange}
        />
        {kind === "client" ? (
          <FilterSelect
            label="Status"
            allLabel="All statuses"
            value={clientStatusOptionId}
            options={statuses}
            onChange={onClientStatusChange}
          />
        ) : null}
      </div>
    </>
  );
}

function FilterSelect({
  label,
  allLabel,
  value,
  options,
  onChange,
}: {
  label: string;
  allLabel: string;
  value: string | null;
  options: ContactOption[];
  onChange: (value: string | null) => void;
}) {
  const selectedLabel = value
    ? options.find((option) => option.id === value)?.label || allLabel
    : allLabel;

  return (
    <label className="grid gap-1.5">
      <span className="text-[11px] font-bold text-muted-foreground">{label}</span>
      <Select value={value || ALL} onValueChange={(next) => onChange(next === ALL ? null : next)}>
        <SelectTrigger className="h-10 rounded-md">
          <SelectValue>{selectedLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{allLabel}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id} textValue={option.label}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}
