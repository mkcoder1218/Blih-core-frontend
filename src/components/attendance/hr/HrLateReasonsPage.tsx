import React from "react";
import { Pencil, Plus, Settings2, Trash2, X } from "lucide-react";
import {
  InfoAlert,
  LoadingSpinner,
  PageHeader,
} from "@/components/ui/blih";
import { Button } from "@/components/ui/button";
import {
  useCreateHrLateReason,
  useDeactivateHrLateReason,
  useHrLateReasons,
  useLatenessCreditConfig,
  useUpdateHrLateReason,
  useUpdateLatenessCreditConfig,
} from "../../../hooks/useHrLateReasons";
import { useMyPermissions } from "../../../hooks/usePermissions";
import { useMe } from "../../../hooks/useMe";
import type {
  AttendanceLateReason,
  LatenessCreditConfig,
  LatenessCreditMode,
  LatenessReasonBehavior,
} from "../../../api/attendanceLateReasons";
import {
  LATENESS_CONTROL_CLASS,
  LATENESS_TEXTAREA_CLASS,
  LatenessEmptyState,
  LatenessField,
  LatenessNotice,
  LatenessPanel,
  LatenessStatusBadge,
  LatenessSwitch,
  LatenessTable,
} from "../lateness/LatenessUi";

const BEHAVIORS: LatenessReasonBehavior[] = [
  "BLOCK",
  "MARK_INVALID",
  "HR_REVIEW",
];

type RuleForm = {
  reasonCode: string;
  label: string;
  description: string;
  monthlyLimit: number;
  coversMinutes: number;
  requiresApproval: boolean;
  requiresAttachment: boolean;
  allowAfterDeadline: boolean;
  behaviorWhenExceeded: LatenessReasonBehavior;
  sortOrder: number;
  enabled: boolean;
  requiresComment: boolean;
};

function emptyForm(): RuleForm {
  return {
    reasonCode: "",
    label: "",
    description: "",
    monthlyLimit: 1,
    coversMinutes: 30,
    requiresApproval: true,
    requiresAttachment: false,
    allowAfterDeadline: false,
    behaviorWhenExceeded: "HR_REVIEW",
    sortOrder: 0,
    enabled: true,
    requiresComment: false,
  };
}

function formFromReason(reason: AttendanceLateReason): RuleForm {
  return {
    reasonCode: reason.reasonCode || reason.name,
    label: reason.label || reason.name,
    description: reason.description || "",
    monthlyLimit: Number(reason.monthlyLimit || 0),
    coversMinutes: Number(reason.coversMinutes || 0),
    requiresApproval: reason.requiresApproval !== false,
    requiresAttachment: Boolean(reason.requiresAttachment),
    allowAfterDeadline: Boolean(reason.allowAfterDeadline),
    behaviorWhenExceeded:
      (reason.behaviorWhenExceeded ||
        "HR_REVIEW") as LatenessReasonBehavior,
    sortOrder: Number(reason.sortOrder || 0),
    enabled: reason.enabled !== false && reason.isActive !== false,
    requiresComment: Boolean(reason.requiresComment),
  };
}

function normalizeCode(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_");
}

function payload(form: RuleForm) {
  return {
    ...form,
    reasonCode: normalizeCode(form.reasonCode || form.label),
    name: form.label.trim(),
    label: form.label.trim(),
    description: form.description.trim() || null,
    isActive: form.enabled,
  };
}

function behaviorLabel(value: LatenessReasonBehavior): string {
  if (value === "BLOCK") return "Block submission";
  if (value === "MARK_INVALID") return "Accept but mark invalid";
  return "Send to HR review";
}

