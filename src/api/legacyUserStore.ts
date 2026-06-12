import { useSyncExternalStore } from "react";

export type LegacyUser = { name: string; email: string; role: string; departmentName?: string | null } | null;

type Listener = () => void;
const listeners = new Set<Listener>();

let lastRaw: string | null = null;
let lastParsed: LegacyUser = null;

function read(): LegacyUser {
  try {
    const raw = localStorage.getItem("blih_core_user");
    if (raw === lastRaw) return lastParsed;
    lastRaw = raw;
    lastParsed = raw ? (JSON.parse(raw) as any) : null;
    return lastParsed;
  } catch {
    lastRaw = null;
    lastParsed = null;
    return null;
  }
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  const handler = () => listener();
  window.addEventListener("storage", handler);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", handler);
  };
}

function emit() {
  for (const l of listeners) l();
}

export function setLegacyUser(user: LegacyUser) {
  if (user) localStorage.setItem("blih_core_user", JSON.stringify(user));
  else localStorage.removeItem("blih_core_user");
  // same-tab notification
  emit();
}

export function useLegacyUser(): LegacyUser {
  return useSyncExternalStore(subscribe, read, read);
}

