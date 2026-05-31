import React from "react";
import { useCreateHrLateReason, useDeactivateHrLateReason, useHrLateReasons, useUpdateHrLateReason } from "../../../hooks/useHrLateReasons";

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
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 sm:p-6">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">HR Attendance</div>
        <div className="text-[18px] font-black text-slate-900 tracking-tight mt-1">Late reasons</div>
        <div className="text-[12px] text-slate-600 font-semibold mt-1">Manage reusable categories employees select when checking in late.</div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-4 space-y-3">
        <div className="text-[12px] font-extrabold text-slate-900">Create reason</div>
        {formError ? <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">{formError}</div> : null}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input value={name} onChange={(e) => setName(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700" placeholder="Reason name" />
          <label className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
            <input type="checkbox" checked={requiresComment} onChange={(e) => setRequiresComment(e.target.checked)} className="h-4 w-4 accent-[#1a56db]" />
            <span className="text-xs font-semibold text-slate-700">Requires comment</span>
          </label>
        </div>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700" placeholder="Description (optional)" />
        <button
          onClick={async () => {
            setFormError("");
            if (name.trim().length < 2) {
              setFormError("Name is required.");
              return;
            }
            try {
              await create.mutateAsync({ name: name.trim(), description: description.trim() || null, requiresComment });
              setName("");
              setDescription("");
              setRequiresComment(false);
            } catch (e: any) {
              setFormError(e?.response?.data?.message || e?.message || "Failed to create reason");
            }
          }}
          disabled={create.isPending}
          className="bg-[#1a56db] hover:bg-[#124bbf] disabled:bg-slate-200 disabled:text-slate-400 font-bold text-white shadow-sm leading-none py-2.5 px-5 rounded-xl text-xs"
        >
          {create.isPending ? "Creating…" : "Create"}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="text-[12px] font-extrabold text-slate-900">Reasons</div>
          <div className="text-[11px] text-slate-600 font-semibold mt-0.5">{reasons.length} total</div>
        </div>

        {q.isLoading ? <div className="px-5 py-6 text-[12px] text-slate-600 font-semibold">Loading…</div> : null}
        {q.isError ? <div className="px-5 py-6 text-[12px] text-red-700 font-semibold">Failed to load reasons.</div> : null}

        <div className="divide-y divide-slate-100">
          {reasons.map((r: any) => (
            <ReasonRow
              key={r.id}
              r={r}
              onSave={async (data) => update.mutateAsync({ reasonId: r.id, data })}
              onDeactivate={async () => deactivate.mutateAsync(r.id)}
            />
          ))}
        </div>
      </div>
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
      {err ? <div className="mb-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">{err}</div> : null}
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

