import React, { useMemo, useRef, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { AlertTriangle, ArrowLeft, CheckCircle2, Download, FileSpreadsheet, Filter, RefreshCw, Trash2, Upload } from "lucide-react";
import { useBulkImportEmployees, useValidateBulkEmployees } from "../hooks/useBulkEmployees";
import type { BulkEmployeeAction, BulkEmployeeRow, BulkEmployeeValidationResult, BulkEmployeeValidationStatus, BulkEmployeeWriteResponse } from "../api/bulkEmployees";
import { ConfirmDialog } from "@/components/ui/blih";

const CSV_COLUMNS = [
  "employeeCode","firstName","lastName","email","phone","roleKeys","departmentName","positionName","managerEmail","branch","employmentType","employmentStatus","hireDate","probationEndDate","contractStartDate","contractEndDate","monthlySalary","salaryCurrency","dateOfBirth","city","countryOfBirth","additionalPhone","additionalNotes","emergencyFirstName","emergencyLastName","emergencyPhone","emergencyEmail","emergencyCity","emergencyCountry","bankName","bankAccountNumber"
];

const EXAMPLE_ROW = [
  "EMP-001","Abel","Tesfaye","abel@company.com","+251911111111","EMPLOYEE|PROJECT_MANAGER","Projects","Senior Project Manager","manager@company.com","Head Office","full_time","active","2023-01-10","","","2026-12-31","25000","ETB","1994-05-18","Addis Ababa","Ethiopia","","Existing employee","Sara","Tesfaye","+251922222222","sara@example.com","Addis Ababa","Ethiopia","Commercial Bank","00123456789"
];

const ALLOWED_ROLE_KEYS = [
  "EMPLOYEE",
  "DEPARTMENT_HEAD",
  "PROJECT_MANAGER",
  "CRM_MANAGER",
  "FINANCE_MANAGER",
  "HR_MANAGER",
] as const;

type PreviewRow = BulkEmployeeValidationResult & {
  action: BulkEmployeeAction;
  removed?: boolean;
  referenceActions?: BulkEmployeeRow["referenceActions"];
};
type AlertFn = (msg: string, type?: "success" | "info" | "error") => void;
type RouteValidationError = {
  rowIndex: number;
  field: string;
  message: string;
};

const nullable = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text ? text : null;
};

