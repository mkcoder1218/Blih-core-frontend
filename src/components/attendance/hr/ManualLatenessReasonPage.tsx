import React from "react";
import { AlertTriangle, Search } from "lucide-react";
import { PageHeader, SectionCard, InfoAlert, LoadingSpinner } from "@/components/ui/blih";
import { Button } from "@/components/ui/button";
import { useEmployees } from "../../../hooks/useHrRecords";
import { useHrLateReasons } from "../../../hooks/useHrLateReasons";
import { useAttendanceRequests, useSubmitAttendanceRequest } from "../../../hooks/useAttendanceRequests";

const ADDIS_ABABA_TZ = "Africa/Addis_Ababa";

function localYmd(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ADDIS_ABABA_TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function employeeName(employee: any) {
  return employee.fullName || employee.name || employee.User?.fullName || employee.user?.fullName || employee.email || "Employee";
}

function employeeUserId(employee: any) {
  return employee.userId || employee.id || employee.User?.id || employee.user?.id || "";
}

function employeeMeta(employee: any) {
  const profile = employee.BusinessUserProfile || employee.businessUserProfile || employee.profile || employee;
  const department = profile?.department?.name || profile?.Department?.name || employee.departmentName || "Unassigned";
  const position = profile?.position?.title || profile?.Position?.title || employee.positionTitle || employee.role || "";
  return [department, position].filter(Boolean).join(" • ");
}

function statusTone(value: string) {
  if (value === "invalid") return "bg-rose-50 text-rose-700";
  if (value === "hr_review") return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

export default function ManualLatenessReasonPage({ showAlert }: { showAlert: (title: string, type?: "success" | "info" | "error") => void }) {
  const [search, setSearch] = React.useState("");
  const [employeeId, setEmployeeId] = React.useState("");
  const [reasonCode, setReasonCode] = React.useState("");
  const [reasonText, setReasonText] = React.useState("");
  const [date, setDate] = React.useState(localYmd(new Date()));
  const [time, setTime] = React.useState("08:30");
  const [lateByMinutes, setLateByMinutes] = React.useState("0");
  const [error, setError] = React.useState("");

  const employees = useEmployees({ limit: 200, employmentStatus: "active" });
  const reasons = useHrLateReasons();
  const submit = useSubmitAttendanceRequest();
  const history = useAttendanceRequests({ requestType: "lateness_notice", size: 20, enabled: true });

  const employeeRows = employees.data?.employees || [];
  const filteredEmployees = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employeeRows;
    return employeeRows.filter((employee: any) => {
      const haystack = `${employeeName(employee)} ${employee.email || employee.User?.email || employee.user?.email || ""} ${employeeMeta(employee)}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [employeeRows, search]);

  const reasonOptions = (reasons.data?.data?.reasons || []).filter((reason: any) => reason.enabled !== false && reason.isActive !== false);
  const selectedEmployee = employeeRows.find((employee: any) => employeeUserId(employee) === employeeId);
  const selectedReason = reasonOptions.find((reason: any) => reason.reasonCode === reasonCode);

  const handleSubmit = async () => {
    setError("");
    if (!employeeId) return setError("Select an employee.");
    if (!reasonCode) return setError("Select a lateness reason.");
    if (!reasonText.trim()) return setError("Write the issue details.");
    if (!date || !time) return setError("Select the lateness date and time.");
    const minutes = Math.max(0, Math.round(Number(lateByMinutes || 0)));
    try {
      await submit.mutateAsync({
        requestType: "lateness_notice",
        employeeUserId: employeeId,
        category: reasonCode,
        reasonCategory: reasonCode,
        title: `Manual lateness reason - ${selectedReason?.label || reasonCode}`,
        reason: reasonText.trim(),
        reasonText: reasonText.trim(),
        fromAt: `${date}T${time}`,
        durationMinutes: minutes,
        manualValidityStatus: "hr_review",
      });
      setReasonText("");
      setLateByMinutes("0");
      showAlert("Manual lateness reason added", "success");
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to add manual lateness reason.");
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Attendance"
        title="Manual Lateness Reason"
        description="Add admin-entered lateness reasons for employees whose issue needs invalid or HR review handling."
      />

      <SectionCard title="Add Reason">
        {error ? <InfoAlert variant="error" message={error} className="mb-3" /> : null}
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-4">
          <div className="space-y-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Employee</span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs font-semibold text-slate-700"
                  placeholder="Search employee..."
                />
              </div>
            </label>
            <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
              {employees.isLoading ? <LoadingSpinner label="Loading employees..." /> : null}
              {!employees.isLoading && filteredEmployees.length === 0 ? (
                <div className="px-3 py-5 text-xs font-semibold text-slate-500">No employees found.</div>
              ) : null}
              {filteredEmployees.map((employee: any) => {
                const id = employeeUserId(employee);
                const active = id === employeeId;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setEmployeeId(id)}
                    className={`w-full text-left px-3 py-2.5 transition ${active ? "bg-blue-50" : "hover:bg-slate-50"}`}
                  >
                    <div className="text-xs font-black text-slate-900">{employeeName(employee)}</div>
                    <div className="text-[11px] font-semibold text-slate-500 mt-0.5">{employeeMeta(employee)}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            {selectedEmployee ? (
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5">
                <div className="text-xs font-black text-blue-900">{employeeName(selectedEmployee)}</div>
                <div className="text-[11px] font-semibold text-blue-700 mt-0.5">{employeeMeta(selectedEmployee)}</div>
              </div>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Reason</span>
                <select
                  value={reasonCode}
                  onChange={(e) => setReasonCode(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700"
                >
                  <option value="">Select reason</option>
                  {reasonOptions.map((reason: any) => (
                    <option key={reason.id || reason.reasonCode} value={reason.reasonCode}>
                      {reason.label || reason.name || reason.reasonCode}
                    </option>
                  ))}
                </select>
              </label>
              <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Outcome</span>
                <div className="mt-1 text-xs font-black text-amber-800">HR Review</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Date</span>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700" />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Time</span>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700" />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Minutes Late</span>
                <input type="number" min="0" value={lateByMinutes} onChange={(e) => setLateByMinutes(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700" />
              </label>
            </div>

            <textarea
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              rows={5}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700"
              placeholder="Describe the employee issue..."
            />

            <div className="flex items-center justify-between gap-3">
              <div className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${statusTone("hr_review")}`}>
                HR Review
              </div>
              <Button onClick={handleSubmit} disabled={submit.isPending} className="bg-[#1a56db] hover:bg-[#124bbf] disabled:bg-slate-200 disabled:text-slate-400 font-bold text-white text-xs h-9 rounded-xl">
                {submit.isPending ? "Adding..." : "Add Manual Reason"}
              </Button>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Recent Lateness Reasons">
        {history.isLoading ? <LoadingSpinner label="Loading..." /> : null}
        <div className="divide-y divide-slate-100">
          {(history.data?.rows || []).slice(0, 8).map((row: any) => (
            <div key={row.id} className="py-3 flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs font-black text-slate-900">{row.employee?.fullName || "Employee"}</div>
                <div className="text-[11px] font-semibold text-slate-500 mt-0.5">{row.reasonCategory || row.category || "Reason"} · {row.reasonText || row.reason}</div>
              </div>
              <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${statusTone(row.validityStatus || row.status)}`}>
                {row.validityStatus || row.status}
              </span>
            </div>
          ))}
          {!history.isLoading && (history.data?.rows || []).length === 0 ? (
            <div className="py-6 text-xs font-semibold text-slate-500">No lateness reasons yet.</div>
          ) : null}
        </div>
        {history.isError ? <InfoAlert variant="error" message="Failed to load recent lateness reasons." className="mt-3" /> : null}
      </SectionCard>
    </div>
  );
}
