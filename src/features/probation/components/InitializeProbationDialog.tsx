import React from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useEmployees } from "../../../hooks/useHrRecords";
import { useInitializeEmployeeProbation } from "../../../hooks/useEmployeeProbation";
import { usePositionCompetencies } from "../../../hooks/useProbationCompetencies";

interface InitializeProbationDialogProps {
  isOpen: boolean;
  employeeUserId: string;
  employeeName: string;
  positionId?: string | null;
  positionTitle?: string | null;
  departmentName?: string | null;
  currentManagerUserId?: string | null;
  defaultStartDate?: string | null;
  onClose: () => void;
  onSuccess?: (probationId: string) => void;
}

function toDateInput(value?: string | null): string {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }

  return date.toISOString().slice(0, 10);
}

function addCalendarMonths(
  dateValue: string,
  months: number,
): string {
  const source = new Date(`${dateValue}T00:00:00.000Z`);

  if (Number.isNaN(source.getTime())) {
    return dateValue;
  }

  const originalDay = source.getUTCDate();

  source.setUTCDate(1);
  source.setUTCMonth(source.getUTCMonth() + months);

  const lastDayOfTargetMonth = new Date(
    Date.UTC(
      source.getUTCFullYear(),
      source.getUTCMonth() + 1,
      0,
    ),
  ).getUTCDate();

  source.setUTCDate(
    Math.min(originalDay, lastDayOfTargetMonth),
  );

  return source.toISOString().slice(0, 10);
}

function employeeUserIdOf(employee: any): string {
  return (
    employee?.userId ||
    employee?.User?.id ||
    employee?.user?.id ||
    employee?.id ||
    ""
  );
}

function employeeNameOf(employee: any): string {
  return (
    employee?.User?.fullName ||
    employee?.user?.fullName ||
    employee?.fullName ||
    employee?.name ||
    employee?.workEmail ||
    "Unnamed employee"
  );
}

function employeePositionOf(employee: any): string {
  return (
    employee?.position?.title ||
    employee?.Position?.title ||
    employee?.employeeRecord?.position?.title ||
    ""
  );
}