export default function HrLateReasonsPage() {
  const permissions = useMyPermissions();
  const me = useMe();

  const roles: string[] = (me.data as any)?.data?.roles || [];
  const query = useHrLateReasons();
  const creditConfig = useLatenessCreditConfig();
  const updateCreditConfig = useUpdateLatenessCreditConfig();
  const create = useCreateHrLateReason();
  const update = useUpdateHrLateReason();
  const deactivate = useDeactivateHrLateReason();

  const canManage =
    permissions.hasAny("attendance.manage") ||
    roles.includes("BUSINESS_ADMIN") ||
    roles.includes("HR_MANAGER");

  const reasons = query.data?.data?.reasons || [];
  const currentCreditConfig = creditConfig.data?.data?.config;

  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editingReason, setEditingReason] =
    React.useState<AttendanceLateReason | null>(null);
  const [form, setForm] = React.useState<RuleForm>(emptyForm());
  const [formError, setFormError] = React.useState("");

  const openCreate = () => {
    setEditingReason(null);
    setForm(emptyForm());
    setFormError("");
    setEditorOpen(true);
  };

  const openEdit = (reason: AttendanceLateReason) => {
    setEditingReason(reason);
    setForm(formFromReason(reason));
    setFormError("");
    setEditorOpen(true);
  };

  const closeEditor = () => {
    if (create.isPending || update.isPending) return;
    setEditorOpen(false);
    setEditingReason(null);
    setForm(emptyForm());
    setFormError("");
  };

  const saveRule = async () => {
    setFormError("");

    if (!form.label.trim()) {
      setFormError("Label is required.");
      return;
    }

    if (!normalizeCode(form.reasonCode || form.label)) {
      setFormError("Reason code is required.");
      return;
    }

    try {
      if (editingReason) {
        await update.mutateAsync({
          reasonId: editingReason.id,
          data: payload(form),
        });
      } else {
        await create.mutateAsync(payload(form));
      }

      closeEditor();
    } catch (caught: any) {
      setFormError(
        caught?.response?.data?.message ||
          caught?.message ||
          "Failed to save reason rule.",
      );
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Business Attendance"
        title="Late Reason Rules"
        description="Manage lateness credit behavior and the reason categories available to employees."
      />

      {canManage ? (
        <CreditConfigPanel
          config={currentCreditConfig}
          isLoading={creditConfig.isLoading}
          isSaving={updateCreditConfig.isPending}
          onSave={(config) =>
            updateCreditConfig.mutateAsync(config)
          }
        />
      ) : null}

      <LatenessPanel
        title="Reason rules"
        description={`${reasons.length} configured reason ${
          reasons.length === 1 ? "rule" : "rules"
        }.`}
        action={
          canManage ? (
            <Button
              type="button"
              onClick={openCreate}
              className="h-9 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              New reason
            </Button>
          ) : null
        }
      >
        {query.isLoading ? (
          <LoadingSpinner label="Loading reason rules..." />
        ) : null}

        {query.isError ? (
          <InfoAlert
            variant="error"
            message="Failed to load lateness reason rules."
            className="mb-4"
          />
        ) : null}

        {!query.isLoading && reasons.length ? (
          <LatenessTable
            columns={[
              "Reason",
              "Credit",
              "Requirements",
              "Exceeded behavior",
              "Status",
              "Actions",
            ]}
          >
            {reasons.map((reason: AttendanceLateReason) => {
              const enabled =
                reason.enabled !== false &&
                reason.isActive !== false;

              return (
                <tr key={reason.id}>
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">
                      {reason.label || reason.name}
                    </p>
                    <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      {reason.reasonCode}
                    </p>
                    {reason.description ? (
                      <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">
                        {reason.description}
                      </p>
                    ) : null}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">
                    {currentCreditConfig?.mode === "GLOBAL_POOL" ? (
                      <>
                        <p className="font-semibold text-slate-800">
                          Shared pool
                        </p>
                        <p className="mt-0.5">
                          {currentCreditConfig.globalMonthlyLimit}/month ·{" "}
                          {currentCreditConfig.globalCoversMinutes} min
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold text-slate-800">
                          {reason.monthlyLimit}/month
                        </p>
                        <p className="mt-0.5">
                          Covers {reason.coversMinutes} min
                        </p>
                      </>
                    )}
                  </td>

                  <td className="px-4 py-3 text-xs text-slate-600">
                    <div className="flex flex-wrap gap-1.5">
                      {reason.requiresApproval !== false ? (
                        <LatenessStatusBadge value="approval" />
                      ) : null}
                      {reason.requiresAttachment ? (
                        <LatenessStatusBadge value="attachment" />
                      ) : null}
                      {reason.requiresComment ? (
                        <LatenessStatusBadge value="comment" />
                      ) : null}
                      {reason.allowAfterDeadline ? (
                        <LatenessStatusBadge value="after deadline" />
                      ) : null}
                      {reason.requiresApproval === false &&
                      !reason.requiresAttachment &&
                      !reason.requiresComment &&
                      !reason.allowAfterDeadline ? (
                        <span className="text-xs text-slate-400">None</span>
                      ) : null}
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-xs font-medium text-slate-700">
                    {behaviorLabel(
                      (reason.behaviorWhenExceeded ||
                        "HR_REVIEW") as LatenessReasonBehavior,
                    )}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3">
                    <LatenessStatusBadge
                      value={enabled ? "active" : "disabled"}
                    />
                  </td>

                  <td className="whitespace-nowrap px-4 py-3">
                    {canManage ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(reason)}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>

                        {enabled ? (
                          <button
                            type="button"
                            onClick={() =>
                              deactivate.mutateAsync(reason.id)
                            }
                            disabled={deactivate.isPending}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Disable
                          </button>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">Read only</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </LatenessTable>
        ) : !query.isLoading ? (
          <LatenessEmptyState
            title="No reason rules configured"
            description="Create the first lateness reason to make it available to employees."
          />
        ) : null}
      </LatenessPanel>

      {editorOpen ? (
        <RuleEditorDialog
          form={form}
          setForm={setForm}
          error={formError}
          editing={Boolean(editingReason)}
          creditConfig={currentCreditConfig}
          saving={create.isPending || update.isPending}
          onClose={closeEditor}
          onSave={saveRule}
        />
      ) : null}
    </div>
  );
}

function CreditConfigPanel({
  config,
  isLoading,
  isSaving,
  onSave,
}: {
  config?: LatenessCreditConfig;
  isLoading: boolean;
  isSaving: boolean;
  onSave: (config: LatenessCreditConfig) => Promise<any>;
}) {
  const [form, setForm] = React.useState<LatenessCreditConfig>({
    mode: "PER_REASON",
    globalMonthlyLimit: 3,
    globalCoversMinutes: 60,
    behaviorWhenExceeded: "HR_REVIEW",
  });
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (config) setForm(config);
  }, [config]);

  return (
    <LatenessPanel
      title="Credit settings"
      description="Choose whether each reason has its own credit or all reasons use one shared monthly pool."
      action={<Settings2 className="h-4 w-4 text-slate-400" />}
    >
      {isLoading ? (
        <LoadingSpinner label="Loading credit settings..." />
      ) : null}

      {error ? (
        <InfoAlert variant="error" message={error} className="mb-4" />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-4">
        <LatenessField label="Credit mode">
          <select
            value={form.mode}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                mode: event.target.value as LatenessCreditMode,
              }))
            }
            className={LATENESS_CONTROL_CLASS}
          >
            <option value="PER_REASON">
              Separate credit for each reason
            </option>
            <option value="GLOBAL_POOL">
              One shared monthly credit
            </option>
          </select>
        </LatenessField>

        <LatenessField label="Monthly uses">
          <input
            type="number"
            min={0}
            value={form.globalMonthlyLimit}
            disabled={form.mode !== "GLOBAL_POOL"}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                globalMonthlyLimit: Number(event.target.value),
              }))
            }
            className={LATENESS_CONTROL_CLASS}
          />
        </LatenessField>

        <LatenessField label="Minutes covered">
          <input
            type="number"
            min={0}
            value={form.globalCoversMinutes}
            disabled={form.mode !== "GLOBAL_POOL"}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                globalCoversMinutes: Number(event.target.value),
              }))
            }
            className={LATENESS_CONTROL_CLASS}
          />
        </LatenessField>

        <LatenessField label="When credit is exceeded">
          <select
            value={form.behaviorWhenExceeded}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                behaviorWhenExceeded:
                  event.target.value as LatenessReasonBehavior,
              }))
            }
            className={LATENESS_CONTROL_CLASS}
          >
            {BEHAVIORS.map((behavior) => (
              <option key={behavior} value={behavior}>
                {behaviorLabel(behavior)}
              </option>
            ))}
          </select>
        </LatenessField>
      </div>

      <div className="mt-4 flex flex-col gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-blue-700">
          {form.mode === "GLOBAL_POOL"
            ? "All enabled reasons consume the same monthly credit pool."
            : "Each reason uses its own monthly limit and covered minutes."}
        </p>

        <Button
          type="button"
          disabled={isSaving}
          onClick={async () => {
            setError("");

            try {
              await onSave(form);
            } catch (caught: any) {
              setError(
                caught?.response?.data?.message ||
                  caught?.message ||
                  "Failed to save credit settings.",
              );
            }
          }}
          className="h-9 shrink-0 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400"
        >
          {isSaving ? "Saving..." : "Save settings"}
        </Button>
      </div>
    </LatenessPanel>
  );
}

