import React from "react";
import { useCreateHrLateReason, useDeactivateHrLateReason, useHrLateReasons, useUpdateHrLateReason } from "../../../hooks/useHrLateReasons";
import { useMyPermissions } from "../../../hooks/usePermissions";
import { useMe } from "../../../hooks/useMe";
import { PageHeader, SectionCard, InfoAlert, LoadingSpinner } from "@/components/ui/blih";
import { Button } from "@/components/ui/button";
import type { AttendanceLateReason, LatenessReasonBehavior } from "../../../api/attendanceLateReasons";

const BEHAVIORS: LatenessReasonBehavior[] = ["BLOCK", "MARK_INVALID", "HR_REVIEW"];

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

function formFromReason(r: AttendanceLateReason): RuleForm {
  return {
    reasonCode: r.reasonCode || r.name,
    label: r.label || r.name,
    description: r.description || "",
    monthlyLimit: Number(r.monthlyLimit || 0),
    coversMinutes: Number(r.coversMinutes || 0),
    requiresApproval: r.requiresApproval !== false,
    requiresAttachment: Boolean(r.requiresAttachment),
    allowAfterDeadline: Boolean(r.allowAfterDeadline),
    behaviorWhenExceeded: (r.behaviorWhenExceeded || "HR_REVIEW") as LatenessReasonBehavior,
    sortOrder: Number(r.sortOrder || 0),
    enabled: r.enabled !== false && r.isActive !== false,
    requiresComment: Boolean(r.requiresComment),
  };
}

