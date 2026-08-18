import { icons, Users } from "lucide-react";

const iconMap = icons as Record<string, typeof Users>;
export const CONTACT_ICON_NAMES = Object.keys(iconMap).sort((a, b) => a.localeCompare(b));

export function ContactCategoryIcon({ name, className }: { name?: string | null; className?: string }) {
  const Icon = (name && iconMap[name]) || Users;
  return <Icon className={className} />;
}