function RuleEditorDialog({
  form,
  setForm,
  error,
  editing,
  creditConfig,
  saving,
  onClose,
  onSave,
}: {
  form: RuleForm;
  setForm: React.Dispatch<React.SetStateAction<RuleForm>>;
  error: string;
  editing: boolean;
  creditConfig?: LatenessCreditConfig;
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  const isGlobalPool = creditConfig?.mode === "GLOBAL_POOL";

  const setField = <K extends keyof RuleForm>(
    key: K,
    value: RuleForm[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4">
      <button
        type="button"
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Close reason editor"
      />

      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-950">
              {editing ? "Edit reason rule" : "Create reason rule"}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Keep the rule name clear and use the switches only when required.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {error ? <InfoAlert variant="error" message={error} /> : null}

          <div className="grid gap-4 md:grid-cols-2">
            <LatenessField label="Reason label" required>
              <input
                value={form.label}
                onChange={(event) => setField("label", event.target.value)}
                className={LATENESS_CONTROL_CLASS}
                placeholder="Sickness"
              />
            </LatenessField>

            <LatenessField
              label="Reason code"
              required
              hint="Used internally and stored in uppercase."
            >
              <input
                value={form.reasonCode}
                onChange={(event) =>
                  setField("reasonCode", normalizeCode(event.target.value))
                }
                className={LATENESS_CONTROL_CLASS}
                placeholder="SICKNESS"
              />
            </LatenessField>
          </div>

          <LatenessField label="Description">
            <textarea
              value={form.description}
              onChange={(event) =>
                setField("description", event.target.value)
              }
              rows={3}
              className={LATENESS_TEXTAREA_CLASS}
              placeholder="Explain when employees should use this reason..."
            />
          </LatenessField>

          {isGlobalPool ? (
            <LatenessNotice
              tone="info"
              title="Shared credit mode is active"
              description={`${creditConfig?.globalMonthlyLimit ?? 0} uses per month covering ${creditConfig?.globalCoversMinutes ?? 0} minutes. Per-reason credit fields are not used.`}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              <LatenessField label="Monthly limit">
                <input
                  type="number"
                  min={0}
                  value={form.monthlyLimit}
                  onChange={(event) =>
                    setField("monthlyLimit", Number(event.target.value))
                  }
                  className={LATENESS_CONTROL_CLASS}
                />
              </LatenessField>

              <LatenessField label="Minutes covered">
                <input
                  type="number"
                  min={0}
                  value={form.coversMinutes}
                  onChange={(event) =>
                    setField("coversMinutes", Number(event.target.value))
                  }
                  className={LATENESS_CONTROL_CLASS}
                />
              </LatenessField>

              <LatenessField label="When exceeded">
                <select
                  value={form.behaviorWhenExceeded}
                  onChange={(event) =>
                    setField(
                      "behaviorWhenExceeded",
                      event.target.value as LatenessReasonBehavior,
                    )
                  }
                  className={LATENESS_CONTROL_CLASS}
                >
                  {BEHAVIORS.map((behavior) => (
                    <option key={behavior} value={behavior}>
                      {behaviorLabel(behavior)}
                    </option>
                  ))}
                </select>
              </LatenessField>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <LatenessSwitch
              label="Enabled"
              description="Employees can select this reason."
              checked={form.enabled}
              onChange={(value) => setField("enabled", value)}
            />
            <LatenessSwitch
              label="Requires approval"
              description="HR or an approver must review the notice."
              checked={form.requiresApproval}
              onChange={(value) => setField("requiresApproval", value)}
            />
            <LatenessSwitch
              label="Requires attachment"
              description="The employee must provide supporting evidence."
              checked={form.requiresAttachment}
              onChange={(value) => setField("requiresAttachment", value)}
            />
            <LatenessSwitch
              label="Requires comment"
              description="A written explanation is mandatory."
              checked={form.requiresComment}
              onChange={(value) => setField("requiresComment", value)}
            />
            <LatenessSwitch
              label="Allow after deadline"
              description="Employees may submit this reason after 08:30."
              checked={form.allowAfterDeadline}
              onChange={(value) => setField("allowAfterDeadline", value)}
            />

            <LatenessField label="Sort order">
              <input
                type="number"
                value={form.sortOrder}
                onChange={(event) =>
                  setField("sortOrder", Number(event.target.value))
                }
                className={LATENESS_CONTROL_CLASS}
              />
            </LatenessField>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4">
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={onClose}
            className="h-9 rounded-lg"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={saving}
            onClick={onSave}
            className="h-9 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400"
          >
            {saving
              ? "Saving..."
              : editing
                ? "Save changes"
                : "Create reason"}
          </Button>
        </div>
      </div>
    </div>
  );
}
