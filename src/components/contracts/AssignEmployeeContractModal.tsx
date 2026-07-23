import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  AlertTriangle,
  CheckCircle2,
  FileSignature,
  Loader2,
  X,
} from "lucide-react";

import type {
  AssignEmploymentContractInput,
  EmploymentContractEmployeePrefill,
} from "../../api/employmentContracts";

import {
  useAssignEmploymentContract,
  useEmploymentContractEmployeePrefill,
  useEmploymentContractTemplates,
} from "../../hooks/useEmploymentContracts";

interface AssignEmployeeContractModalProps {
  isOpen: boolean;
  employee: any | null;

  onClose: () => void;

  showAlert: (
    message: string,
    type?: "success" | "info" | "error",
  ) => void;

  onAssigned?: () => void;
}

type AssignmentForm =
  AssignEmploymentContractInput;

const EMPTY_FORM: AssignmentForm = {
  templateId: "",

  candidateName: "",
  candidateEmail: "",
  candidatePhone: "",

  departmentId: null,
  departmentName: "",

  positionId: null,
  positionName: "",

  reportingManagerId: null,
  managerName: "",

  contractType: "PERMANENT",
  employmentType: "",
  workLocation: "",

  salary: "",
  currency: "ETB",

  startDate: "",
  endDate: "",

  probationStartDate: "",
  probationEndDate: "",

  noticePeriodDays: null,

  companyName: "",
  companyAddress: "",

  subject: "",
  bodyHtml: "",
  bodyText: "",

  metadata: {},
};

const REQUIRED_FIELDS: Array<{
  key: keyof AssignmentForm;
  label: string;
}> = [
  {
    key: "candidateName",
    label: "Employee name",
  },
  {
    key: "candidateEmail",
    label: "Employee email",
  },
  {
    key: "departmentName",
    label: "Department",
  },
  {
    key: "positionName",
    label: "Position",
  },
  {
    key: "salary",
    label: "Salary",
  },
  {
    key: "startDate",
    label: "Employment start date",
  },
  {
    key: "workLocation",
    label: "Work location",
  },
  {
    key: "companyName",
    label: "Company name",
  },
  {
    key: "companyAddress",
    label: "Company address",
  },
  {
    key: "templateId",
    label: "Contract template",
  },
  {
    key: "subject",
    label: "Contract subject",
  },
  {
    key: "bodyHtml",
    label: "Contract content",
  },
];

function getEmployeeRecordId(
  employee: any,
): string {
  return String(
    employee?.employeeRecordId ||
    employee?.id ||
    "",
  );
}

function getErrorMessage(
  error: any,
): string {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error?.message ||
    error?.message ||
    "Failed to assign contract"
  );
}

function getServerMissingFields(
  error: any,
): Array<{
  key: string;
  label: string;
}> {
  return (
    error?.response?.data?.data
      ?.missingFields ||
    error?.response?.data?.error
      ?.data?.missingFields ||
    []
  );
}

function toForm(
  employee:
    EmploymentContractEmployeePrefill,
): AssignmentForm {
  return {
    ...EMPTY_FORM,

    candidateName:
      employee.candidateName ||
      "",

    candidateEmail:
      employee.candidateEmail ||
      "",

    candidatePhone:
      employee.candidatePhone ||
      "",

    departmentId:
      employee.departmentId ||
      null,

    departmentName:
      employee.departmentName ||
      "",

    positionId:
      employee.positionId ||
      null,

    positionName:
      employee.positionName ||
      "",

    reportingManagerId:
      employee.reportingManagerId ||
      null,

    managerName:
      employee.managerName ||
      "",

    contractType:
      employee.contractType ||
      "PERMANENT",

    employmentType:
      employee.employmentType ||
      "",

    workLocation:
      employee.workLocation ||
      "",

    salary:
      employee.salary ?? "",

    currency:
      employee.currency ||
      "ETB",

    startDate:
      employee.startDate ||
      "",

    endDate:
      employee.endDate ||
      "",

    probationStartDate:
      employee.probationStartDate ||
      "",

    probationEndDate:
      employee.probationEndDate ||
      "",

    noticePeriodDays:
      employee.noticePeriodDays ??
      null,

    companyName:
      employee.companyName ||
      "",

    companyAddress:
      employee.companyAddress ||
      "",
  };
}

function FieldLabel({
  children,
  required = false,
}: {
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">
      {children}

      {required ? (
        <span className="ml-1 text-rose-500">
          *
        </span>
      ) : null}
    </span>
  );
}

