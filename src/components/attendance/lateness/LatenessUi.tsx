import React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Info,
  XCircle,
} from "lucide-react";

export const LATENESS_CONTROL_CLASS =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";

export const LATENESS_TEXTAREA_CLASS =
  "min-h-[96px] w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";

export function LatenessField({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-slate-700">
        {label}
        {required ? <span className="text-rose-500">*</span> : null}
      </span>
      {children}
      {hint ? (
        <span className="mt-1.5 block text-[11px] font-medium leading-4 text-slate-500">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export function LatenessPanel({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-950">{title}</h2>
          {description ? (
            <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function LatenessStatusBadge({
  value,
}: {
  value?: string | null;
}) {
  const normalized = String(value || "unknown").toLowerCase();

  const tone =
    normalized === "approved" ||
    normalized === "valid" ||
    normalized === "active"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : normalized === "pending" || normalized === "review"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : normalized === "rejected" ||
            normalized === "invalid" ||
            normalized === "expired" ||
            normalized === "disabled"
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-slate-200 bg-slate-100 text-slate-600";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${tone}`}
    >
      {normalized.replace(/_/g, " ")}
    </span>
  );
}

export function LatenessEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-32 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center">
      <Info className="h-5 w-5 text-slate-400" />
      <p className="mt-2 text-sm font-semibold text-slate-800">{title}</p>
      <p className="mt-1 max-w-md text-xs leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}

export function LatenessMetric({
  label,
  value,
  detail,
  tone = "neutral",
}: {
  label: string;
  value: React.ReactNode;
  detail?: string;
  tone?: "neutral" | "blue" | "green" | "amber" | "red";
}) {
  const toneClass =
    tone === "blue"
      ? "border-blue-200 bg-blue-50"
      : tone === "green"
        ? "border-emerald-200 bg-emerald-50"
        : tone === "amber"
          ? "border-amber-200 bg-amber-50"
          : tone === "red"
            ? "border-rose-200 bg-rose-50"
            : "border-slate-200 bg-slate-50";

  return (
    <div className={`rounded-lg border px-3 py-3 ${toneClass}`}>
      <p className="text-[11px] font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-950">{value}</p>
      {detail ? (
        <p className="mt-1 text-[11px] leading-4 text-slate-500">{detail}</p>
      ) : null}
    </div>
  );
}

export function LatenessSwitch({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-3 py-3 text-left transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span>
        <span className="block text-sm font-semibold text-slate-800">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-[11px] leading-4 text-slate-500">
            {description}
          </span>
        ) : null}
      </span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked ? "bg-blue-600" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </span>
    </button>
  );
}

export function LatenessNotice({
  tone,
  title,
  description,
}: {
  tone: "success" | "warning" | "error" | "info";
  title: string;
  description?: string;
}) {
  const config =
    tone === "success"
      ? {
          container: "border-emerald-200 bg-emerald-50",
          icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
          title: "text-emerald-900",
          body: "text-emerald-700",
        }
      : tone === "warning"
        ? {
            container: "border-amber-200 bg-amber-50",
            icon: <AlertTriangle className="h-4 w-4 text-amber-600" />,
            title: "text-amber-900",
            body: "text-amber-700",
          }
        : tone === "error"
          ? {
              container: "border-rose-200 bg-rose-50",
              icon: <XCircle className="h-4 w-4 text-rose-600" />,
              title: "text-rose-900",
              body: "text-rose-700",
            }
          : {
              container: "border-blue-200 bg-blue-50",
              icon: <Info className="h-4 w-4 text-blue-600" />,
              title: "text-blue-900",
              body: "text-blue-700",
            };

  return (
    <div className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${config.container}`}>
      <span className="mt-0.5">{config.icon}</span>
      <div>
        <p className={`text-xs font-semibold ${config.title}`}>{title}</p>
        {description ? (
          <p className={`mt-1 text-[11px] leading-5 ${config.body}`}>
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function LatenessTable({
  columns,
  children,
}: {
  columns: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full border-collapse">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                className="border-b border-slate-200 px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">{children}</tbody>
      </table>
    </div>
  );
}

export function LatenessRowAction({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
    >
      {children}
      <ChevronRight className="h-3.5 w-3.5" />
    </button>
  );
}