export function InitializeProbationDialog({
  isOpen,
  employeeUserId,
  employeeName,
  positionId,
  positionTitle,
  departmentName,
  currentManagerUserId,
  defaultStartDate,
  onClose,
  onSuccess,
}: InitializeProbationDialogProps) {
  const [startDate, setStartDate] = React.useState(
    toDateInput(defaultStartDate),
  );

  const [durationMonths, setDurationMonths] =
    React.useState(3);

  const [managerUserId, setManagerUserId] =
    React.useState(currentManagerUserId || "");

  const [finalApproverUserId, setFinalApproverUserId] =
    React.useState("");

  const [notes, setNotes] = React.useState("");
  const [error, setError] = React.useState("");

  const employeesQuery = useEmployees({
    limit: 500,
    offset: 0,
    employmentStatus: "active",
  });

  const competenciesQuery = usePositionCompetencies(
    positionId || undefined,
    isOpen,
  );

  const initializeMutation =
    useInitializeEmployeeProbation();

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    setStartDate(toDateInput(defaultStartDate));
    setDurationMonths(3);
    setManagerUserId(currentManagerUserId || "");
    setFinalApproverUserId("");
    setNotes("");
    setError("");
  }, [
    isOpen,
    defaultStartDate,
    currentManagerUserId,
  ]);

  if (!isOpen) {
    return null;
  }

  const employeeRows =
    employeesQuery.data?.employees ||
    (employeesQuery.data as any)?.rows ||
    [];

  const employees = employeeRows.filter(
    (employee: any) => {
      const userId = employeeUserIdOf(employee);

      return userId && userId !== employeeUserId;
    },
  );

  const competencies = competenciesQuery.data || [];

  const expectedEndDate = addCalendarMonths(
    startDate,
    durationMonths,
  );

  const totalWeight = competencies.reduce(
    (sum, competency) =>
      sum + Number(competency.weight || 0),
    0,
  );

  const competenciesReady =
    competencies.length > 0 &&
    Math.abs(totalWeight - 100) <= 0.01;

  const canSubmit =
    Boolean(positionId) &&
    Boolean(startDate) &&
    Boolean(managerUserId) &&
    durationMonths > 0 &&
    competenciesReady &&
    !initializeMutation.isPending;

  const submit = async () => {
    if (!positionId) {
      setError(
        "Assign a position before initializing probation.",
      );
      return;
    }

    if (!managerUserId) {
      setError("Select a reporting manager.");
      return;
    }

    if (managerUserId === employeeUserId) {
      setError(
        "An employee cannot be their own probation manager.",
      );
      return;
    }

    if (finalApproverUserId === employeeUserId) {
      setError(
        "An employee cannot approve their own probation.",
      );
      return;
    }

    if (!competenciesReady) {
      setError(
        "This position needs active probation competencies totaling exactly 100%.",
      );
      return;
    }

    setError("");

    try {
      const probation =
        await initializeMutation.mutateAsync({
          employeeUserId,
          startDate,
          durationMonths,
          expectedEndDate,
          managerUserId,
          finalApproverUserId:
            finalApproverUserId || null,
          source: "EXISTING_EMPLOYEE",
          status: "ACTIVE",
          notes: notes.trim() || null,
        });

      onSuccess?.(probation.id);
      onClose();
    } catch (caught: any) {
      setError(
        caught?.response?.data?.message ||
          caught?.message ||
          "Unable to initialize probation.",
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close initialize probation dialog"
      />

      <motion.div
        initial={{
          opacity: 0,
          scale: 0.97,
          y: 10,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
        }}
        className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-600" />

              <h3 className="text-base font-black text-slate-950">
                Initialize probation
              </h3>
            </div>

            <p className="mt-1 text-xs font-semibold text-slate-500">
              {employeeName}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          {error ? (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-bold text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Position
              </p>

              <p className="mt-1 text-xs font-black text-slate-900">
                {positionTitle || "Not assigned"}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Department
              </p>

              <p className="mt-1 text-xs font-black text-slate-900">
                {departmentName || "Not assigned"}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Start date
              </span>

              <input
                type="date"
                value={startDate}
                onChange={(event) =>
                  setStartDate(event.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Duration
              </span>

              <select
                value={durationMonths}
                onChange={(event) =>
                  setDurationMonths(
                    Number(event.target.value),
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
              >
                {[
                  1, 2, 3, 4, 5, 6, 9, 12, 18, 24,
                ].map((month) => (
                  <option key={month} value={month}>
                    {month} month
                    {month === 1 ? "" : "s"}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Reporting manager
              </span>

              <select
                value={managerUserId}
                onChange={(event) =>
                  setManagerUserId(event.target.value)
                }
                disabled={employeesQuery.isLoading}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold outline-none transition focus:border-blue-500 focus:bg-white disabled:opacity-60"
              >
                <option value="">
                  {employeesQuery.isLoading
                    ? "Loading employees..."
                    : "Select manager"}
                </option>

                {employees.map((employee: any) => {
                  const userId =
                    employeeUserIdOf(employee);

                  const name =
                    employeeNameOf(employee);

                  const position =
                    employeePositionOf(employee);

                  return (
                    <option key={userId} value={userId}>
                      {position
                        ? `${name} — ${position}`
                        : name}
                    </option>
                  );
                })}
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Final approver
              </span>

              <select
                value={finalApproverUserId}
                onChange={(event) =>
                  setFinalApproverUserId(
                    event.target.value,
                  )
                }
                disabled={employeesQuery.isLoading}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold outline-none transition focus:border-blue-500 focus:bg-white disabled:opacity-60"
              >
                <option value="">
                  Assign later
                </option>

                {employees.map((employee: any) => {
                  const userId =
                    employeeUserIdOf(employee);

                  const name =
                    employeeNameOf(employee);

                  const position =
                    employeePositionOf(employee);

                  return (
                    <option key={userId} value={userId}>
                      {position
                        ? `${name} — ${position}`
                        : name}
                    </option>
                  );
                })}
              </select>
            </label>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <CalendarDays className="h-5 w-5 shrink-0 text-blue-600" />

            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-blue-500">
                Expected end date
              </p>

              <p className="mt-0.5 text-sm font-black text-blue-950">
                {new Date(
                  `${expectedEndDate}T00:00:00`,
                ).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black text-slate-900">
                  Position competencies
                </p>

                <p className="mt-1 text-[11px] font-medium text-slate-500">
                  These criteria will be copied into this
                  employee’s probation record.
                </p>
              </div>

              <span
                className={`rounded-lg px-2.5 py-1 text-[10px] font-black ${
                  competenciesReady
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {totalWeight.toFixed(2)}%
              </span>
            </div>

            {competenciesQuery.isLoading ? (
              <div className="flex items-center gap-2 py-6 text-xs font-bold text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading competencies...
              </div>
            ) : competenciesQuery.isError ? (
              <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-[11px] font-bold text-rose-700">
                Failed to load the position competencies.
              </div>
            ) : competencies.length ? (
              <div className="mt-3 space-y-2">
                {competencies.map((competency) => (
                  <div
                    key={competency.id}
                    className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-800">
                        {competency.name}
                      </p>

                      <p className="mt-0.5 text-[10px] font-medium text-slate-500">
                        {competency.description ||
                          "No description"}
                      </p>
                    </div>

                    <span className="shrink-0 text-xs font-black text-slate-600">
                      {Number(competency.weight).toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] font-bold text-amber-700">
                This position does not have probation
                competencies yet. Open Departments & Positions
                and configure criteria totaling 100%.
              </div>
            )}
          </div>

          <label className="block space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Notes
            </span>

            <textarea
              rows={3}
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              placeholder="Optional context about this probation..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
            />
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={initializeMutation.isPending}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-600 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!canSubmit}
            onClick={submit}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {initializeMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}

            Initialize probation
          </button>
        </div>
      </motion.div>
    </div>
  );
}