export default function AssignEmployeeContractModal({
  isOpen,
  employee,
  onClose,
  showAlert,
  onAssigned,
}: AssignEmployeeContractModalProps) {
  const employeeRecordId =
    isOpen
      ? getEmployeeRecordId(
          employee,
        )
      : "";

  const {
    data: prefill,
    isLoading:
      loadingPrefill,
    isError:
      prefillFailed,
    error:
      prefillError,
  } =
    useEmploymentContractEmployeePrefill(
      employeeRecordId,
    );

  const {
    data: templates = [],
    isLoading:
      loadingTemplates,
  } =
    useEmploymentContractTemplates();

  const assignMutation =
    useAssignEmploymentContract();

  const [
    form,
    setForm,
  ] =
    useState<AssignmentForm>(
      EMPTY_FORM,
    );

  const [
    serverMissingFields,
    setServerMissingFields,
  ] = useState<
    Array<{
      key: string;
      label: string;
    }>
  >([]);

  useEffect(() => {
    if (
      isOpen &&
      prefill?.employee
    ) {
      setForm(
        toForm(
          prefill.employee,
        ),
      );

      setServerMissingFields(
        prefill.missingFields ||
        [],
      );
    }
  }, [
    isOpen,
    prefill,
  ]);

  useEffect(() => {
    if (!isOpen) {
      setForm(
        EMPTY_FORM,
      );

      setServerMissingFields(
        [],
      );
    }
  }, [
    isOpen,
  ]);

  const missingFields =
    useMemo(() => {
      const missing =
        REQUIRED_FIELDS.filter(
          (field) => {
            const value =
              form[field.key];

            return (
              value === null ||
              value === undefined ||
              value === ""
            );
          },
        ).map((field) => ({
          key:
            String(field.key),
          label:
            field.label,
        }));

      const combined =
        [
          ...missing,
          ...serverMissingFields,
        ];

      return Array.from(
        new Map(
          combined.map(
            (field) => [
              field.key,
              field,
            ],
          ),
        ).values(),
      );
    }, [
      form,
      serverMissingFields,
    ]);

  const selectedTemplate =
    templates.find(
      (template) =>
        template.id ===
        form.templateId,
    );

  const selectTemplate = (
    templateId: string,
  ) => {
    const template =
      templates.find(
        (item) =>
          item.id ===
          templateId,
      );

    setServerMissingFields(
      [],
    );

    setForm(
      (previous) => ({
        ...previous,

        templateId,

        contractType:
          template?.contractType ||
          previous.contractType,

        subject:
          template?.subject ||
          "",

        bodyHtml:
          template?.bodyHtml ||
          "",

        bodyText:
          template?.bodyText ||
          "",
      }),
    );
  };

  const updateField = <
    K extends keyof AssignmentForm,
  >(
    key: K,
    value: AssignmentForm[K],
  ) => {
    setServerMissingFields(
      (
        previous,
      ) =>
        previous.filter(
          (field) =>
            field.key !== key,
        ),
    );

    setForm(
      (previous) => ({
        ...previous,
        [key]: value,
      }),
    );
  };

  const submit = async (
    event: FormEvent,
  ) => {
    event.preventDefault();

    if (
      !employeeRecordId
    ) {
      showAlert(
        "Employee record ID is missing",
        "error",
      );
      return;
    }

    if (
      missingFields.length >
      0
    ) {
      showAlert(
        "Complete all missing contract information before assigning.",
        "error",
      );
      return;
    }

    try {
      await assignMutation.mutateAsync({
        employeeRecordId,

        input: {
          ...form,

          salary:
            form.salary === ""
              ? null
              : form.salary,

          noticePeriodDays:
            form.noticePeriodDays ===
            null
              ? null
              : Number(
                  form.noticePeriodDays,
                ),
        },
      });

      showAlert(
        "Employment contract assigned successfully.",
        "success",
      );

      onAssigned?.();
      onClose();
    } catch (error: any) {
      const missing =
        getServerMissingFields(
          error,
        );

      if (
        missing.length > 0
      ) {
        setServerMissingFields(
          missing,
        );
      }

      showAlert(
        getErrorMessage(
          error,
        ),
        "error",
      );
    }
  };

  if (!isOpen) {
    return null;
  }

  const employeeName =
    prefill?.employee
      ?.candidateName ||
    employee?.user?.fullName ||
    employee?.name ||
    "Employee";

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0"
        onClick={() => {
          if (
            !assignMutation.isPending
          ) {
            onClose();
          }
        }}
      />

      <form
        onSubmit={submit}
        className="relative z-10 flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <FileSignature className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-sm font-black text-slate-950">
                Assign Employment Contract
              </h2>

              <p className="mt-1 text-[11px] font-medium text-slate-500">
                Assign a frozen contract to {employeeName}.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={
              assignMutation.isPending
            }
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {loadingPrefill ||
          loadingTemplates ? (
            <div className="flex min-h-[360px] items-center justify-center">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                Loading employee and contract information...
              </div>
            </div>
          ) : prefillFailed ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
              <p className="text-sm font-black text-rose-700">
                Could not load employee information
              </p>

              <p className="mt-1 text-xs font-medium text-rose-600">
                {getErrorMessage(
                  prefillError,
                )}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {missingFields.length >
              0 ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />

                    <div>
                      <p className="text-xs font-black text-amber-900">
                        Missing information
                      </p>

                      <p className="mt-1 text-[11px] font-medium text-amber-700">
                        HR must complete these fields before the contract can be assigned.
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {missingFields.map(
                          (field) => (
                            <span
                              key={
                                field.key
                              }
                              className="rounded-full border border-amber-200 bg-white px-2.5 py-1 text-[10px] font-black text-amber-700"
                            >
                              {field.label}
                            </span>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-black text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  All required contract information is complete.
                </div>
              )}

              <section className="space-y-4">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    Contract
                  </h3>

                  <p className="mt-1 text-[11px] font-medium text-slate-500">
                    Select the template that will be frozen for this employee.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label>
                    <FieldLabel required>
                      Contract Template
                    </FieldLabel>

                    <select
                      value={
                        form.templateId
                      }
                      onChange={(
                        event,
                      ) =>
                        selectTemplate(
                          event.currentTarget.value,
                        )
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">
                        Select a template
                      </option>

                      {templates
                        .filter(
                          (template) =>
                            template.isActive,
                        )
                        .map(
                          (template) => (
                            <option
                              key={
                                template.id
                              }
                              value={
                                template.id
                              }
                            >
                              {template.name}
                            </option>
                          ),
                        )}
                    </select>
                  </label>

                  <label>
                    <FieldLabel required>
                      Contract Type
                    </FieldLabel>

                    <input
                      value={
                        form.contractType
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "contractType",
                          event.currentTarget.value,
                        )
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                </div>

                {selectedTemplate ? (
                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                    <p className="text-[10px] font-black uppercase tracking-wider text-blue-600">
                      Selected template
                    </p>

                    <p className="mt-1 text-xs font-black text-blue-950">
                      {selectedTemplate.name}
                    </p>

                    {selectedTemplate.description ? (
                      <p className="mt-1 text-[11px] font-medium text-blue-700">
                        {selectedTemplate.description}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </section>

              <section className="space-y-4 border-t border-slate-100 pt-5">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Employee Information
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label>
                    <FieldLabel required>
                      Employee Name
                    </FieldLabel>

                    <input
                      value={
                        form.candidateName
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "candidateName",
                          event.currentTarget.value,
                        )
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />
                  </label>

                  <label>
                    <FieldLabel required>
                      Employee Email
                    </FieldLabel>

                    <input
                      type="email"
                      value={
                        form.candidateEmail
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "candidateEmail",
                          event.currentTarget.value,
                        )
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />
                  </label>

                  <label>
                    <FieldLabel>
                      Employee Phone
                    </FieldLabel>

                    <input
                      value={
                        form.candidatePhone ||
                        ""
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "candidatePhone",
                          event.currentTarget.value,
                        )
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />
                  </label>

                  <label>
                    <FieldLabel>
                      Employment Type
                    </FieldLabel>

                    <input
                      value={
                        form.employmentType ||
                        ""
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "employmentType",
                          event.currentTarget.value,
                        )
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />
                  </label>

                  <label>
                    <FieldLabel required>
                      Department
                    </FieldLabel>

                    <input
                      value={
                        form.departmentName
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "departmentName",
                          event.currentTarget.value,
                        )
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />
                  </label>

                  <label>
                    <FieldLabel required>
                      Position
                    </FieldLabel>

                    <input
                      value={
                        form.positionName
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "positionName",
                          event.currentTarget.value,
                        )
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />
                  </label>

                  <label>
                    <FieldLabel>
                      Reporting Manager
                    </FieldLabel>

                    <input
                      value={
                        form.managerName ||
                        ""
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "managerName",
                          event.currentTarget.value,
                        )
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />
                  </label>

                  <label>
                    <FieldLabel required>
                      Work Location
                    </FieldLabel>

                    <input
                      value={
                        form.workLocation
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "workLocation",
                          event.currentTarget.value,
                        )
                      }
                      placeholder="e.g. Addis Ababa Head Office"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                </div>
              </section>

              <section className="space-y-4 border-t border-slate-100 pt-5">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Compensation and Dates
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <label>
                    <FieldLabel required>
                      Salary
                    </FieldLabel>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        form.salary ??
                        ""
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "salary",
                          event.currentTarget.value,
                        )
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />
                  </label>

                  <label>
                    <FieldLabel required>
                      Currency
                    </FieldLabel>

                    <input
                      value={
                        form.currency
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "currency",
                          event.currentTarget.value.toUpperCase(),
                        )
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold uppercase text-slate-700 outline-none focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />
                  </label>

                  <label>
                    <FieldLabel>
                      Notice Period Days
                    </FieldLabel>

                    <input
                      type="number"
                      min="0"
                      value={
                        form.noticePeriodDays ??
                        ""
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "noticePeriodDays",
                          event.currentTarget.value
                            ? Number(
                                event.currentTarget.value,
                              )
                            : null,
                        )
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />
                  </label>

                  <label>
                    <FieldLabel required>
                      Start Date
                    </FieldLabel>

                    <input
                      type="date"
                      value={
                        form.startDate ||
                        ""
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "startDate",
                          event.currentTarget.value,
                        )
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />
                  </label>

                  <label>
                    <FieldLabel>
                      End Date
                    </FieldLabel>

                    <input
                      type="date"
                      value={
                        form.endDate ||
                        ""
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "endDate",
                          event.currentTarget.value,
                        )
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />
                  </label>

                  <label>
                    <FieldLabel>
                      Probation Start
                    </FieldLabel>

                    <input
                      type="date"
                      value={
                        form.probationStartDate ||
                        ""
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "probationStartDate",
                          event.currentTarget.value,
                        )
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />
                  </label>

                  <label>
                    <FieldLabel>
                      Probation End
                    </FieldLabel>

                    <input
                      type="date"
                      value={
                        form.probationEndDate ||
                        ""
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "probationEndDate",
                          event.currentTarget.value,
                        )
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                </div>
              </section>

              <section className="space-y-4 border-t border-slate-100 pt-5">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Company Information
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label>
                    <FieldLabel required>
                      Company Name
                    </FieldLabel>

                    <input
                      value={
                        form.companyName
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "companyName",
                          event.currentTarget.value,
                        )
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />
                  </label>

                  <label>
                    <FieldLabel required>
                      Company Address
                    </FieldLabel>

                    <input
                      value={
                        form.companyAddress
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "companyAddress",
                          event.currentTarget.value,
                        )
                      }
                      placeholder="Enter the company’s official address"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                </div>
              </section>

              <section className="space-y-4 border-t border-slate-100 pt-5">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Frozen Document
                </h3>

                <label>
                  <FieldLabel required>
                    Contract Subject
                  </FieldLabel>

                  <input
                    value={
                      form.subject
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        "subject",
                        event.currentTarget.value,
                      )
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <div>
                  <FieldLabel required>
                    Template Content
                  </FieldLabel>

                  <div
                    className="max-h-[320px] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 text-sm leading-7 text-slate-700"
                    dangerouslySetInnerHTML={{
                      __html:
                        form.bodyHtml ||
                        "<p>Select a contract template to preview its content.</p>",
                    }}
                  />
                </div>
              </section>
            </div>
          )}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-6 py-4">
          <p className="text-[11px] font-semibold text-slate-500">
            The rendered contract will be frozen when assigned.
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={
                assignMutation.isPending
              }
              onClick={onClose}
              className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-black text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                loadingPrefill ||
                loadingTemplates ||
                prefillFailed ||
                assignMutation.isPending ||
                missingFields.length >
                  0
              }
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-5 text-xs font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {assignMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileSignature className="h-4 w-4" />
              )}

              {assignMutation.isPending
                ? "Assigning..."
                : "Assign Contract"}
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
}
