import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  Building2,
  Check,
  Download,
  FilePlus2,
  FileText,
  Loader2,
  Pencil,
  Save,
  Sparkles,
  X,
} from "lucide-react";
import DocumentTemplateEditor from "@/components/shared/DocumentTemplateEditor";
import type { RichTextVariable } from "@/components/shared/RichTextEditor";
import {
  createBankExportTemplate,
  exportEmployeeSalariesToBank,
  listBankExportTemplates,
  updateBankExportTemplate,
  type BankExportTemplate,
  type SalaryBankExportScope,
} from "@/api/finance";

type Props = {
  open: boolean;
  onClose: () => void;
  exportScope: SalaryBankExportScope;
  selectedEmployeeCount?: number;
  showAlert: (message: string, type?: "success" | "info" | "error") => void;
};

type EditorState = {
  id: string | null;
  name: string;
  headerHtml: string;
  bodyHtml: string;
  footerHtml: string;
  headerEnabled: boolean;
  footerEnabled: boolean;
  isDefault: boolean;
};

const DEFAULT_BODY = `<p><strong>Salary Transfer Instruction</strong></p>
<p>Please process the salary payments for <strong>{{pay_period}}</strong> for {{employee_count}} employees.</p>
<p>Total payroll: <strong>{{total_net_payroll}}</strong></p>
<p>{{employee_table}}</p>`;

const BANK_VARIABLES: RichTextVariable[] = [
  { key: "company_name", label: "Company name" },
  { key: "pay_period", label: "Pay period" },
  { key: "period_start", label: "Period start" },
  { key: "period_end", label: "Period end" },
  { key: "employee_count", label: "Employee count" },
  { key: "total_net_payroll", label: "Total net payroll" },
  { key: "currency", label: "Currency" },
  { key: "generated_date", label: "Generated date" },
  { key: "employee_table", label: "Employee payment table" },
];

function blankEditor(): EditorState {
  return {
    id: null,
    name: "",
    headerHtml: "",
    bodyHtml: DEFAULT_BODY,
    footerHtml: "",
    headerEnabled: false,
    footerEnabled: false,
    isDefault: false,
  };
}

function editorFromTemplate(template: BankExportTemplate): EditorState {
  return {
    id: template.id,
    name: template.name,
    headerHtml: template.headerHtml || "",
    bodyHtml: template.bodyHtml || DEFAULT_BODY,
    footerHtml: template.footerHtml || "",
    headerEnabled: Boolean(template.headerHtml),
    footerEnabled: Boolean(template.footerHtml),
    isDefault: Boolean(template.isDefault),
  };
}

function unwrapTemplates(response: any): BankExportTemplate[] {
  const payload = response?.data?.data ?? response?.data ?? [];
  return Array.isArray(payload) ? payload : [];
}

async function responseErrorMessage(error: any, fallback: string) {
  const responseData = error?.response?.data;
  if (responseData instanceof Blob) {
    try {
      const text = await responseData.text();
      const parsed = JSON.parse(text);
      return parsed?.message || parsed?.error || fallback;
    } catch {
      return fallback;
    }
  }
  return responseData?.message || responseData?.error || error?.message || fallback;
}

function filenameFromDisposition(value?: string) {
  const match = String(value || "").match(/filename="?([^";]+)"?/i);
  return match?.[1] || `bank-salary-instruction-${new Date().toISOString().slice(0, 10)}.pdf`;
}

