export const PROFILE_PAGE_SIZE = 10;

export function unwrap<T = any>(response: any): T {
  return (response?.data?.data ?? response?.data) as T;
}

export function display(value: unknown) {
  if (value === null || value === undefined) return "-";
  const text = String(value).trim();
  return text || "-";
}

export function initials(value: string) {
  return display(value)
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function formatDate(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
}

export function formatTime(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatMinutes(value?: number | null) {
  if (value === null || value === undefined) return "-";
  const hours = Math.floor(value / 60);
  const minutes = Math.max(0, value % 60);
  return `${hours}h ${minutes}m`;
}

export function imageSrc(path?: string | null) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const base = String(import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function attendanceStatus(row: any) {
  const status = String(row?.calculation?.currentStatus || "").toLowerCase();
  if (status.includes("late")) return "Late";
  if (status.includes("leave")) return "Leave";
  if (status.includes("absent") || status.includes("missed")) return "Absent";
  if (row?.events?.checkInAtUtc) return "Present";
  return display(row?.calculation?.currentStatus);
}

export function statusClass(status: string) {
  const value = status.toLowerCase();
  if (["approved", "present", "active"].includes(value)) {
    return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
  }
  if (["pending", "late", "leave"].includes(value)) {
    return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
  }
  if (["rejected", "cancelled", "absent"].includes(value)) {
    return "bg-rose-500/10 text-rose-600 dark:text-rose-400";
  }
  return "bg-muted text-muted-foreground";
}