const csvEscape = (value: unknown) => {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

function parseCsv(text: string) {
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

function mapCsvToPayload(text: string) {
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

function defaultAction(status: BulkEmployeeValidationStatus): BulkEmployeeAction {
  if (status === "READY_TO_CREATE") return "CREATE";
  return "SKIP";
}

function download(name: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function makePreviewRowsFromSource(rows: BulkEmployeeRow[]): PreviewRow[] {
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

function mapRouteValidationErrors(error: any): RouteValidationError[] {
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

export default function BulkEmployeeImportPage() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const { showAlert } = useOutletContext<{ showAlert?: AlertFn }>();
  const validateMutation = useValidateBulkEmployees();
  const importMutation = useBulkImportEmployees();
  const [sourceRows, setSourceRows] = useState<BulkEmployeeRow[]>([]);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<"ALL" | BulkEmployeeValidationStatus>("ALL");
  const [writeResult, setWriteResult] = useState<BulkEmployeeWriteResponse | null>(null);
  const [importConfirmOpen, setImportConfirmOpen] = useState(false);

  const visibleRows = previewRows.filter((row) => !row.removed && (statusFilter === "ALL" || row.status === statusFilter));
  const blockers = previewRows.filter((row) => !row.removed && (row.status === "INVALID" || row.status === "CONFLICT"));
  const unresolvedReferences = previewRows.filter((row) => !row.removed && row.errors.some((error) => (
    (error.code === "DEPARTMENT_NOT_FOUND" && !row.referenceActions?.department) ||
    (error.code === "POSITION_NOT_FOUND" && !row.referenceActions?.position)
  )));
  const canSubmit = previewRows.some((row) => !row.removed && (row.action === "CREATE" || row.action === "UPDATE")) && blockers.length === 0 && unresolvedReferences.length === 0;

  const summary = useMemo(() => {
    const counts: Record<string, number> = { total: 0, READY_TO_CREATE: 0, READY_TO_UPDATE: 0, UNCHANGED: 0, INVALID: 0, CONFLICT: 0 };
    previewRows.filter((r) => !r.removed).forEach((row) => {
      counts.total += 1;
      counts[row.status] += 1;
    });
    return counts;
  }, [previewRows]);

  const validateRows = async (rows = sourceRows) => {
    if (!rows.length) return showAlert?.("Upload a CSV before validating.", "error");
    setPreviewRows((current) => current.length ? current : makePreviewRowsFromSource(rows));
    try {
      const result = await validateMutation.mutateAsync(rows);
      setPreviewRows(result.results.map((row) => ({ ...row, action: defaultAction(row.status), referenceActions: {} })));
      setWriteResult(null);
      showAlert?.("Bulk validation completed.", "success");
    } catch (error: any) {
      const routeErrors = mapRouteValidationErrors(error);
      if (!routeErrors.length) throw error;
      const grouped = new Map<number, RouteValidationError[]>();
      routeErrors.forEach((item) => grouped.set(item.rowIndex, [...(grouped.get(item.rowIndex) || []), item]));
      setPreviewRows(makePreviewRowsFromSource(rows).map((row, index) => ({
        ...row,
        errors: (grouped.get(index) || []).map((item) => ({ field: item.field, message: item.message })),
      })));
      setWriteResult(null);
      showAlert?.(`${grouped.size} rows contain validation errors. Review the highlighted fields.`, "error");
    }
  };

  const onFile = async (file?: File | null) => {
    if (!file) return;
    const text = await file.text();
    const mapped = mapCsvToPayload(text);
    setSourceRows(mapped.rows);
    setPreviewRows(makePreviewRowsFromSource(mapped.rows));
    await validateRows(mapped.rows);
  };

  const setAction = (rowNumber: number, action: BulkEmployeeAction) => {
    setPreviewRows((rows) => rows.map((row) => row.rowNumber === rowNumber ? { ...row, action } : row));
  };

  const setReferenceAction = (rowNumber: number, reference: "department" | "position", action: "CREATE" | "SKIP") => {
    setPreviewRows((rows) => rows.map((row) => row.rowNumber === rowNumber ? {
      ...row,
      referenceActions: { ...(row.referenceActions || {}), [reference]: action },
    } : row));
  };

  const toggleRole = (rowNumber: number, roleKey: string) => {
    setPreviewRows((rows) => rows.map((row) => {
      if (row.rowNumber !== rowNumber || !row.normalizedRow) return row;
      const current = row.normalizedRow.profile.roleKeys || [];
      const next = current.includes(roleKey)
        ? current.filter((key) => key !== roleKey)
        : [...current, roleKey].sort();
      return {
        ...row,
        normalizedRow: {
          ...row.normalizedRow,
          profile: { ...row.normalizedRow.profile, roleKeys: next },
        },
      };
    }));
  };

  const removeRow = (rowNumber: number) => {
    setPreviewRows((rows) => rows.map((row) => row.rowNumber === rowNumber ? { ...row, removed: true } : row));
  };

  const applyImport = async () => {
    const rows = previewRows.filter((row) => !row.removed && row.status !== "INVALID" && row.status !== "CONFLICT").map((row) => ({
      ...(row.normalizedRow || sourceRows.find((source) => source.rowNumber === row.rowNumber)!),
      action: row.action,
      employeeId: row.existingEmployeeRecordId,
      referenceActions: row.referenceActions,
    }));
    const result = await importMutation.mutateAsync(rows);
    setWriteResult(result);
    setImportConfirmOpen(false);
    showAlert?.("Bulk import completed.", result.failed || result.conflicts ? "info" : "success");
  };

  const submit = async () => {
    if (!canSubmit) return;
    setImportConfirmOpen(true);
  };

  const downloadTemplate = () => {
    download("employee-import-template.csv", `${CSV_COLUMNS.join(",")}\n${EXAMPLE_ROW.map(csvEscape).join(",")}\n`);
  };

  const downloadFailed = () => {
    const failedRows = previewRows.filter((row) => !row.removed && (row.status === "INVALID" || row.status === "CONFLICT"));
    const backendFailed = writeResult?.results.filter((row) => row.status === "FAILED" || row.status === "CONFLICT") || [];
    const rowNumbers = new Set([...failedRows.map((r) => r.rowNumber), ...backendFailed.map((r) => r.rowNumber)]);
    const rows = sourceRows.filter((row) => rowNumbers.has(row.rowNumber));
    const csv = [CSV_COLUMNS.join(","), ...rows.map((row) => CSV_COLUMNS.map((column) => csvEscape(valueForCsv(row, column))).join(","))].join("\n");
    download("failed-employee-import-rows.csv", `${csv}\n`);
  };

  return (
    <div className="min-h-full space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" /> Employees
          </button>
          <h1 className="text-xl font-black text-slate-950 mt-2">Bulk Import Employees</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={downloadTemplate} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
            <Download className="w-4 h-4" /> Template
          </button>
          <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700">
            <Upload className="w-4 h-4" /> Upload CSV
          </button>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
        {["total", "READY_TO_CREATE", "READY_TO_UPDATE", "UNCHANGED", "INVALID", "CONFLICT"].map((key) => (
          <div key={key} className="rounded-lg border border-slate-100 bg-white px-3 py-2">
            <p className="text-[10px] font-black uppercase text-slate-400">{key.replaceAll("_", " ")}</p>
            <p className="text-lg font-black text-slate-900">{summary[key]}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-100 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-black text-slate-900">Import Preview</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
              {["ALL", "READY_TO_CREATE", "READY_TO_UPDATE", "UNCHANGED", "INVALID", "CONFLICT"].map((s) => <option key={s} value={s}>{s.replaceAll("_", " ")}</option>)}
            </select>
            <button onClick={() => setPreviewRows((rows) => rows.map((row) => row.status === "READY_TO_UPDATE" ? { ...row, action: "UPDATE" } : row))} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
              <CheckCircle2 className="w-3.5 h-3.5" /> Select Updates
            </button>
            <button onClick={() => validateRows()} disabled={validateMutation.isPending || !sourceRows.length} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-40">
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[11px] font-black uppercase text-slate-400">
              <tr>
                {["Row", "Code", "Name", "Email", "Department", "Bank Name", "Bank Account Number", "Roles", "Status", "Action", "Errors", ""].map((h) => <th key={h} className="px-3 py-3 whitespace-nowrap">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs">
              {visibleRows.map((row) => (
                <React.Fragment key={row.rowNumber}>
                  <tr>
                    <td className="px-3 py-3 font-bold">{row.rowNumber}</td>
                    <td className="px-3 py-3 font-bold">{row.normalizedRow?.profile.employeeCode}</td>
                    <td className="px-3 py-3">{row.normalizedRow?.account.firstName} {row.normalizedRow?.account.lastName}</td>
                    <td className="px-3 py-3">{row.normalizedRow?.account.email}</td>
                    <td className="px-3 py-3">{row.normalizedRow?.profile.departmentName || "-"}</td>
                    <td className="px-3 py-3">{row.normalizedRow?.profile.bankDetails?.[0]?.bankName || "-"}</td>
                    <td className="px-3 py-3">{row.normalizedRow?.profile.bankDetails?.[0]?.accountNumber || "-"}</td>
                    <td className="px-3 py-3 min-w-[260px]">
                      <div className="flex flex-wrap gap-1.5">
                        {ALLOWED_ROLE_KEYS.map((roleKey) => {
                          const selected = row.normalizedRow?.profile.roleKeys.includes(roleKey);
                          return (
                            <button
                              key={`${row.rowNumber}-${roleKey}`}
                              type="button"
                              onClick={() => toggleRole(row.rowNumber, roleKey)}
                              className={`rounded-md border px-2 py-1 text-[10px] font-black transition-colors ${
                                selected
                                  ? "border-blue-600 bg-blue-600 text-white"
                                  : "border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:text-blue-700"
                              }`}
                            >
                              {roleKey}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-3 py-3"><StatusBadge status={row.status} /></td>
                    <td className="px-3 py-3">
                      {row.status === "INVALID" || row.status === "CONFLICT" ? (
                        <span className="font-bold text-slate-400">Blocked</span>
                      ) : (
                        <select value={row.action} onChange={(e) => setAction(row.rowNumber, e.target.value as BulkEmployeeAction)} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold">
                          <option value="SKIP">SKIP</option>
                          {row.status === "READY_TO_CREATE" && <option value="CREATE">CREATE</option>}
                          {row.status === "READY_TO_UPDATE" && <option value="UPDATE">UPDATE</option>}
                        </select>
                      )}
                    </td>
                    <td className="px-3 py-3 max-w-xs">
                      <div className="space-y-2">
                        {row.errors.map((e) => (
                          <div key={`${row.rowNumber}-${e.field}-${e.message}`} className={e.allowCreate ? "text-amber-700 font-semibold" : "text-rose-600 font-semibold"}>
                            <span>{e.field}: {e.message}</span>
                            {e.code === "DEPARTMENT_NOT_FOUND" && (
                              <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2">
                                <p className="text-[11px] font-black text-slate-900">Department "{row.normalizedRow?.profile.departmentName}" does not exist.</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setReferenceAction(row.rowNumber, "department", "CREATE")}
                                    className={`rounded-lg px-2.5 py-1.5 text-[11px] font-black ${row.referenceActions?.department === "CREATE" ? "bg-blue-600 text-white" : "bg-white text-blue-700 border border-blue-200"}`}
                                  >
                                    Create Department
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setReferenceAction(row.rowNumber, "department", "SKIP")}
                                    className={`rounded-lg px-2.5 py-1.5 text-[11px] font-black ${row.referenceActions?.department === "SKIP" ? "bg-slate-800 text-white" : "bg-white text-slate-700 border border-slate-200"}`}
                                  >
                                    Skip Department
                                  </button>
                                </div>
                              </div>
                            )}
                            {e.code === "POSITION_NOT_FOUND" && (
                              <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2">
                                <p className="text-[11px] font-black text-slate-900">Position "{row.normalizedRow?.profile.positionName}" does not exist in department "{row.normalizedRow?.profile.departmentName || "selected department"}".</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setReferenceAction(row.rowNumber, "position", "CREATE")}
                                    className={`rounded-lg px-2.5 py-1.5 text-[11px] font-black ${row.referenceActions?.position === "CREATE" ? "bg-blue-600 text-white" : "bg-white text-blue-700 border border-blue-200"}`}
                                  >
                                    Create Position
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setReferenceAction(row.rowNumber, "position", "SKIP")}
                                    className={`rounded-lg px-2.5 py-1.5 text-[11px] font-black ${row.referenceActions?.position === "SKIP" ? "bg-slate-800 text-white" : "bg-white text-slate-700 border border-slate-200"}`}
                                  >
                                    Skip Position
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button onClick={() => removeRow(row.rowNumber)} className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                  {row.status === "READY_TO_UPDATE" && row.changes.length > 0 && (
                    <tr className="bg-blue-50/40">
                      <td colSpan={12} className="px-3 py-3">
                        <div className="text-xs text-slate-700">
                          <p className="font-black text-slate-900 mb-1">{row.normalizedRow?.profile.employeeCode} already exists.</p>
                          <div className="grid md:grid-cols-2 gap-1">
                            {row.changes.map((change) => (
                              <div key={change.field}><b>{change.field.replace("profile.", "").replace("account.", "")}:</b> {formatValue(change.currentValue)} {"->"} {formatValue(change.uploadedValue)}</div>
                            ))}
                          </div>
                          <div className="mt-2 flex gap-2">
                            <button onClick={() => setAction(row.rowNumber, "UPDATE")} className="rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-bold text-white">Update</button>
                            <button onClick={() => setAction(row.rowNumber, "SKIP")} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-700">Skip</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {blockers.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          Remove or fix invalid/conflict rows before submitting. {blockers.slice(0, 3).map((row) => `Row ${row.rowNumber}: ${row.errors.map((e) => e.message).join("; ")}`).join(" | ")}
        </div>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        <button onClick={downloadFailed} disabled={!previewRows.length && !writeResult} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 disabled:opacity-40">
          <Download className="w-4 h-4" /> Failed Rows
        </button>
        <button onClick={submit} disabled={!canSubmit || importMutation.isPending} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-xs font-black text-white disabled:bg-slate-300">
          Apply Import
        </button>
      </div>

      {writeResult && (
        <div className="rounded-xl border border-slate-100 bg-white p-4">
          <h3 className="text-sm font-black text-slate-900 mb-3">Import Result</h3>
          <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
            {["total", "created", "updated", "skipped", "unchanged", "failed", "conflicts"].map((key) => (
              <div key={key} className="rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-[10px] font-black uppercase text-slate-400">{key}</p>
                <p className="text-lg font-black text-slate-900">{(writeResult as any)[key]}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      <ConfirmDialog
        open={importConfirmOpen}
        onClose={() => setImportConfirmOpen(false)}
        onConfirm={applyImport}
        title="Apply Employee Import"
        description={previewRows.filter((row) => !row.removed && row.action === "UPDATE").length
          ? `Apply import and update ${previewRows.filter((row) => !row.removed && row.action === "UPDATE").length} reviewed employee record(s)?`
          : "Create selected employees?"}
        confirmLabel="Apply Import"
        variant="primary"
        loading={importMutation.isPending}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: BulkEmployeeValidationStatus }) {
  const color = status === "READY_TO_CREATE" ? "bg-emerald-50 text-emerald-700" : status === "READY_TO_UPDATE" ? "bg-blue-50 text-blue-700" : status === "UNCHANGED" ? "bg-slate-100 text-slate-600" : "bg-rose-50 text-rose-700";
  return <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-black ${color}`}>{status.replaceAll("_", " ")}</span>;
}

function formatValue(value: unknown) {
  if (Array.isArray(value)) return value.join(" | ");
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

function valueForCsv(row: BulkEmployeeRow, column: string) {
  const profile: any = row.profile;
  const account: any = row.account;
  if (column === "roleKeys") return profile.roleKeys?.join("|") || "";
  if (column === "bankName") return profile.bankDetails?.[0]?.bankName || "";
  if (column === "bankAccountNumber") return profile.bankDetails?.[0]?.accountNumber || "";
  if (column in account) return account[column] ?? "";
  if (column in profile) return profile[column] ?? "";
  return "";
}
