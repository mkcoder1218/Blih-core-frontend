import React from "react";
import { useCreateHrLateReason, useDeactivateHrLateReason, useHrLateReasons, useUpdateHrLateReason } from "../../../hooks/useHrLateReasons";
import { PageHeader, SectionCard, InfoAlert, LoadingSpinner } from "@/components/ui/blih";
import { Button } from "@/components/ui/button";

export default function HrLateReasonsPage() {
  const q = useHrLateReasons();
  const create = useCreateHrLateReason();
  const update = useUpdateHrLateReason();
  const deactivate = useDeactivateHrLateReason();

  const reasons = q.data?.data?.reasons || [];

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [requiresComment, setRequiresComment] = React.useState(false);
  const [formError, setFormError] = React.useState("");

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="HR Attendance"
        title="Late Reasons"
        description="Manage reusable categories employees select when checking in late."
      />

      <SectionCard title="Create Reason">
        {formError && <InfoAlert variant="error" message={formError} className="mb-3" />}
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={name} onChange={(e) => setName(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700" placeholder="Reason name" />
            <label className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
              <input type="checkbox" checked={requiresComment} onChange={(e) => setRequiresComment(e.target.checked)} className="h-4 w-4 accent-[#1a56db]" />
              <span className="text-xs font-semibold text-slate-700">Requires comment</span>
            </label>
          </div>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700" placeholder="Description (optional)" />
          <Button
            onClick={async () => {
              setFormError("");
              if (name.trim().length < 2) { setFormError("Name is required."); return; }
              try {
                await create.mutateAsync({ name: name.trim(), description: description.trim() || null, requiresComment });
                setName(""); setDescription(""); setRequiresComment(false);
              } catch (e: any) {
                setFormError(e?.response?.data?.message || e?.message || "Failed to create reason");
              }
            }}
            disabled={create.isPending}
            className="bg-[#1a56db] hover:bg-[#124bbf] disabled:bg-slate-200 disabled:text-slate-400 font-bold text-white text-xs h-9 rounded-xl"
          >
            {create.isPending ? "Creating…" : "Create"}
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Reasons" description={`${reasons.length} total`}>
        {q.isLoading && <LoadingSpinner label="Loading…" />}
        {q.isError && <InfoAlert variant="error" message="Failed to load reasons." />}
        <div className="divide-y divide-slate-100">
          {reasons.map((r: any) => (
            <ReasonRow key={r.id} r={r} onSave={async (data) => update.mutateAsync({ reasonId: r.id, data })} onDeactivate={async () => deactivate.mutateAsync(r.id)} />
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function ReasonRow({
  r,
  onSave,
  onDeactivate,
}: {
  r: any;
  onSave: (data: any) => Promise<any>;
  onDeactivate: () => Promise<any>;
}) {
  const [editing, setEditing] = React.useState(false);
  const [name, setName] = React.useState(r.name);
  const [description, setDescription] = React.useState(r.description || "");
  const [requiresComment, setRequiresComment] = React.useState(Boolean(r.requiresComment));
  const [isActive, setIsActive] = React.useState(Boolean(r.isActive));
  const [err, setErr] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  return (
    <div className="px-5 py-4">
      {err ? <InfoAlert variant="error" message={err} className="mb-2" /> : null}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="space-y-2">
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700" />
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700" />
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={requiresComment} onChange={(e) => setRequiresComment(e.target.checked)} className="h-4 w-4 accent-[#1a56db]" />
                  <span className="text-xs font-semibold text-slate-700">Requires comment</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 accent-[#1a56db]" />
                  <span className="text-xs font-semibold text-slate-700">Active</span>
                </label>
              </div>
            </div>
          ) : (
            <div>
              <div className="text-[12px] font-extrabold text-slate-900 truncate">
                {r.name} {!r.isActive ? <span className="text-slate-400 font-bold">(inactive)</span> : null}
              </div>
              <div className="text-[11px] text-slate-600 font-semibold mt-0.5">{r.description || "—"}</div>
              <div className="text-[11px] text-slate-500 font-bold mt-1">
                Requires comment: {r.requiresComment ? "Yes" : "No"}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {editing ? (
            <>
              <button
                onClick={() => setEditing(false)}
                className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setErr("");
                  setSaving(true);
                  try {
                    await onSave({ name: name.trim(), description: description.trim() || null, requiresComment, isActive });
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
              <button onClick={() => setEditing(true)} className="text-xs font-extrabold bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-xl">
                Edit
              </button>
              {r.isActive ? (
                <button onClick={onDeactivate} className="text-xs font-extrabold bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-2 rounded-xl">
                  Deactivate
                </button>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

