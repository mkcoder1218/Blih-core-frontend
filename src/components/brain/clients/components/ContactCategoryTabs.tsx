import { Building2, Megaphone, Plus } from "lucide-react";
import type { ContactCategory } from "../types/contactCategory.types";
import { ContactCategoryIcon } from "./ContactCategoryIcon";

type Props = {
  activeKey: string;
  categories: ContactCategory[];
  canCreateCategory?: boolean;
  onChange: (key: string) => void;
  onAddCategory: () => void;
};

function tabClass(active: boolean) {
  return `inline-flex h-9 shrink-0 items-center gap-2 rounded-md px-3.5 text-xs font-extrabold transition ${
    active
      ? "bg-background text-foreground shadow-sm ring-1 ring-border/70"
      : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
  }`;
}

export function ContactCategoryTabs({ activeKey, categories, canCreateCategory = false, onChange, onAddCategory }: Props) {
  return (
    <div className="overflow-x-auto border-b border-border px-5 pt-4 sm:px-6">
      <div className="flex min-w-max items-center gap-1 rounded-lg bg-muted p-1">
        <button type="button" className={tabClass(activeKey === "client")} onClick={() => onChange("client")}>
          <Building2 className="h-3.5 w-3.5" />
          Clients
        </button>
        <button type="button" className={tabClass(activeKey === "influencer")} onClick={() => onChange("influencer")}>
          <Megaphone className="h-3.5 w-3.5" />
          Influencers
        </button>
        {categories.map((category) => (
          <button key={category.id} type="button" className={tabClass(activeKey === category.id)} onClick={() => onChange(category.id)}>
            <ContactCategoryIcon name={category.iconName} className="h-3.5 w-3.5" />
            {category.name}
          </button>
        ))}
        {canCreateCategory ? (
          <button
            type="button"
            onClick={onAddCategory}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-background hover:text-foreground"
            aria-label="Create contact category"
            title="Create contact category"
          >
            <Plus className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
