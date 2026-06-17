import React from "react";
import { Building2, Briefcase, ChevronLeft, ChevronRight, Save, Trash2, X } from "lucide-react";
import { useCreateDepartment, useDeleteDepartment, useDepartments, useUpdateDepartment } from "../../hooks/useDepartments";
import { useCreatePosition, useDeletePosition, usePositions, useUpdatePosition } from "../../hooks/usePositions";
import { useMyPermissions } from "../../hooks/usePermissions";
import type { Department, Position } from "../../api/types";

export default function DepartmentsPositionsTab({ showAlert }: { showAlert: (title: string, type?: "success" | "info" | "error") => void }) {
  const perms = useMyPermissions();
  const canCreateDept = perms.hasAny("department.create");
  const canUpdateDept = perms.hasAny("department.update");
  const canCreatePos = perms.hasAny("position.create");
  const canUpdatePos = perms.hasAny("position.update");
  const canDeleteDept = perms.hasAny("department.delete");
  const canDeletePos = perms.hasAny("position.delete");
  const pageSize = 8;
  const [deptPage, setDeptPage] = React.useState(1);
  const [posPage, setPosPage] = React.useState(1);
  const departments = useDepartments({ page: deptPage, size: pageSize });
  const positions = usePositions({ page: posPage, size: pageSize });
  const allDepartmentsQuery = useDepartments({ page: 1, size: 1000 });
  const allPositionsQuery = usePositions({ page: 1, size: 1000 });
  const createDept = useCreateDepartment();
  const updateDept = useUpdateDepartment();
  const deleteDept = useDeleteDepartment();
  const createPos = useCreatePosition();
  const updatePos = useUpdatePosition();
  const deletePos = useDeletePosition();
  const [deptName, setDeptName] = React.useState("");
  const [posTitle, setPosTitle] = React.useState("");
  const [posDeptId, setPosDeptId] = React.useState("");
  const [editingDept, setEditingDept] = React.useState<Record<string, string>>({});
  const [editingPos, setEditingPos] = React.useState<Record<string, { title: string; departmentId: string }>>({});
  const [reassignTarget, setReassignTarget] = React.useState<null | {
    type: "department" | "position";
    id: string;
    name: string;
    assignedCount: number;
    employees: Array<{
      id: string;
      fullName: string;
      email?: string;
      employeeCode?: string;
      department?: { id: string; name: string } | null;
      position?: { id: string; title: string } | null;
    }>;
    replacementId: string;
    perEmployeeReplacement: Record<string, string>;
  }>(null);

  const deptRows = departments.data?.departments || [];
  const posRows = positions.data?.positions || [];
  const allDeptRows = allDepartmentsQuery.data?.departments || deptRows;
  const allPosRows = allPositionsQuery.data?.positions || posRows;
  const deptCount = departments.data?.count ?? deptRows.length;
  const posCount = positions.data?.count ?? posRows.length;
  const affectedEmployees = reassignTarget?.employees || [];
  const deptTotalPages = Math.max(1, Math.ceil(deptCount / pageSize));
  const posTotalPages = Math.max(1, Math.ceil(posCount / pageSize));

  React.useEffect(() => {
    setDeptPage((page) => Math.min(page, deptTotalPages));
  }, [deptTotalPages]);

  React.useEffect(() => {
    setPosPage((page) => Math.min(page, posTotalPages));
  }, [posTotalPages]);

  const saveDept = async () => {
    if (!deptName.trim()) return;
    await createDept.mutateAsync({ name: deptName.trim() });
    setDeptName("");
    setDeptPage(1);
    showAlert("Department created", "success");
  };

  const savePos = async () => {
    if (!posTitle.trim() || !posDeptId) return;
    await createPos.mutateAsync({ title: posTitle.trim(), departmentId: posDeptId });
    setPosTitle("");
    setPosDeptId("");
    setPosPage(1);
    showAlert("Position created", "success");
  };

  const requestDeleteDepartment = async (dept: Department) => {
    try {
      await deleteDept.mutateAsync({ id: dept.id });
      showAlert("Department deleted", "success");
    } catch (e: any) {
      const data = e?.response?.data?.data || e?.response?.data;
      if (e?.response?.status === 409 || data?.code === "REASSIGN_REQUIRED") {
        setReassignTarget({
          type: "department",
          id: dept.id,
          name: dept.name,
          assignedCount: data?.assignedCount || 0,
          employees: data?.employees || [],
          replacementId: "",
          perEmployeeReplacement: {},
        });
        return;
      }
      showAlert(e?.response?.data?.message || "Failed to delete department", "error");
    }
  };

  const requestDeletePosition = async (pos: Position) => {
    try {
      await deletePos.mutateAsync({ id: pos.id });
      showAlert("Position deleted", "success");
    } catch (e: any) {
      const data = e?.response?.data?.data || e?.response?.data;
      if (e?.response?.status === 409 || data?.code === "REASSIGN_REQUIRED") {
        setReassignTarget({
          type: "position",
          id: pos.id,
          name: pos.title,
          assignedCount: data?.assignedCount || 0,
          employees: data?.employees || [],
          replacementId: "",
          perEmployeeReplacement: {},
        });
        return;
      }
      showAlert(e?.response?.data?.message || "Failed to delete position", "error");
    }
  };

  const confirmReassignDelete = async () => {
    if (!reassignTarget) return;
    const rows = affectedEmployees.map((employee) => ({
      employeeRecordId: employee.id,
      replacementId: reassignTarget.perEmployeeReplacement[employee.id] || "",
    }));
    if (rows.some((row) => !row.replacementId)) return;
    if (reassignTarget.type === "department") {
      await deleteDept.mutateAsync({
        id: reassignTarget.id,
        employeeReassignments: rows.map((row) => ({ employeeRecordId: row.employeeRecordId, departmentId: row.replacementId })),
      });
      showAlert("Employees reassigned and department deleted", "success");
    } else {
      await deletePos.mutateAsync({
        id: reassignTarget.id,
        employeeReassignments: rows.map((row) => ({ employeeRecordId: row.employeeRecordId, positionId: row.replacementId })),
      });
      showAlert("Employees reassigned and position deleted", "success");
    }
    setReassignTarget(null);
  };
  const allAffectedEmployeesAssigned = affectedEmployees.length > 0 && affectedEmployees.every((employee) => Boolean(reassignTarget?.perEmployeeReplacement[employee.id]));

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
            <div className="text-[11px] font-bold text-slate-400">{deptCount} total</div>
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
                  <div className="flex items-center gap-2">
                  {canUpdateDept && (
                    <button onClick={async () => { await updateDept.mutateAsync({ id: dept.id, name: value }); showAlert("Department updated", "success"); }} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700">
                      <Save className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {canDeleteDept && (
                    <button onClick={() => requestDeleteDepartment(dept)} className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-black text-rose-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  </div>
                </div>
              );
            })}
            {!deptRows.length ? (
              <div className="p-6 text-center text-xs font-semibold text-slate-500">No departments yet.</div>
            ) : null}
          </div>
          <PaginationFooter
            page={deptPage}
            totalPages={deptTotalPages}
            total={deptCount}
            pageSize={pageSize}
            onPrev={() => setDeptPage((page) => Math.max(1, page - 1))}
            onNext={() => setDeptPage((page) => Math.min(deptTotalPages, page + 1))}
          />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 font-black text-sm"><Briefcase className="w-4 h-4 text-blue-600" /> Positions</div>
            <div className="text-[11px] font-bold text-slate-400">{posCount} total</div>
          </div>
          {canCreatePos && (
            <div className="p-4 border-b border-slate-100 grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2">
              <input value={posTitle} onChange={(e) => setPosTitle(e.target.value)} placeholder="New position title" className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold" />
              <select value={posDeptId} onChange={(e) => setPosDeptId(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold">
                <option value="">Select department</option>
                {allDeptRows.map((dept: Department) => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
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
                    {allDeptRows.map((dept: Department) => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                  </select>
                  <div className="flex items-center gap-2">
                  {canUpdatePos && (
                    <button onClick={async () => { await updatePos.mutateAsync({ id: pos.id, title: value.title, departmentId: value.departmentId || null }); showAlert("Position updated", "success"); }} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700">
                      <Save className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {canDeletePos && (
                    <button onClick={() => requestDeletePosition(pos)} className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-black text-rose-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  </div>
                </div>
              );
            })}
            {!posRows.length ? (
              <div className="p-6 text-center text-xs font-semibold text-slate-500">No positions yet.</div>
            ) : null}
          </div>
          <PaginationFooter
            page={posPage}
            totalPages={posTotalPages}
            total={posCount}
            pageSize={pageSize}
            onPrev={() => setPosPage((page) => Math.max(1, page - 1))}
            onNext={() => setPosPage((page) => Math.min(posTotalPages, page + 1))}
          />
        </section>
      </div>

      {reassignTarget && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white border border-slate-200 shadow-xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-950">Reassign before deleting</h3>
                <p className="text-[11px] font-semibold text-slate-500 mt-1">
                  {reassignTarget.assignedCount} employee{reassignTarget.assignedCount === 1 ? "" : "s"} use "{reassignTarget.name}". Choose a new {reassignTarget.type} for each employee.
                </p>
              </div>
              <button onClick={() => setReassignTarget(null)} className="rounded-lg p-1 hover:bg-slate-100">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="max-h-72 overflow-auto rounded-2xl border border-slate-200">
              <div className="grid grid-cols-[1.2fr_1fr_1fr_1.1fr] gap-2 bg-slate-50 px-3 py-2 text-[10px] font-black uppercase text-slate-400">
                <span>Employee</span>
                <span>Current Department</span>
                <span>Current Position</span>
                <span>Move To</span>
              </div>
              {affectedEmployees.length === 0 ? (
                <div className="px-3 py-4 text-xs font-semibold text-slate-500">Employee details were not returned. You can still choose a replacement.</div>
              ) : (
                affectedEmployees.map((employee) => (
                  <div key={employee.id} className="grid grid-cols-[1.2fr_1fr_1fr_1.1fr] gap-2 border-t border-slate-100 px-3 py-2 text-xs">
                    <div className="min-w-0">
                      <p className="truncate font-black text-slate-900">{employee.fullName}</p>
                      <p className="truncate text-[10px] font-semibold text-slate-400">{employee.email || employee.employeeCode || "-"}</p>
                    </div>
                    <div className="truncate font-semibold text-slate-600">{employee.department?.name || "Unassigned"}</div>
                    <div className="truncate font-semibold text-slate-600">{employee.position?.title || "Unassigned"}</div>
                    <select
                      value={reassignTarget.perEmployeeReplacement[employee.id] || ""}
                      onChange={(e) => setReassignTarget((prev) => prev ? {
                        ...prev,
                        perEmployeeReplacement: { ...prev.perEmployeeReplacement, [employee.id]: e.target.value },
                      } : prev)}
                      className="min-w-0 rounded-xl border border-slate-200 px-2 py-1.5 text-[11px] font-semibold"
                    >
                      <option value="">Select</option>
                      {reassignTarget.type === "department"
                        ? allDeptRows.filter((d: Department) => d.id !== reassignTarget.id).map((d: Department) => <option key={d.id} value={d.id}>{d.name}</option>)
                        : allPosRows.filter((p: Position) => p.id !== reassignTarget.id).map((p: Position) => <option key={p.id} value={p.id}>{p.title}</option>)
                      }
                    </select>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setReassignTarget(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-600">Cancel</button>
              <button
                disabled={!allAffectedEmployeesAssigned || deleteDept.isPending || deletePos.isPending}
                onClick={confirmReassignDelete}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-black text-white disabled:opacity-50"
              >
                Reassign and delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PaginationFooter({
  page,
  totalPages,
  total,
  pageSize,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-100 px-4 py-3">
      <div className="text-[11px] font-bold text-slate-500">
        Showing {start}-{end} of {total}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={page <= 1}
          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-[11px] font-black text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Prev
        </button>
        <div className="min-w-20 text-center text-[11px] font-black text-slate-500">
          Page {page} of {totalPages}
        </div>
        <button
          type="button"
          onClick={onNext}
          disabled={page >= totalPages}
          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-[11px] font-black text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white"
        >
          Next
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
