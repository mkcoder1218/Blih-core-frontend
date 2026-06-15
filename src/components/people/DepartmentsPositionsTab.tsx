import React from "react";
import { Building2, Briefcase, Save } from "lucide-react";
import { useCreateDepartment, useDepartments, useUpdateDepartment } from "../../hooks/useDepartments";
import { useCreatePosition, usePositions, useUpdatePosition } from "../../hooks/usePositions";
import { useMyPermissions } from "../../hooks/usePermissions";
import type { Department, Position } from "../../api/types";

export default function DepartmentsPositionsTab({ showAlert }: { showAlert: (title: string, type?: "success" | "info" | "error") => void }) {
  const perms = useMyPermissions();
  const canCreateDept = perms.hasAny("department.create");
  const canUpdateDept = perms.hasAny("department.update");
  const canCreatePos = perms.hasAny("position.create");
  const canUpdatePos = perms.hasAny("position.update");
  const departments = useDepartments();
  const positions = usePositions();
  const createDept = useCreateDepartment();
  const updateDept = useUpdateDepartment();
  const createPos = useCreatePosition();
  const updatePos = useUpdatePosition();
  const [deptName, setDeptName] = React.useState("");
  const [posTitle, setPosTitle] = React.useState("");
  const [posDeptId, setPosDeptId] = React.useState("");
  const [editingDept, setEditingDept] = React.useState<Record<string, string>>({});
  const [editingPos, setEditingPos] = React.useState<Record<string, { title: string; departmentId: string }>>({});

  const deptRows = departments.data?.departments || [];
  const posRows = positions.data?.positions || [];

  const saveDept = async () => {
    if (!deptName.trim()) return;
    await createDept.mutateAsync({ name: deptName.trim() });
    setDeptName("");
    showAlert("Department created", "success");
  };

  const savePos = async () => {
    if (!posTitle.trim() || !posDeptId) return;
    await createPos.mutateAsync({ title: posTitle.trim(), departmentId: posDeptId });
    setPosTitle("");
    setPosDeptId("");
    showAlert("Position created", "success");
  };

  return (
    <div className="space-y-5">
      <div>
        <h4 className="text-sm font-bold text-slate-950 tracking-tight">Departments & Positions</h4>
        <p className="text-[11px] text-slate-500 font-medium">Create and update the values used in employee and public registration dropdowns.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 font-black text-sm"><Building2 className="w-4 h-4 text-blue-600" /> Departments</div>
          </div>
          {canCreateDept && (
            <div className="p-4 border-b border-slate-100 flex gap-2">
              <input value={deptName} onChange={(e) => setDeptName(e.target.value)} placeholder="New department name" className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold" />
              <button onClick={saveDept} disabled={createDept.isPending} className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white">Create</button>
            </div>
          )}
          <div className="divide-y divide-slate-100">
            {deptRows.map((dept: Department) => {
              const value = editingDept[dept.id] ?? dept.name;
              return (
                <div key={dept.id} className="p-4 flex items-center gap-2">
                  <input disabled={!canUpdateDept} value={value} onChange={(e) => setEditingDept((p) => ({ ...p, [dept.id]: e.target.value }))} className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold disabled:bg-slate-50" />
                  {canUpdateDept && (
                    <button onClick={async () => { await updateDept.mutateAsync({ id: dept.id, name: value }); showAlert("Department updated", "success"); }} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700">
                      <Save className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2 font-black text-sm"><Briefcase className="w-4 h-4 text-blue-600" /> Positions</div>
          {canCreatePos && (
            <div className="p-4 border-b border-slate-100 grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2">
              <input value={posTitle} onChange={(e) => setPosTitle(e.target.value)} placeholder="New position title" className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold" />
              <select value={posDeptId} onChange={(e) => setPosDeptId(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold">
                <option value="">Select department</option>
                {deptRows.map((dept: Department) => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
              </select>
              <button onClick={savePos} disabled={createPos.isPending} className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white">Create</button>
            </div>
          )}
          <div className="divide-y divide-slate-100">
            {posRows.map((pos: Position) => {
              const value = editingPos[pos.id] || { title: pos.title, departmentId: pos.departmentId || "" };
              return (
                <div key={pos.id} className="p-4 grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2">
                  <input disabled={!canUpdatePos} value={value.title} onChange={(e) => setEditingPos((p) => ({ ...p, [pos.id]: { ...value, title: e.target.value } }))} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold disabled:bg-slate-50" />
                  <select disabled={!canUpdatePos} value={value.departmentId} onChange={(e) => setEditingPos((p) => ({ ...p, [pos.id]: { ...value, departmentId: e.target.value } }))} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold disabled:bg-slate-50">
                    <option value="">No department</option>
                    {deptRows.map((dept: Department) => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                  </select>
                  {canUpdatePos && (
                    <button onClick={async () => { await updatePos.mutateAsync({ id: pos.id, title: value.title, departmentId: value.departmentId || null }); showAlert("Position updated", "success"); }} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700">
                      <Save className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