function normalizeCode(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_");
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

export default function HrLateReasonsPage() {
  const perms = useMyPermissions();
  const me = useMe();
  const roles: string[] = (me.data as any)?.data?.roles || [];
  const q = useHrLateReasons();
  const create = useCreateHrLateReason();
  const update = useUpdateHrLateReason();
  const deactivate = useDeactivateHrLateReason();
  const canManage = perms.hasAny("attendance.manage") || roles.includes("BUSINESS_ADMIN") || roles.includes("HR_MANAGER");
  const reasons = q.data?.data?.reasons || [];
  const [form, setForm] = React.useState<RuleForm>(emptyForm());
  const [formError, setFormError] = React.useState("");

  const setField = <K extends keyof RuleForm>(key: K, value: RuleForm[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Business Attendance"
        title="Late Reason Rules"
        description="Configure each lateness reason separately for this business."
      />

      {canManage && (
        <SectionCard title="Create Reason Rule">
          {formError && <InfoAlert variant="error" message={formError} className="mb-3" />}
          <RuleFields form={form} setField={setField} />
          <Button
            onClick={async () => {
              setFormError("");
              if (!form.label.trim()) return setFormError("Label is required.");
              if (!normalizeCode(form.reasonCode || form.label)) return setFormError("Reason code is required.");
              try {
                await create.mutateAsync(payload(form));
                setForm(emptyForm());
              } catch (e: any) {
                setFormError(e?.response?.data?.message || e?.message || "Failed to create reason rule");
              }
            }}
            disabled={create.isPending}
            className="mt-4 bg-[#1a56db] hover:bg-[#124bbf] disabled:bg-slate-200 disabled:text-slate-400 font-bold text-white text-xs h-9 rounded-xl"
          >
            {create.isPending ? "Creating..." : "Create Rule"}
          </Button>
        </SectionCard>
      )}

      <SectionCard title="Reason Rules" description={`${reasons.length} total`}>
        {q.isLoading && <LoadingSpinner label="Loading..." />}
        {q.isError && <InfoAlert variant="error" message="Failed to load lateness reason rules." />}
        <div className="divide-y divide-slate-100">
          {reasons.map((r) => (
            <div key={r.id}>
              <ReasonRow
                r={r}
                canManage={canManage}
                onSave={(data) => update.mutateAsync({ reasonId: r.id, data })}
                onDeactivate={() => deactivate.mutateAsync(r.id)}
              />
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function RuleFields({ form, setField }: { form: RuleForm; setField: <K extends keyof RuleForm>(key: K, value: RuleForm[K]) => void }) {
  const inputClass = "bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700";
  const labelClass = "text-[10px] font-bold uppercase tracking-wider text-slate-400";
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Field label="Reason code">
          <input value={form.reasonCode} onChange={(e) => setField("reasonCode", normalizeCode(e.target.value))} className={inputClass} placeholder="SICKNESS" />
        </Field>
        <Field label="Label">
          <input value={form.label} onChange={(e) => setField("label", e.target.value)} className={inputClass} placeholder="Sickness" />
        </Field>
        <Field label="Monthly limit">
          <input type="number" min={0} value={form.monthlyLimit} onChange={(e) => setField("monthlyLimit", Number(e.target.value))} className={inputClass} />
        </Field>
        <Field label="Covers minutes">
          <input type="number" min={0} value={form.coversMinutes} onChange={(e) => setField("coversMinutes", Number(e.target.value))} className={inputClass} />
        </Field>
      </div>

      <textarea value={form.description} onChange={(e) => setField("description", e.target.value)} rows={2} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700" placeholder="Description (optional)" />

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <Field label="Exceeded behavior">
          <select value={form.behaviorWhenExceeded} onChange={(e) => setField("behaviorWhenExceeded", e.target.value as LatenessReasonBehavior)} className={inputClass}>
            {BEHAVIORS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </Field>
        <Field label="Sort order">
          <input type="number" value={form.sortOrder} onChange={(e) => setField("sortOrder", Number(e.target.value))} className={inputClass} />
        </Field>
        <Toggle label="Enabled" checked={form.enabled} onChange={(value) => setField("enabled", value)} />
        <Toggle label="Requires approval" checked={form.requiresApproval} onChange={(value) => setField("requiresApproval", value)} />
        <Toggle label="Requires attachment" checked={form.requiresAttachment} onChange={(value) => setField("requiresAttachment", value)} />
      </div>
      <div className="flex flex-wrap gap-3">
        <Toggle label="Allow after deadline" checked={form.allowAfterDeadline} onChange={(value) => setField("allowAfterDeadline", value)} />
        <Toggle label="Requires comment" checked={form.requiresComment} onChange={(value) => setField("requiresComment", value)} />
      </div>
      <div className={labelClass}>Examples: SICKNESS 2 / 60, TRANSPORT 1 / 30, FAMILY_EMERGENCY 2 / 120, MEDICAL_APPOINTMENT 2 / 90 with attachment, OTHER 0 / 0 with HR_REVIEW.</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="flex flex-col gap-1.5"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>{children}</label>;
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[#1a56db]" />
      <span className="text-xs font-semibold text-slate-700">{label}</span>
    </label>
  );
}

function ReasonRow({ r, canManage, onSave, onDeactivate }: {
  r: AttendanceLateReason;
  canManage: boolean;
  onSave: (data: any) => Promise<any>;
  onDeactivate: () => Promise<any>;
}) {
  const [editing, setEditing] = React.useState(false);
  const [form, setForm] = React.useState<RuleForm>(formFromReason(r));
  const [err, setErr] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const setField = <K extends keyof RuleForm>(key: K, value: RuleForm[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="px-5 py-4">
      {err ? <InfoAlert variant="error" message={err} className="mb-2" /> : null}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {editing ? (
            <RuleFields form={form} setField={setField} />
          ) : (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-[13px] font-extrabold text-slate-900">{r.label || r.name}</div>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-600">{r.reasonCode}</span>
                {r.enabled === false || r.isActive === false ? <span className="rounded-full bg-rose-50 px-2 py-1 text-[10px] font-black text-rose-700">Disabled</span> : null}
              </div>
              <div className="text-[11px] text-slate-600 font-semibold">{r.description || "-"}</div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[11px] font-bold text-slate-600">
                <span>Limit: {r.monthlyLimit}/month</span>
                <span>Covers: {r.coversMinutes} min</span>
                <span>Exceeded: {r.behaviorWhenExceeded}</span>
                <span>Approval: {r.requiresApproval === false ? "No" : "Yes"}</span>
                <span>Attachment: {r.requiresAttachment ? "Yes" : "No"}</span>
              </div>
            </div>
          )}
        </div>

        {canManage && (
          <div className="flex gap-2 shrink-0">
            {editing ? (
              <>
                <button onClick={() => { setForm(formFromReason(r)); setEditing(false); }} className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl" disabled={saving}>Cancel</button>
                <button
                  onClick={async () => {
                    setErr("");
                    setSaving(true);
                    try {
                      await onSave(payload(form));
                      setEditing(false);
                    } catch (e: any) {
                      setErr(e?.response?.data?.message || e?.message || "Save failed");
                    } finally {
                      setSaving(false);
                    }
                  }}
                  className="text-xs font-extrabold bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-xl"
                  disabled={saving}
                >
                  Save
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setEditing(true)} className="text-xs font-extrabold bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-xl">Edit</button>
                {r.enabled !== false && r.isActive !== false ? (
                  <button onClick={onDeactivate} className="text-xs font-extrabold bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-2 rounded-xl">Disable</button>
                ) : null}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
