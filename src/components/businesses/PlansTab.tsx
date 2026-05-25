import React, { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { usePlans } from "../../hooks/usePlans";
import { useCreatePlan } from "../../hooks/useCreatePlan";
import { useUpdatePlan } from "../../hooks/useUpdatePlan";
import { useDeletePlan } from "../../hooks/useDeletePlan";
import type { Plan } from "../../api/types";

export default function PlansTab({ showAlert }: { showAlert: (msg: string, type?: "success" | "info" | "error") => void }) {
  const plansQuery = usePlans();
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();

  const plans: Plan[] = plansQuery.data?.data?.plans || [];

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [priceMonthly, setPriceMonthly] = useState<number>(0);
  const [userLimit, setUserLimit] = useState<number | "">( "");
  const [status, setStatus] = useState<"active" | "inactive">("active");

  const sorted = useMemo(() => {
    return [...plans].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [plans]);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setKey("");
    setPriceMonthly(0);
    setUserLimit("");
    setStatus("active");
    setModalOpen(true);
  };

  const openEdit = (p: Plan) => {
    setEditing(p);
    setName(p.name || "");
    setKey(p.key || "");
    setPriceMonthly(Number(p.priceMonthly || 0));
    setUserLimit(typeof p.userLimit === "number" ? p.userLimit : "");
    setStatus((p.status as any) === "inactive" ? "inactive" : "active");
    setModalOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !key) {
      showAlert("Name and key are required.", "error");
      return;
    }
    try {
      if (editing) {
        await updatePlan.mutateAsync({
          id: editing.id,
          data: { name, key, priceMonthly, userLimit: userLimit === "" ? null : Number(userLimit), status },
        });
        showAlert("Plan updated.", "success");
      } else {
        await createPlan.mutateAsync({ name, key, priceMonthly, userLimit: userLimit === "" ? null : Number(userLimit), status });
        showAlert("Plan created.", "success");
      }
      setModalOpen(false);
    } catch (e: any) {
      showAlert(e?.response?.data?.message || e?.message || "Save failed", "error");
    }
  };

  const onDelete = async (p: Plan) => {
    if (!confirm(`Delete plan "${p.name}"?`)) return;
    try {
      await deletePlan.mutateAsync(p.id);
      showAlert("Plan deleted.", "success");
    } catch (e: any) {
      showAlert(e?.response?.data?.message || e?.message || "Delete failed", "error");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-black text-slate-900">Plans</div>
          <div className="text-xs text-slate-500 font-medium mt-1">Create and manage plans used by businesses.</div>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-[#1a56db] hover:bg-[#124bbf] text-white px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer">
          <Plus className="w-4 h-4" />
          Create Plan
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-[0_5px_22px_rgba(0,0,0,0.01)]">
        {plansQuery.isLoading ? (
          <div className="p-10 text-xs text-slate-500">Loading plans...</div>
        ) : plansQuery.isError ? (
          <div className="p-10 text-xs text-rose-600">{(plansQuery.error as any)?.response?.data?.message || (plansQuery.error as any)?.message || "Failed to load"}</div>
        ) : sorted.length === 0 ? (
          <div className="p-10 text-xs text-slate-500">No plans found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 select-none">
                  <th className="py-3 px-6">Name</th>
                  <th className="py-3 px-4">Key</th>
                  <th className="py-3 px-4">Monthly</th>
                  <th className="py-3 px-4">User Limit</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {sorted.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900">{p.name}</td>
                    <td className="py-4 px-4 font-mono text-slate-600">{p.key}</td>
                    <td className="py-4 px-4 text-slate-700">{Number(p.priceMonthly || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="py-4 px-4 text-slate-700">{p.userLimit == null ? "∞" : p.userLimit}</td>
                    <td className="py-4 px-4">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${p.status === "active" ? "text-emerald-700" : "text-slate-400"}`}>{p.status}</span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center gap-1.5 justify-end">
                        <button onClick={() => openEdit(p)} className="p-1 px-2.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-pointer" title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => onDelete(p)} className="p-1 px-2.5 hover:bg-rose-50 text-slate-500 hover:text-rose-700 rounded-lg transition-colors cursor-pointer" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs animate-fade-in">
            <div className="absolute inset-0" onClick={() => setModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 z-20 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <h4 className="text-[13px] font-bold text-slate-900">{editing ? "Update Plan" : "Create Plan"}</h4>
                <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-800 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={onSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Name</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-50 focus:bg-white px-3.5 py-2.5 rounded-xl border border-slate-200/80 focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db] focus:outline-none font-semibold text-xs text-slate-700 transition-all" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Key</label>
                    <input value={key} onChange={(e) => setKey(e.target.value)} className="w-full bg-slate-50 focus:bg-white px-3.5 py-2.5 rounded-xl border border-slate-200/80 focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db] focus:outline-none font-semibold text-xs text-slate-700 transition-all" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Monthly</label>
                    <input type="number" min={0} step="0.01" value={priceMonthly} onChange={(e) => setPriceMonthly(Number(e.target.value))} className="w-full bg-slate-50 focus:bg-white px-3.5 py-2.5 rounded-xl border border-slate-200/80 focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db] focus:outline-none font-semibold text-xs text-slate-700 transition-all" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">User Limit</label>
                    <input type="number" min={0} value={userLimit} onChange={(e) => setUserLimit(e.target.value === "" ? "" : Number(e.target.value))} placeholder="∞" className="w-full bg-slate-50 focus:bg-white px-3.5 py-2.5 rounded-xl border border-slate-200/80 focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db] focus:outline-none font-semibold text-xs text-slate-700 transition-all" />
                    <div className="text-[10px] text-slate-400 font-medium">Optional. Leave blank for unlimited.</div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-200/80 focus:outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db] font-semibold text-xs text-slate-700 cursor-pointer">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                  <button type="button" onClick={() => setModalOpen(false)} className="px-4 text-slate-500 font-bold hover:bg-slate-50 leading-none py-2.5 rounded-xl text-xs cursor-pointer">Cancel</button>
                  <button type="submit" disabled={createPlan.isPending || updatePlan.isPending} className="bg-[#1a56db] hover:bg-[#124bbf] disabled:bg-slate-200 disabled:text-slate-400 font-bold text-white shadow-sm leading-none py-2.5 px-5 rounded-xl text-xs cursor-pointer select-none">
                    {editing ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
