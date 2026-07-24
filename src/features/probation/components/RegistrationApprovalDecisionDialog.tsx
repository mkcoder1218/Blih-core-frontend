import React from "react";
import {
  AlertCircle,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Hourglass,
  Loader2,
  ShieldCheck,
  UserCheck,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import type {
  PendingRegistrant,
  RegistrationApprovalMode,
} from "../../../api/pendingRegistrations";
import { useEmployees } from "../../../hooks/useHrRecords";
import { usePositionCompetencies } from "../../../hooks/useProbationCompetencies";

export interface RegistrationProbationConfiguration {
  mode: RegistrationApprovalMode;
  startDate?: string;
  durationMonths?: number;
  expectedEndDate?: string;
  managerUserId?: string;
  finalApproverUserId?: string | null;
  notes?: string | null;
}

interface RegistrationApprovalDecisionDialogProps {
  isOpen: boolean;
  registrant: PendingRegistrant | null;
  submitting: boolean;

  onClose: () => void;

  onConfirm: (
    configuration: RegistrationProbationConfiguration,
  ) => void;
}

function todayInput(): string {
  return new Date()
    .toISOString()
    .slice(0, 10);
}

function toDateInput(
  value?: string | null,
): string {
  if (!value) {
    return todayInput();
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return todayInput();
  }

  return date
    .toISOString()
    .slice(0, 10);
}

function addCalendarMonths(
  dateValue: string,
  months: number,
): string {
  const source = new Date(
    `${dateValue}T00:00:00.000Z`,
  );

  if (
    Number.isNaN(source.getTime())
  ) {
    return dateValue;
  }

  const originalDay =
    source.getUTCDate();

  source.setUTCDate(1);

  source.setUTCMonth(
    source.getUTCMonth() +
      months,
  );

  const finalDay =
    new Date(
      Date.UTC(
        source.getUTCFullYear(),
        source.getUTCMonth() + 1,
        0,
      ),
    ).getUTCDate();

  source.setUTCDate(
    Math.min(
      originalDay,
      finalDay,
    ),
  );

  return source
    .toISOString()
    .slice(0, 10);
}

function employeeUserIdOf(
  employee: any,
): string {
  return (
    employee?.userId ||
    employee?.user?.id ||
    employee?.User?.id ||
    employee?.id ||
    ""
  );
}

function employeeNameOf(
  employee: any,
): string {
  return (
    employee?.user?.fullName ||
    employee?.User?.fullName ||
    employee?.fullName ||
    employee?.name ||
    employee?.user?.email ||
    employee?.email ||
    "Unnamed employee"
  );
}

function employeePositionOf(
  employee: any,
): string {
  return (
    employee?.position?.title ||
    employee?.Position?.title ||
    employee?.user?.EmployeeRecord
      ?.position?.title ||
    ""
  );
}

const approvalOptions: Array<{
  mode: RegistrationApprovalMode;
  title: string;
  description: string;
  icon: React.ElementType;
}> = [
  {
    mode: "START_PROBATION",
    title: "Start probation",
    description:
      "Approve the registration and immediately initialize a tracked probation period.",
    icon: Hourglass,
  },

  {
    mode: "PERMANENT_EMPLOYEE",
    title: "Add as permanent employee",
    description:
      "Approve the employee as permanent without creating a probation lifecycle.",
    icon: UserCheck,
  },

  {
    mode: "NO_PROBATION",
    title: "Approve without probation",
    description:
      "Approve the account without probation while keeping the normal active employment status.",
    icon: BriefcaseBusiness,
  },
];

export function RegistrationApprovalDecisionDialog({
  isOpen,
  registrant,
  submitting,
  onClose,
  onConfirm,
}: RegistrationApprovalDecisionDialogProps) {
  const [mode, setMode] =
    React.useState<RegistrationApprovalMode>(
      "START_PROBATION",
    );

  const [startDate, setStartDate] =
    React.useState(todayInput());

  const [
    durationMonths,
    setDurationMonths,
  ] = React.useState(3);

  const [
    managerUserId,
    setManagerUserId,
  ] = React.useState("");

  const [
    finalApproverUserId,
    setFinalApproverUserId,
  ] = React.useState("");

  const [notes, setNotes] =
    React.useState("");

  const [error, setError] =
    React.useState("");

  const employeesQuery =
    useEmployees({
      limit: 500,
      offset: 0,
      employmentStatus: "active",
    });

  const competenciesQuery =
    usePositionCompetencies(
      registrant?.position?.id ||
        undefined,
      isOpen &&
        mode ===
          "START_PROBATION",
    );

  React.useEffect(() => {
    if (!isOpen || !registrant) {
      return;
    }

    setMode(
      "START_PROBATION",
    );

    setStartDate(
      toDateInput(
        registrant.hireDate,
      ),
    );

    setDurationMonths(3);
    setManagerUserId("");
    setFinalApproverUserId("");
    setNotes("");
    setError("");
  }, [isOpen, registrant]);

  if (
    !isOpen ||
    !registrant
  ) {
    return null;
  }

  const employeeRows =
    employeesQuery.data
      ?.employees || [];

  const managerOptions =
    employeeRows.filter(
      (employee: any) =>
        employeeUserIdOf(
          employee,
        ) !== registrant.id,
    );

  const competencies =
    competenciesQuery.data || [];

  const totalWeight =
    competencies.reduce(
      (sum, competency) =>
        sum +
        Number(
          competency.weight ||
            0,
        ),
      0,
    );

  const competenciesReady =
    competencies.length > 0 &&
    Math.abs(
      totalWeight - 100,
    ) <= 0.01;

  const expectedEndDate =
    addCalendarMonths(
      startDate,
      durationMonths,
    );

  const submit = () => {
    if (
      mode ===
      "START_PROBATION"
    ) {
      if (
        !registrant.position?.id
      ) {
        setError(
          "Assign a position before starting probation.",
        );

        return;
      }

      if (
        !registrant.department?.id
      ) {
        setError(
          "Assign a department before starting probation.",
        );

        return;
      }

      if (!managerUserId) {
        setError(
          "Select a reporting manager.",
        );

        return;
      }

      if (
        managerUserId ===
        registrant.id
      ) {
        setError(
          "The employee cannot be their own probation manager.",
        );

        return;
      }

      if (
        finalApproverUserId ===
        registrant.id
      ) {
        setError(
          "The employee cannot approve their own probation.",
        );

        return;
      }

      if (
        !competenciesReady
      ) {
        setError(
          "The selected position needs active probation competencies totaling exactly 100%.",
        );

        return;
      }
    }

    setError("");

    onConfirm({
      mode,

      ...(mode ===
      "START_PROBATION"
        ? {
            startDate,
            durationMonths,
            expectedEndDate,
            managerUserId,
            finalApproverUserId:
              finalApproverUserId ||
              null,
            notes:
              notes.trim() ||
              null,
          }
        : {}),
    });
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close approval decision"
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
                Approve registration
              </h3>
            </div>

            <p className="mt-1 text-xs font-semibold text-slate-500">
              {registrant.fullName}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          {error ? (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-bold text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          ) : null}

          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Employment initialization
            </p>

            <div className="grid gap-3">
              {approvalOptions.map(
                (option) => {
                  const Icon =
                    option.icon;

                  const selected =
                    mode ===
                    option.mode;

                  return (
                    <button
                      key={
                        option.mode
                      }
                      type="button"
                      disabled={
                        submitting
                      }
                      onClick={() => {
                        setMode(
                          option.mode,
                        );

                        setError("");
                      }}
                      className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
                        selected
                          ? "border-blue-300 bg-blue-50 ring-2 ring-blue-100"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          selected
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-slate-900">
                          {option.title}
                        </p>

                        <p className="mt-1 text-[11px] font-medium leading-5 text-slate-500">
                          {
                            option.description
                          }
                        </p>
                      </div>

                      {selected ? (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-blue-600" />
                      ) : null}
                    </button>
                  );
                },
              )}
            </div>
          </div>

          {mode ===
          "START_PROBATION" ? (
            <>
              <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Position
                  </p>

                  <p className="mt-1 text-xs font-black text-slate-900">
                    {registrant
                      .position
                      ?.title ||
                      "Not assigned"}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Department
                  </p>

                  <p className="mt-1 text-xs font-black text-slate-900">
                    {registrant
                      .department
                      ?.name ||
                      "Not assigned"}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Probation start date
                  </span>

                  <input
                    type="date"
                    value={
                      startDate
                    }
                    onChange={(
                      event,
                    ) =>
                      setStartDate(
                        event.target
                          .value,
                      )
                    }
                    disabled={
                      submitting
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold outline-none focus:border-blue-500 focus:bg-white disabled:opacity-60"
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Duration
                  </span>

                  <select
                    value={
                      durationMonths
                    }
                    onChange={(
                      event,
                    ) =>
                      setDurationMonths(
                        Number(
                          event.target
                            .value,
                        ),
                      )
                    }
                    disabled={
                      submitting
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold outline-none focus:border-blue-500 focus:bg-white disabled:opacity-60"
                  >
                    {[
                      1,
                      2,
                      3,
                      4,
                      5,
                      6,
                      9,
                      12,
                    ].map(
                      (month) => (
                        <option
                          key={
                            month
                          }
                          value={
                            month
                          }
                        >
                          {month} month
                          {month === 1
                            ? ""
                            : "s"}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Reporting manager
                  </span>

                  <select
                    value={
                      managerUserId
                    }
                    onChange={(
                      event,
                    ) =>
                      setManagerUserId(
                        event.target
                          .value,
                      )
                    }
                    disabled={
                      employeesQuery.isLoading ||
                      submitting
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold outline-none focus:border-blue-500 focus:bg-white disabled:opacity-60"
                  >
                    <option value="">
                      {employeesQuery.isLoading
                        ? "Loading employees..."
                        : "Select manager"}
                    </option>

                    {managerOptions.map(
                      (
                        employee: any,
                      ) => {
                        const userId =
                          employeeUserIdOf(
                            employee,
                          );

                        const name =
                          employeeNameOf(
                            employee,
                          );

                        const position =
                          employeePositionOf(
                            employee,
                          );

                        return (
                          <option
                            key={
                              userId
                            }
                            value={
                              userId
                            }
                          >
                            {position
                              ? `${name} — ${position}`
                              : name}
                          </option>
                        );
                      },
                    )}
                  </select>
                </label>

                <label className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Final approver
                  </span>

                  <select
                    value={
                      finalApproverUserId
                    }
                    onChange={(
                      event,
                    ) =>
                      setFinalApproverUserId(
                        event.target
                          .value,
                      )
                    }
                    disabled={
                      employeesQuery.isLoading ||
                      submitting
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold outline-none focus:border-blue-500 focus:bg-white disabled:opacity-60"
                  >
                    <option value="">
                      Assign later
                    </option>

                    {managerOptions.map(
                      (
                        employee: any,
                      ) => {
                        const userId =
                          employeeUserIdOf(
                            employee,
                          );

                        const name =
                          employeeNameOf(
                            employee,
                          );

                        const position =
                          employeePositionOf(
                            employee,
                          );

                        return (
                          <option
                            key={
                              userId
                            }
                            value={
                              userId
                            }
                          >
                            {position
                              ? `${name} — ${position}`
                              : name}
                          </option>
                        );
                      },
                    )}
                  </select>
                </label>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4">
                <CalendarDays className="h-5 w-5 shrink-0 text-blue-600" />

                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-blue-500">
                    Expected probation end date
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
                      These criteria will
                      be copied into the
                      employee probation.
                    </p>
                  </div>

                  <span
                    className={`rounded-lg px-2.5 py-1 text-[10px] font-black ${
                      competenciesReady
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {totalWeight.toFixed(
                      2,
                    )}
                    %
                  </span>
                </div>

                {competenciesQuery.isLoading ? (
                  <div className="flex items-center gap-2 py-6 text-xs font-bold text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />

                    Loading competencies...
                  </div>
                ) : competencies.length ? (
                  <div className="mt-3 space-y-2">
                    {competencies.map(
                      (
                        competency,
                      ) => (
                        <div
                          key={
                            competency.id
                          }
                          className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5"
                        >
                          <div>
                            <p className="text-xs font-black text-slate-800">
                              {
                                competency.name
                              }
                            </p>

                            <p className="mt-0.5 text-[10px] font-medium text-slate-500">
                              {competency.description ||
                                "No description"}
                            </p>
                          </div>

                          <span className="shrink-0 text-xs font-black text-slate-600">
                            {Number(
                              competency.weight,
                            ).toFixed(
                              2,
                            )}
                            %
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] font-bold text-amber-700">
                    This position has no
                    probation competencies.
                  </div>
                )}
              </div>

              <label className="block space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Probation notes
                </span>

                <textarea
                  rows={3}
                  value={notes}
                  onChange={(
                    event,
                  ) =>
                    setNotes(
                      event.target
                        .value,
                    )
                  }
                  disabled={
                    submitting
                  }
                  placeholder="Optional notes about the probation initialization..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold outline-none focus:border-blue-500 focus:bg-white disabled:opacity-60"
                />
              </label>
            </>
          ) : (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-black text-emerald-800">
                No probation lifecycle
                will be created.
              </p>

              <p className="mt-1 text-[11px] font-medium leading-5 text-emerald-700">
                The registration will
                be approved and the
                employee account will
                become active.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-600 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}

            {submitting
              ? "Approving..."
              : mode ===
                  "START_PROBATION"
                ? "Approve and start probation"
                : "Approve registration"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
