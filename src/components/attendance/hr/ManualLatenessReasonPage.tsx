import React from "react";
import { CheckCircle2, Search, UserRound } from "lucide-react";
import {
  InfoAlert,
  LoadingSpinner,
  PageHeader,
} from "@/components/ui/blih";
import { Button } from "@/components/ui/button";
import { useEmployees } from "../../../hooks/useHrRecords";
import { useHrLateReasons } from "../../../hooks/useHrLateReasons";
import {
  useAttendanceRequests,
  useSubmitAttendanceRequest,
} from "../../../hooks/useAttendanceRequests";
import {
  LATENESS_CONTROL_CLASS,
  LATENESS_TEXTAREA_CLASS,
  LatenessEmptyState,
  LatenessField,
  LatenessNotice,
  LatenessPanel,
  LatenessStatusBadge,
  LatenessTable,
} from "../lateness/LatenessUi";

const ADDIS_ABABA_TZ = "Africa/Addis_Ababa";

function localYmd(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ADDIS_ABABA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function employeeName(employee: any): string {
  return (
    employee.fullName ||
    employee.name ||
    employee.User?.fullName ||
    employee.user?.fullName ||
    employee.email ||
    "Employee"
  );
}

function employeeUserId(employee: any): string {
  return (
    employee.userId ||
    employee.id ||
    employee.User?.id ||
    employee.user?.id ||
    ""
  );
}

function employeeMeta(employee: any): string {
  const profile =
    employee.BusinessUserProfile ||
    employee.businessUserProfile ||
    employee.profile ||
    employee;

  const department =
    profile?.department?.name ||
    profile?.Department?.name ||
    employee.departmentName ||
    "Unassigned";

  const position =
    profile?.position?.title ||
    profile?.Position?.title ||
    employee.positionTitle ||
    employee.role ||
    "";

  return [department, position].filter(Boolean).join(" • ");
}

function calculateMinutesLate(time: string): number {
  const [hour, minute] = time.split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return 0;
  return Math.max(0, hour * 60 + minute - (8 * 60 + 30));
}

export default function ManualLatenessReasonPage({
  showAlert,
}: {
  showAlert: (
    title: string,
    type?: "success" | "info" | "error",
  ) => void;
}) {
  const [search, setSearch] = React.useState("");
  const [employeeId, setEmployeeId] = React.useState("");
  const [reasonCode, setReasonCode] = React.useState("");
  const [reasonText, setReasonText] = React.useState("");
  const [date, setDate] = React.useState(localYmd(new Date()));
  const [time, setTime] = React.useState("08:30");
  const [lateByMinutes, setLateByMinutes] = React.useState("0");
  const [error, setError] = React.useState("");

  const employees = useEmployees({
    limit: 200,
    employmentStatus: "active",
  });
  const reasons = useHrLateReasons();
  const submit = useSubmitAttendanceRequest();
  const history = useAttendanceRequests({
    requestType: "lateness_notice",
    size: 20,
    enabled: true,
  });

  const employeeRows = employees.data?.employees || [];

  const filteredEmployees = React.useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return employeeRows.slice(0, 8);

    return employeeRows
      .filter((employee: any) => {
        const haystack = `${employeeName(employee)} ${
          employee.email ||
          employee.User?.email ||
          employee.user?.email ||
          ""
        } ${employeeMeta(employee)}`.toLowerCase();

        return haystack.includes(query);
      })
      .slice(0, 8);
  }, [employeeRows, search]);

  const reasonOptions = (
    reasons.data?.data?.reasons || []
  ).filter(
    (reason: any) =>
      reason.enabled !== false &&
      reason.isActive !== false,
  );

  const selectedEmployee = employeeRows.find(
    (employee: any) => employeeUserId(employee) === employeeId,
  );

  const selectedReason = reasonOptions.find(
    (reason: any) => reason.reasonCode === reasonCode,
  );

  const historyRows = (history.data?.rows || []).slice(0, 10);

  const handleTimeChange = (value: string) => {
    setTime(value);
    setLateByMinutes(String(calculateMinutesLate(value)));
  };

  const handleSubmit = async () => {
    setError("");

    if (!employeeId) {
      setError("Select an employee.");
      return;
    }

    if (!reasonCode) {
      setError("Select a lateness reason.");
      return;
    }

    if (!reasonText.trim()) {
      setError("Write the issue details.");
      return;
    }

    if (!date || !time) {
      setError("Select the lateness date and time.");
      return;
    }

    const minutes = Math.max(
      0,
      Math.round(Number(lateByMinutes || 0)),
    );

    try {
      await submit.mutateAsync({
        requestType: "lateness_notice",
        employeeUserId: employeeId,
        category: reasonCode,
        reasonCategory: reasonCode,
        title: `Manual lateness reason - ${
          selectedReason?.label || reasonCode
        }`,
        reason: reasonText.trim(),
        reasonText: reasonText.trim(),
        fromAt: `${date}T${time}`,
        durationMinutes: minutes,
      });

      setReasonText("");
      setLateByMinutes("0");
      await history.refetch();
      showAlert("Manual lateness reason added", "success");
    } catch (caught: any) {
      setError(
        caught?.response?.data?.message ||
          caught?.message ||
          "Failed to add manual lateness reason.",
      );
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Attendance"
        title="Manual Lateness Reason"
        description="Record a documented lateness reason for an employee and approve it immediately."
      />

      <LatenessPanel
        title="Add manual reason"
        description="Search for an employee, select the correct reason, and record the arrival details."
      >
        {error ? (
          <InfoAlert variant="error" message={error} className="mb-4" />
        ) : null}

        <div className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
          <div>
            <LatenessField label="Employee search">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className={`${LATENESS_CONTROL_CLASS} pl-9`}
                  placeholder="Search by name, email, department..."
                />
              </div>
            </LatenessField>

            <div className="mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white">
              {employees.isLoading ? (
                <div className="p-4">
                  <LoadingSpinner label="Loading employees..." />
                </div>
              ) : filteredEmployees.length ? (
                <div className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
                  {filteredEmployees.map((employee: any) => {
                    const id = employeeUserId(employee);
                    const active = id === employeeId;

                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setEmployeeId(id)}
                        className={`flex w-full items-start gap-3 px-3 py-3 text-left transition ${
                          active
                            ? "bg-blue-50"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                            active
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          <UserRound className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-slate-900">
                            {employeeName(employee)}
                          </span>
                          <span className="mt-0.5 block truncate text-[11px] text-slate-500">
                            {employeeMeta(employee)}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="px-4 py-6 text-center text-xs text-slate-500">
                  No employees found.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {selectedEmployee ? (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-blue-950">
                    {employeeName(selectedEmployee)}
                  </p>
                  <p className="mt-0.5 text-xs text-blue-700">
                    {employeeMeta(selectedEmployee)}
                  </p>
                </div>
                <LatenessStatusBadge value="selected" />
              </div>
            ) : (
              <LatenessNotice
                tone="info"
                title="Select an employee"
                description="The attendance details form becomes meaningful after an employee is selected."
              />
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <LatenessField label="Reason" required>
                <select
                  value={reasonCode}
                  onChange={(event) => setReasonCode(event.target.value)}
                  className={LATENESS_CONTROL_CLASS}
                >
                  <option value="">Select reason</option>
                  {reasonOptions.map((reason: any) => (
                    <option
                      key={reason.id || reason.reasonCode}
                      value={reason.reasonCode}
                    >
                      {reason.label ||
                        reason.name ||
                        reason.reasonCode}
                    </option>
                  ))}
                </select>
              </LatenessField>

              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                <p className="text-[11px] font-semibold text-emerald-600">
                  Outcome
                </p>
                <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-emerald-900">
                  <CheckCircle2 className="h-4 w-4" />
                  Auto approved
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <LatenessField label="Date" required>
                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className={LATENESS_CONTROL_CLASS}
                />
              </LatenessField>

              <LatenessField
                label="Arrival time"
                required
                hint="Minutes late are calculated from 08:30."
              >
                <input
                  type="time"
                  value={time}
                  onChange={(event) => handleTimeChange(event.target.value)}
                  className={LATENESS_CONTROL_CLASS}
                />
              </LatenessField>

              <LatenessField label="Minutes late">
                <input
                  type="number"
                  min="0"
                  value={lateByMinutes}
                  onChange={(event) =>
                    setLateByMinutes(event.target.value)
                  }
                  className={LATENESS_CONTROL_CLASS}
                />
              </LatenessField>
            </div>

            <LatenessField
              label="Documented issue"
              required
              hint="Include enough context for future attendance review."
            >
              <textarea
                value={reasonText}
                onChange={(event) => setReasonText(event.target.value)}
                rows={4}
                className={LATENESS_TEXTAREA_CLASS}
                placeholder="Describe the employee's issue..."
              />
            </LatenessField>

            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={
                  submit.isPending ||
                  !employeeId ||
                  !reasonCode ||
                  !reasonText.trim()
                }
                className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400"
              >
                {submit.isPending ? "Adding..." : "Add manual reason"}
              </Button>
            </div>
          </div>
        </div>
      </LatenessPanel>

      <LatenessPanel
        title="Recent lateness reasons"
        description="Recently submitted employee notices and their validity."
      >
        {history.isLoading ? (
          <LoadingSpinner label="Loading recent reasons..." />
        ) : null}

        {history.isError ? (
          <InfoAlert
            variant="error"
            message="Failed to load recent lateness reasons."
            className="mb-4"
          />
        ) : null}

        {!history.isLoading && historyRows.length ? (
          <LatenessTable
            columns={[
              "Employee",
              "Reason",
              "Explanation",
              "Minutes",
              "Validity",
            ]}
          >
            {historyRows.map((row: any) => (
              <tr key={row.id}>
                <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-slate-900">
                  {row.employee?.fullName || "Employee"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-slate-700">
                  {row.reasonCategory || row.category || "Reason"}
                </td>
                <td className="max-w-md px-4 py-3 text-xs leading-5 text-slate-600">
                  {row.reasonText || row.reason || "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">
                  {row.durationMinutes ?? "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <LatenessStatusBadge
                    value={row.validityStatus || row.status}
                  />
                </td>
              </tr>
            ))}
          </LatenessTable>
        ) : !history.isLoading ? (
          <LatenessEmptyState
            title="No lateness reasons yet"
            description="New manually recorded reasons will appear here."
          />
        ) : null}
      </LatenessPanel>
    </div>
  );
}
