import type {
  ExitMode,
  ExitProcess,
  ExitRequestRow
} from "./exit.types";

export function getExitModeLabel(
  mode?: ExitMode,
): string {
  switch (mode) {
    case "immediate":
      return "Immediate Exit";

    case "urgent":
      return "Urgent Exit";

    case "standard_notice":
      return "Standard Notice";

    default:
      return "Standard Notice";
  }
}

export function getExitModeDescription(
  mode: ExitMode,
): string {
  switch (mode) {
    case "immediate":
      return "Employment ends immediately. No notice days are required.";

    case "urgent":
      return "A custom notice period between 1 and 29 days.";

    case "standard_notice":
      return "The standard 30-day notice period.";

    default:
      return "";
  }
}

export function getExitStatusLabel(
  status?: string,
): string {
  switch (status) {
    case "pending":
      return "Pending";

    case "in_progress":
      return "Approved";

    case "clearance_pending":
      return "In Clearance";

    case "completed":
      return "Completed";

    case "account_disabled":
      return "Account Disabled";

    case "rejected":
      return "Rejected";

    case "cancelled":
      return "Cancelled";

    default:
      return status
        ? status.replace(/_/g, " ")
        : "Pending";
  }
}

export function getExitStatusClasses(
  status?: string,
): string {
  switch (status) {
    case "in_progress":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "clearance_pending":
      return "border-violet-200 bg-violet-50 text-violet-700";

    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "account_disabled":
      return "border-slate-300 bg-slate-100 text-slate-700";

    case "rejected":
      return "border-rose-200 bg-rose-50 text-rose-700";

    case "cancelled":
      return "border-slate-200 bg-slate-50 text-slate-600";

    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

export function formatExitDate(
  value?: string | null,
): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  );
}

export function calculateNoticeDays(
  mode: ExitMode,
  urgentDays?: number,
): number {
  if (mode === "immediate") {
    return 0;
  }

  if (mode === "standard_notice") {
    return 30;
  }

  const days = Number(urgentDays || 0);

  if (
    !Number.isInteger(days) ||
    days < 1 ||
    days > 29
  ) {
    return 1;
  }

  return days;
}

export function calculateEffectiveDate(
  noticeDays: number,
): string {
  const date = new Date();

  date.setDate(
    date.getDate() + noticeDays,
  );

  return date
    .toISOString()
    .slice(0, 10);
}

export function mapExitProcessToRow(
  exit: ExitProcess,
): ExitRequestRow {
  const employee = exit.employee;

  const profile =
    employee?.BusinessUserProfile;

  return {
    id: exit.id,

    employeeName:
      employee?.fullName ||
      employee?.email ||
      "Employee",

    department:
      profile?.department?.name ||
      "-",

    position:
      profile?.position?.title ||
      "-",

    initiatedBy:
      exit.initiatedByType ||
      (exit.exitType === "resignation"
        ? "employee"
        : "employer"),

    mode:
      exit.exitMode ||
      "standard_notice",

    reason:
      exit.exitReasonNameSnapshot ||
      exit.reason ||
      "-",

    effectiveDate:
      formatExitDate(
        exit.effectiveDate,
      ),

    noticeDays:
      Number(
        exit.noticePeriodDays ?? 30,
      ),

    status:
      exit.status || "pending",

    raw: exit,
  };
}
