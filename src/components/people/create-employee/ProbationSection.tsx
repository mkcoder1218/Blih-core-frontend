import { CheckCircle2, Loader2 } from "lucide-react";
import { UserSearchSelect } from "../UserSearchSelect";
import { useEmployeeForm } from "./context";
import { FormField, inputClass } from "./FormField";

export default function ProbationSection() {
  const {
    mode, isIntern, requiresProbation, setRequiresProbation, formData, handleInputChange,
    finalApproverUserId, setFinalApproverUserId, probationExpectedEndDate,
    probationCompetencies, probationTotalWeight, probationCompetenciesReady,
    probationCompetenciesLoading,
  } = useEmployeeForm();
  if (mode !== "create" || isIntern) return null;

  return (
    <div className="col-span-2 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
      <label className="flex cursor-pointer items-start gap-3">
        <input type="checkbox" checked={requiresProbation} onChange={(e) => setRequiresProbation(e.currentTarget.checked)} className="mt-1 h-4 w-4 rounded" />
        <span><span className="block text-sm font-black text-blue-950">Initialize probation after employee creation</span><span className="text-[11px] font-medium text-blue-700">Create the employee and immediately start the tracked probation lifecycle.</span></span>
      </label>

      {requiresProbation ? (
        <div className="mt-4 space-y-4 border-t border-blue-100 pt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Probation Start Date" required><input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} className={inputClass} /></FormField>
            <FormField label="Duration (Months)" required><input type="number" min={1} name="probationPeriod" value={formData.probationPeriod} onChange={handleInputChange} className={inputClass} /></FormField>
            <FormField label="Final Approver"><UserSearchSelect value={finalApproverUserId} onChange={setFinalApproverUserId} placeholder="Search and select final approver..." /></FormField>
            <div className="rounded-xl border border-blue-100 bg-white px-4 py-3"><p className="text-[10px] font-black uppercase tracking-wider text-blue-500">Expected End Date</p><p className="mt-1 text-sm font-black text-blue-950">{new Date(`${probationExpectedEndDate}T00:00:00`).toLocaleDateString()}</p></div>
          </div>

          <div className="rounded-xl border border-blue-100 bg-white p-4">
            <div className="flex items-center justify-between"><div><p className="text-xs font-black text-slate-900">Position competencies</p><p className="mt-1 text-[10px] text-slate-500">Must total exactly 100%.</p></div><span className={`rounded-lg px-2.5 py-1 text-[10px] font-black ${probationCompetenciesReady ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{probationTotalWeight.toFixed(2)}%</span></div>
            {probationCompetenciesLoading ? <div className="flex items-center gap-2 py-5 text-xs text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Loading competencies...</div> : probationCompetencies.length ? <div className="mt-3 space-y-2">{probationCompetencies.map((item: any) => <div key={item.id} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs"><span className="font-bold text-slate-700">{item.name}</span><span className="font-black text-slate-500">{Number(item.weight).toFixed(2)}%</span></div>)}</div> : <p className="mt-3 rounded-lg bg-amber-50 p-3 text-[11px] font-bold text-amber-700">Configure probation competencies for this position first.</p>}
            {probationCompetenciesReady ? <p className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" />Ready to initialize probation</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
