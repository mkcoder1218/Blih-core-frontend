import type { EmploymentChangeRequest } from "../../../api/employmentChanges";

export function nice(value?: string | null) {
  if (!value) return "—";
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function money(value: unknown, currency = "ETB") {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return "—";
  return `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)} ${currency}`;
}

export function statusClass(status: string) {
  switch (status) {
    case "APPLIED":
      return "bg-emerald-50 text-emerald-700";
    case "APPROVED":
    case "SCHEDULED":
      return "bg-blue-50 text-blue-700";
    case "REJECTED":
    case "CANCELLED":
      return "bg-red-50 text-red-700";
    default:
      return "bg-amber-50 text-amber-700";
  }
}

export function kindLabel(request: EmploymentChangeRequest) {
  if (request.requestKind === "COMBINED") return "Title + Salary";
  if (request.requestKind === "SALARY") return "Salary Increase";
  return "Title Change";
}

export function netSalarySummary(
  request: EmploymentChangeRequest,
  currency = "ETB",
) {
  const current = request.currentNetSalary;
  const next = request.finalNetSalary ?? request.requestedNetSalary;
  if (current == null || next == null) return null;
  return `${money(current, currency)} → ${money(next, currency)}`;
}

export function changeSummary(
  request: EmploymentChangeRequest,
  currency = "ETB",
) {
  const parts: string[] = [];

  if (request.targetTitle) {
    parts.push(
      `${request.currentTitle || "Current title"} → ${request.targetTitle}`,
    );
  }

  const net = netSalarySummary(request, currency);
  if (net) parts.push(`Net ${net}`);

  return parts.join(" · ") || "—";
}

export function canOwnerUpdate(
  request: EmploymentChangeRequest,
  currentUserId: string,
) {
  if (!currentUserId) return false;
  if (String(request.requestedByUserId) !== String(currentUserId)) return false;
  if (String(request.status) !== "PENDING") return false;
  if (Number(request.metadata?.approvalIndex || 0) > 0) return false;
  if (request.recommendedSalary != null) return false;
  return true;
}

export function canOwnerDelete(
  request: EmploymentChangeRequest,
  currentUserId: string,
) {
  return (
    Boolean(currentUserId) &&
    String(request.requestedByUserId) === String(currentUserId) &&
    ["PENDING", "CANCELLED"].includes(String(request.status))
  );
}
