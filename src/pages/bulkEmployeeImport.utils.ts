import type { BulkEmployeeAction, BulkEmployeeRow, BulkEmployeeValidationResult, BulkEmployeeValidationStatus } from "../api/bulkEmployees";

export const CSV_COLUMNS = [
  "employeeCode","firstName","lastName","email","phone","roleKeys","departmentName","positionName","managerEmail","branch","employmentType","employmentStatus","hireDate","probationEndDate","contractStartDate","contractEndDate","monthlySalary","salaryCurrency","dateOfBirth","city","countryOfBirth","additionalPhone","additionalNotes","emergencyFirstName","emergencyLastName","emergencyPhone","emergencyEmail","emergencyCity","emergencyCountry","bankName","bankAccountNumber"
];

export const EXAMPLE_ROW = [
  "EMP-001","Abel","Tesfaye","abel@company.com","+251911111111","EMPLOYEE|PROJECT_MANAGER","Projects","Senior Project Manager","manager@company.com","Head Office","full_time","active","2023-01-10","","","2026-12-31","25000","ETB","1994-05-18","Addis Ababa","Ethiopia","","Existing employee","Sara","Tesfaye","+251922222222","sara@example.com","Addis Ababa","Ethiopia","Commercial Bank","00123456789"
];

export const ALLOWED_ROLE_KEYS = [
  "EMPLOYEE",
  "DEPARTMENT_HEAD",
  "PROJECT_MANAGER",
  "CRM_MANAGER",
  "FINANCE_MANAGER",
  "HR_MANAGER",
] as const;

export type PreviewRow = BulkEmployeeValidationResult & {
  action: BulkEmployeeAction;
  removed?: boolean;
  referenceActions?: BulkEmployeeRow["referenceActions"];
};
export type AlertFn = (msg: string, type?: "success" | "info" | "error") => void;
export type RouteValidationError = {
  rowIndex: number;
  field: string;
  message: string;
};

export const nullable = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text ? text : null;
};

export const csvEscape = (value: unknown) => {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (ch === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
    } else if (ch === '"') {
      quoted = !quoted;
    } else if (ch === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((ch === "\n" || ch === "\r") && !quoted) {
      if (ch === "\r" && next === "\n") i += 1;
      row.push(cell);
      if (row.some((v) => v.trim())) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }
  row.push(cell);
  if (row.some((v) => v.trim())) rows.push(row);
  return rows;
}

export function mapCsvToPayload(text: string) {
  const parsed = parseCsv(text);
  const [headersRaw, ...dataRows] = parsed;
  const headers = (headersRaw || []).map((h) => h.trim());
  const rows: BulkEmployeeRow[] = [];

  dataRows.forEach((values, index) => {
    const rowNumber = index + 2;
    const raw: Record<string, string> = {};
    headers.forEach((header, i) => { raw[header] = (values[i] ?? "").trim(); });
    const bankName = nullable(raw.bankName);
    const bankAccountNumber = nullable(raw.bankAccountNumber);
    const bankDetails = bankName || bankAccountNumber
      ? [{ bankName, accountNumber: bankAccountNumber }]
      : undefined;
    rows.push({
      rowNumber,
      account: {
        firstName: raw.firstName || "",
        lastName: raw.lastName || "",
        email: (raw.email || "").toLowerCase(),
        phone: nullable(raw.phone),
        password: null,
      },
      profile: {
        employeeCode: raw.employeeCode || "",
        roleKeys: (raw.roleKeys || "").split("|").map((r) => r.trim().toUpperCase()).filter(Boolean),
        departmentName: nullable(raw.departmentName),
        positionName: nullable(raw.positionName),
        managerEmail: nullable(raw.managerEmail)?.toLowerCase() || null,
        branch: nullable(raw.branch),
        employmentType: (raw.employmentType || "full_time") as any,
        employmentStatus: (raw.employmentStatus || "active") as any,
        hireDate: raw.hireDate || "",
        probationEndDate: nullable(raw.probationEndDate),
        contractStartDate: nullable(raw.contractStartDate),
        contractEndDate: nullable(raw.contractEndDate),
        monthlySalary: raw.monthlySalary ? Number(raw.monthlySalary) : null,
        salaryCurrency: nullable(raw.salaryCurrency),
        dateOfBirth: nullable(raw.dateOfBirth),
        city: nullable(raw.city),
        countryOfBirth: nullable(raw.countryOfBirth),
        additionalPhone: nullable(raw.additionalPhone),
        additionalNotes: nullable(raw.additionalNotes),
        emergencyFirstName: nullable(raw.emergencyFirstName),
        emergencyLastName: nullable(raw.emergencyLastName),
        emergencyPhone: nullable(raw.emergencyPhone),
        emergencyEmail: nullable(raw.emergencyEmail)?.toLowerCase() || null,
        emergencyCity: nullable(raw.emergencyCity),
        emergencyCountry: nullable(raw.emergencyCountry),
        ...(bankDetails ? { bankDetails } : {}),
      },
    });
  });
  return { rows };
}

export function defaultAction(status: BulkEmployeeValidationStatus): BulkEmployeeAction {
  if (status === "READY_TO_CREATE") return "CREATE";
  return "SKIP";
}

export function download(name: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export function makePreviewRowsFromSource(rows: BulkEmployeeRow[]): PreviewRow[] {
  return rows.map((row) => ({
    rowNumber: row.rowNumber,
    status: "INVALID",
    normalizedRow: row,
    errors: [],
    changes: [],
    action: "SKIP",
    matchedBy: "none",
    referenceActions: {},
  }));
}

export function mapRouteValidationErrors(error: any): RouteValidationError[] {
  const details = error?.response?.data?.data || error?.response?.data?.details || [];
  if (!Array.isArray(details)) return [];
  return details
    .map((detail: any) => {
      const path = Array.isArray(detail?.path) ? detail.path : [];
      const rowsIndex = path.findIndex((part) => part === "rows");
      const rowIndex = rowsIndex >= 0 && typeof path[rowsIndex + 1] === "number" ? path[rowsIndex + 1] : -1;
      if (rowIndex < 0) return null;
      const fieldParts = path.slice(rowsIndex + 2).map(String);
      return {
        rowIndex,
        field: fieldParts.join(".") || "row",
        message: String(detail?.message || "Validation error"),
      };
    })
    .filter(Boolean) as RouteValidationError[];
}

