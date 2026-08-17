import type { ContactOption, ContactOptionType } from "../types/contact.types";

function normalizeLabel(label: string) {
  return label.trim().toLocaleLowerCase();
}

export function optionsOfType(
  options: ContactOption[],
  type: ContactOptionType,
): ContactOption[] {
  return options.filter((option) => option.type === type);
}

export function uniqueOptionsByLabel(options: ContactOption[]): ContactOption[] {
  const seen = new Set<string>();

  return options.filter((option) => {
    const key = `${option.type}:${normalizeLabel(option.label)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function uniqueOptionsOfType(
  options: ContactOption[],
  type: ContactOptionType,
): ContactOption[] {
  return uniqueOptionsByLabel(optionsOfType(options, type));
}

export function optionById(
  options: ContactOption[],
  id?: string | null,
): ContactOption | null {
  if (!id) return null;
  return options.find((option) => option.id === id) || null;
}