export default function BankExportDialog({
  open,
  onClose,
  exportScope,
  selectedEmployeeCount = 0,
  showAlert,
}: Props) {
  const [templates, setTemplates] = useState<BankExportTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [mode, setMode] = useState<"select" | "edit">("select");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState>(blankEditor);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedId) || null,
    [selectedId, templates],
  );

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const response = await listBankExportTemplates();
      const rows = unwrapTemplates(response).filter((template) => template.isActive !== false);
      setTemplates(rows);
      const preferred = rows.find((template) => template.isDefault) || rows[0] || null;
      setSelectedId((current) => current && rows.some((template) => template.id === current) ? current : preferred?.id || null);
    } catch (error: any) {
      showAlert(await responseErrorMessage(error, "Failed to load bank export templates."), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    setMode("select");
    setEditor(blankEditor());
    void loadTemplates();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving && !exporting) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, saving, exporting]);

  const startNew = () => {
    setEditor(blankEditor());
    setMode("edit");
  };

  const editSelected = () => {
    if (!selectedTemplate) return;
    setEditor(editorFromTemplate(selectedTemplate));
    setMode("edit");
  };

  const saveEditor = async (): Promise<BankExportTemplate | null> => {
    if (!editor.name.trim()) {
      showAlert("Add a template name before saving.", "error");
      return null;
    }
    if (!editor.bodyHtml.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").trim()) {
      showAlert("The bank document content cannot be empty.", "error");
      return null;
    }

    setSaving(true);
    try {
      const payload = {
        name: editor.name.trim(),
        headerHtml: editor.headerEnabled ? editor.headerHtml : null,
        bodyHtml: editor.bodyHtml,
        footerHtml: editor.footerEnabled ? editor.footerHtml : null,
        isDefault: editor.isDefault,
        isActive: true,
      };
      const response = editor.id
        ? await updateBankExportTemplate(editor.id, payload)
        : await createBankExportTemplate(payload);
      const saved = response?.data?.data ?? response?.data;
      if (!saved?.id) throw new Error("Template saved but the server did not return its id.");
      setEditor(editorFromTemplate(saved));
      setSelectedId(saved.id);
      await loadTemplates();
      showAlert(editor.id ? "Bank export template updated." : "Bank export template created.", "success");
      return saved as BankExportTemplate;
    } catch (error: any) {
      showAlert(await responseErrorMessage(error, "Failed to save bank export template."), "error");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const downloadWithTemplate = async (templateId: string) => {
    setExporting(true);
    try {
      const response = await exportEmployeeSalariesToBank(templateId, exportScope);
      const blob = response.data instanceof Blob
        ? response.data
        : new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filenameFromDisposition(response.headers?.["content-disposition"]);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showAlert("Bank salary document exported successfully.", "success");
    } catch (error: any) {
      showAlert(await responseErrorMessage(error, "Failed to export the bank salary document."), "error");
    } finally {
      setExporting(false);
    }
  };

  const saveAndExport = async () => {
    const saved = await saveEditor();
    if (saved?.id) await downloadWithTemplate(saved.id);
  };

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex flex-col bg-slate-50">
      <div className="flex min-h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          {mode === "edit" ? (
            <button
              type="button"
              onClick={() => setMode("select")}
              className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 transition hover:bg-slate-50"
              aria-label="Back to templates"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          ) : null}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-base font-black text-slate-950">Export salaries to bank</h2>
            <p className="truncate text-xs font-medium text-slate-500">
              {selectedEmployeeCount > 0
                ? `${selectedEmployeeCount} selected employee${selectedEmployeeCount === 1 ? "" : "s"}`
                : "Using the current salary filters"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {mode === "edit" ? (
            <>
              <button
                type="button"
                disabled={saving || exporting}
                onClick={() => void saveEditor()}
                className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-700 hover:bg-slate-50 disabled:opacity-50 sm:flex"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save template
              </button>
              <button
                type="button"
                disabled={saving || exporting}
                onClick={() => void saveAndExport()}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Save & export
              </button>
            </>
          ) : selectedTemplate ? (
            <button
              type="button"
              disabled={exporting}
              onClick={() => void downloadWithTemplate(selectedTemplate.id)}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Export PDF
            </button>
          ) : null}
          <button
            type="button"
            disabled={saving || exporting}
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
            aria-label="Close bank export"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {mode === "select" ? (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-5xl">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mb-1 flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-blue-600">
                  <Sparkles className="h-3.5 w-3.5" /> Bank document templates
                </div>
                <h3 className="text-2xl font-black tracking-tight text-slate-950">Choose how the bank letter should look</h3>
                <p className="mt-1 text-sm font-medium text-slate-500">The employee names, bank accounts, and net salaries are inserted automatically at export time.</p>
              </div>
              <button
                type="button"
                onClick={startNew}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                <FilePlus2 className="h-4 w-4" /> Add new template
              </button>
            </div>

            {loading ? (
              <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
                <div className="text-center text-sm font-bold text-slate-500">
                  <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-blue-600" /> Loading templates…
                </div>
              </div>
            ) : templates.length === 0 ? (
              <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <FileText className="h-7 w-7" />
                </div>
                <h4 className="text-lg font-black text-slate-950">No bank export template yet</h4>
                <p className="mt-2 max-w-md text-sm font-medium leading-6 text-slate-500">Create the first template once, including its optional header and footer. It will be available for future salary exports.</p>
                <button
                  type="button"
                  onClick={startNew}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-extrabold text-white hover:bg-blue-700"
                >
                  <FilePlus2 className="h-4 w-4" /> Create bank template
                </button>
              </div>
            ) : (
              <div className="grid gap-3">
                {templates.map((template) => {
                  const selected = template.id === selectedId;
                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => setSelectedId(template.id)}
                      className={`group flex w-full items-center gap-4 rounded-2xl border bg-white p-4 text-left transition ${
                        selected
                          ? "border-blue-300 ring-4 ring-blue-50"
                          : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                      }`}
                    >
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${selected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                        {selected ? <Check className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-sm font-black text-slate-950">{template.name}</span>
                          {template.isDefault ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-emerald-700">Default</span> : null}
                        </div>
                        <p className="mt-1 text-xs font-medium text-slate-500">
                          {[template.headerHtml ? "Header" : null, "Body", template.footerHtml ? "Footer" : null].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      {selected ? (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(event) => {
                            event.stopPropagation();
                            editSelected();
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              event.stopPropagation();
                              editSelected();
                            }
                          }}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-700 hover:bg-slate-50"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <div className="grid h-full min-w-0 lg:grid-cols-[300px_minmax(0,1fr)]">
            <aside className="overflow-y-auto border-r border-slate-200 bg-white p-5">
              <label className="block">
                <span className="mb-2 block text-xs font-extrabold text-slate-700">Template name</span>
                <input
                  value={editor.name}
                  onChange={(event) => setEditor((current) => ({ ...current, name: event.target.value }))}
                  placeholder="e.g. CBE salary transfer"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                />
              </label>

              <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3">
                <input
                  type="checkbox"
                  checked={editor.isDefault}
                  onChange={(event) => setEditor((current) => ({ ...current, isDefault: event.target.checked }))}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300"
                />
                <span>
                  <span className="block text-xs font-extrabold text-slate-800">Default bank template</span>
                  <span className="mt-0.5 block text-[11px] font-medium leading-4 text-slate-500">Preselect this template next time.</span>
                </span>
              </label>

              <div className="mt-6 border-t border-slate-100 pt-5">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Automatic payroll fields</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {BANK_VARIABLES.map((variable) => (
                    <code key={variable.key} className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">{`{{${variable.key}}}`}</code>
                  ))}
                </div>
                <p className="mt-3 text-[11px] font-medium leading-5 text-slate-500">Use <strong className="text-slate-700">employee_table</strong> where the bank payment rows should appear. If you leave it out, the table is appended automatically.</p>
              </div>
            </aside>

            <main className="min-w-0 overflow-y-auto p-3 sm:p-5">
              <DocumentTemplateEditor
                bodyHtml={editor.bodyHtml}
                onBodyHtmlChange={(bodyHtml) => setEditor((current) => ({ ...current, bodyHtml }))}
                headerHtml={editor.headerHtml}
                onHeaderHtmlChange={(headerHtml) => setEditor((current) => ({ ...current, headerHtml }))}
                footerHtml={editor.footerHtml}
                onFooterHtmlChange={(footerHtml) => setEditor((current) => ({ ...current, footerHtml }))}
                headerEnabled={editor.headerEnabled}
                onHeaderEnabledChange={(headerEnabled) => setEditor((current) => ({ ...current, headerEnabled }))}
                footerEnabled={editor.footerEnabled}
                onFooterEnabledChange={(footerEnabled) => setEditor((current) => ({ ...current, footerEnabled }))}
                variables={BANK_VARIABLES}
                bodyPlaceholder="Write the bank salary transfer instruction..."
              />
            </main>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}
