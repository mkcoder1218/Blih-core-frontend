import {
  type FormEvent,
  useMemo,
  useState,
} from 'react';

import {
  Copy,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  X,
} from 'lucide-react';

import {
  type EmploymentContractTemplate,
  type EmploymentContractTemplateInput,
} from '../api/employmentContracts';

import ContractTemplateStatusModal from '../components/contracts/ContractTemplateStatusModal';

import RichTextEditor, {
  type RichTextVariable,
} from '../components/shared/RichTextEditor';

import {
  useCreateEmploymentContractTemplate,
  useDeleteEmploymentContractTemplate,
  useEmploymentContractTemplates,
  useUpdateEmploymentContractTemplate,
} from '../hooks/useEmploymentContracts';

interface EmploymentContractTemplatePageProps {
  showAlert: (
    message: string,
    type?: 'success' | 'info' | 'error',
  ) => void;
}

interface TemplateStatusModalState {
  mode: 'deactivate' | 'delete';
  template: EmploymentContractTemplate;
}

const CONTRACT_TYPES = [
  'PERMANENT',
  'FIXED_TERM',
  'PART_TIME',
  'TEMPORARY',
  'INTERNSHIP',
  'CONSULTANT',
] as const;

const CONTRACT_VARIABLES: RichTextVariable[] = [
  {
    key: 'contractNumber',
    label: 'Contract Number',
  },
  {
    key: 'candidateName',
    label: 'Employee Name',
  },
  {
    key: 'candidateEmail',
    label: 'Employee Email',
  },
  {
    key: 'candidatePhone',
    label: 'Employee Phone',
  },
  {
    key: 'companyName',
    label: 'Company Name',
  },
  {
    key: 'companyAddress',
    label: 'Company Address',
  },
  {
    key: 'jobTitle',
    label: 'Job Title',
  },
  {
    key: 'departmentName',
    label: 'Department',
  },
  {
    key: 'managerName',
    label: 'Manager',
  },
  {
    key: 'formattedSalary',
    label: 'Salary',
  },
  {
    key: 'employmentType',
    label: 'Employment Type',
  },
  {
    key: 'contractType',
    label: 'Contract Type',
  },
  {
    key: 'workLocation',
    label: 'Work Location',
  },
  {
    key: 'startDate',
    label: 'Start Date',
  },
  {
    key: 'endDate',
    label: 'End Date',
  },
  {
    key: 'probationStartDate',
    label: 'Probation Start',
  },
  {
    key: 'probationEndDate',
    label: 'Probation End',
  },
  {
    key: 'noticePeriodDays',
    label: 'Notice Period',
  },
];

const DEFAULT_BODY_HTML = `
  <h2>Employment Agreement</h2>

  <p>
    This Employment Agreement is made between
    <strong>{{companyName}}</strong> and
    <strong>{{candidateName}}</strong>.
  </p>

  <h3>1. Appointment</h3>

  <p>
    The employee is appointed as <strong>{{jobTitle}}</strong>
    in the <strong>{{departmentName}}</strong> department and
    will report to <strong>{{managerName}}</strong>.
  </p>

  <h3>2. Commencement</h3>

  <p>
    Employment will commence on <strong>{{startDate}}</strong>.
  </p>

  <h3>3. Compensation</h3>

  <p>
    The employee will receive a gross salary of
    <strong>{{formattedSalary}}</strong>.
  </p>

  <h3>4. Work Location</h3>

  <p>
    The primary work location will be
    <strong>{{workLocation}}</strong>.
  </p>

  <h3>5. Probation</h3>

  <p>
    The probation period begins on
    <strong>{{probationStartDate}}</strong> and ends on
    <strong>{{probationEndDate}}</strong>.
  </p>

  <h3>6. Termination</h3>

  <p>
    Either party may terminate this agreement by providing
    <strong>{{noticePeriodDays}}</strong> days written notice,
    subject to applicable law and company policy.
  </p>
`;

function createEmptyForm(): EmploymentContractTemplateInput {
  return {
    name: '',
    description: '',
    contractType: 'PERMANENT',
    subject:
      'Employment Contract - {{candidateName}} - {{jobTitle}}',
    bodyHtml: DEFAULT_BODY_HTML,
    bodyText: '',
    variables: CONTRACT_VARIABLES.map(
      (variable) => variable.key,
    ),
    isDefault: false,
    isActive: true,
  };
}

function getErrorMessage(
  error: unknown,
): string {
  if (
    typeof error === 'object' &&
    error !== null
  ) {
    const candidate =
      error as {
        response?: {
          data?: {
            message?: string;
            error?: {
              message?: string;
            };
          };
        };
        message?: string;
      };

    return (
      candidate.response?.data?.message ||
      candidate.response?.data?.error?.message ||
      candidate.message ||
      'Something went wrong'
    );
  }

  return 'Something went wrong';
}

function formatContractType(
  value: string,
): string {
  return value
    .replace(/_/g, ' ')
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    );
}

function getPlainText(
  html: string,
): string {
  if (
    typeof document === 'undefined'
  ) {
    return html
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const element =
    document.createElement('div');

  element.innerHTML =
    html;

  return (
    element.textContent ||
    element.innerText ||
    ''
  )
    .replace(/\s+/g, ' ')
    .trim();
}

export default function EmploymentContractTemplatePage({
  showAlert,
}: EmploymentContractTemplatePageProps) {
  const [
    search,
    setSearch,
  ] = useState('');

  const [
    contractType,
    setContractType,
  ] = useState('');

  const [
    modalOpen,
    setModalOpen,
  ] = useState(false);

  const [
    editingTemplate,
    setEditingTemplate,
  ] =
    useState<EmploymentContractTemplate | null>(
      null,
    );

  const [
    statusModal,
    setStatusModal,
  ] =
    useState<TemplateStatusModalState | null>(
      null,
    );

  const [
    form,
    setForm,
  ] =
    useState<EmploymentContractTemplateInput>(
      createEmptyForm,
    );

  const {
    data: templates = [],
    isLoading,
    isError,
    error,
  } =
    useEmploymentContractTemplates({
      includeInactive: true,
    });

  const createMutation =
    useCreateEmploymentContractTemplate();

  const updateMutation =
    useUpdateEmploymentContractTemplate();

  const deleteMutation =
    useDeleteEmploymentContractTemplate();

  const filteredTemplates =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      return templates.filter(
        (template) => {
          const searchableContent =
            [
              template.name,
              template.description,
              template.subject,
              template.contractType,
            ]
              .filter(Boolean)
              .join(' ')
              .toLowerCase();

          const matchesSearch =
            !normalizedSearch ||
            searchableContent.includes(
              normalizedSearch,
            );

          const matchesType =
            !contractType ||
            template.contractType ===
              contractType;

          return (
            matchesSearch &&
            matchesType
          );
        },
      );
    }, [
      contractType,
      search,
      templates,
    ]);

  const saving =
    createMutation.isPending ||
    updateMutation.isPending;

  const statusActionLoading =
    deleteMutation.isPending;

  const openCreateModal = () => {
    setEditingTemplate(
      null,
    );

    setForm(
      createEmptyForm(),
    );

    setModalOpen(
      true,
    );
  };

  const openEditModal = (
    template: EmploymentContractTemplate,
  ) => {
    setEditingTemplate(
      template,
    );

    setForm({
      name:
        template.name,

      description:
        template.description ||
        '',

      contractType:
        template.contractType,

      subject:
        template.subject,

      bodyHtml:
        template.bodyHtml,

      bodyText:
        template.bodyText ||
        '',

      variables:
        template.variables ||
        [],

      isDefault:
        template.isDefault,

      isActive:
        template.isActive,
    });

    setModalOpen(
      true,
    );
  };

  const closeModal = () => {
    if (saving) {
      return;
    }

    setModalOpen(
      false,
    );

    setEditingTemplate(
      null,
    );

    setForm(
      createEmptyForm(),
    );
  };

  const openDeactivateModal = (
    template: EmploymentContractTemplate,
  ) => {
    setStatusModal({
      mode:
        'deactivate',

      template,
    });
  };

  const closeStatusModal = () => {
    if (
      statusActionLoading
    ) {
      return;
    }

    setStatusModal(
      null,
    );
  };

  const handleSave = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const templateName =
      form.name.trim();

    const subject =
      form.subject.trim();

    const plainText =
      getPlainText(
        form.bodyHtml,
      );

    if (!templateName) {
      showAlert(
        'Template name is required.',
        'error',
      );

      return;
    }

    if (!subject) {
      showAlert(
        'Template subject is required.',
        'error',
      );

      return;
    }

    if (!plainText) {
      showAlert(
        'Contract content cannot be empty.',
        'error',
      );

      return;
    }

    const payload:
      EmploymentContractTemplateInput =
      {
        ...form,

        name:
          templateName,

        description:
          form.description
            ?.trim() ||
          null,

        subject,

        bodyText:
          plainText,

        variables:
          CONTRACT_VARIABLES.map(
            (variable) =>
              variable.key,
          ),
      };

    try {
      if (
        editingTemplate
      ) {
        await updateMutation.mutateAsync({
          id:
            editingTemplate.id,

          input:
            payload,
        });

        showAlert(
          'Contract template updated successfully.',
          'success',
        );
      } else {
        await createMutation.mutateAsync(
          payload,
        );

        showAlert(
          'Contract template created successfully.',
          'success',
        );
      }

      setModalOpen(
        false,
      );

      setEditingTemplate(
        null,
      );

      setForm(
        createEmptyForm(),
      );
    } catch (
      mutationError
    ) {
      showAlert(
        getErrorMessage(
          mutationError,
        ),
        'error',
      );
    }
  };

  const handleDuplicate = async (
    template: EmploymentContractTemplate,
  ) => {
    try {
      await createMutation.mutateAsync({
        name:
          `${template.name} Copy`,

        description:
          template.description ||
          '',

        contractType:
          template.contractType,

        subject:
          template.subject,

        bodyHtml:
          template.bodyHtml,

        bodyText:
          template.bodyText,

        variables:
          template.variables ||
          [],

        isDefault:
          false,

        isActive:
          true,
      });

      showAlert(
        'Contract template duplicated.',
        'success',
      );
    } catch (
      mutationError
    ) {
      showAlert(
        getErrorMessage(
          mutationError,
        ),
        'error',
      );
    }
  };

  const handleConfirmStatusAction =
    async () => {
      if (
        !statusModal
      ) {
        return;
      }

      const template =
        statusModal.template;

      try {
        await deleteMutation.mutateAsync(
          template.id,
        );

        showAlert(
          `"${template.name}" was deactivated successfully.`,
          'success',
        );

        setStatusModal(
          null,
        );
      } catch (
        mutationError
      ) {
        showAlert(
          getErrorMessage(
            mutationError,
          ),
          'error',
        );
      }
    };

  return (
    <div className="space-y-5 pb-12">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-xl font-black text-slate-950">
            Contract Templates
          </h1>

          <p className="mt-1 text-sm font-medium text-slate-500">
            Create reusable rich-text employment contract templates.
          </p>
        </div>

        <button
          type="button"
          onClick={
            openCreateModal
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />

          New Contract Template
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_240px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="search"
              value={
                search
              }
              onChange={(
                event,
              ) =>
                setSearch(
                  event.currentTarget.value,
                )
              }
              placeholder="Search contract templates"
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs font-semibold text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <select
            value={
              contractType
            }
            onChange={(
              event,
            ) =>
              setContractType(
                event.currentTarget.value,
              )
            }
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">
              All contract types
            </option>

            {CONTRACT_TYPES.map(
              (type) => (
                <option
                  key={
                    type
                  }
                  value={
                    type
                  }
                >
                  {formatContractType(
                    type,
                  )}
                </option>
              ),
            )}
          </select>

          <button
            type="button"
            onClick={() => {
              setSearch(
                '',
              );

              setContractType(
                '',
              );
            }}
            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-600 transition hover:bg-slate-50"
          >
            Reset
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />

            Loading contract templates...
          </div>
        </div>
      ) : null}

      {isError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
          <p className="text-sm font-black text-rose-700">
            Could not load contract templates
          </p>

          <p className="mt-1 text-xs font-medium text-rose-600">
            {getErrorMessage(
              error,
            )}
          </p>
        </div>
      ) : null}

      {!isLoading &&
      !isError &&
      filteredTemplates.length ===
        0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-5 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <FileText className="h-6 w-6" />
          </div>

          <h2 className="mt-4 text-sm font-black text-slate-900">
            No contract templates found
          </h2>

          <p className="mt-1 max-w-md text-xs font-medium text-slate-500">
            Create a reusable employment contract template with rich-text clauses and dynamic variables.
          </p>

          <button
            type="button"
            onClick={
              openCreateModal
            }
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />

            Create Template
          </button>
        </div>
      ) : null}

      {!isLoading &&
      !isError &&
      filteredTemplates.length >
        0 ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {filteredTemplates.map(
            (template) => (
              <article
                key={
                  template.id
                }
                className="flex min-h-[260px] flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-sm font-black text-slate-950">
                        {template.name}
                      </h2>

                      {template.isDefault ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[9px] font-black uppercase text-amber-700">
                          <Star className="h-3 w-3 fill-current" />

                          Default
                        </span>
                      ) : null}

                      {!template.isActive ? (
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black uppercase text-slate-500">
                          Inactive
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-blue-600">
                      {formatContractType(
                        template.contractType,
                      )}
                    </p>
                  </div>

                  <FileText className="h-5 w-5 flex-shrink-0 text-slate-300" />
                </div>

                <p className="mt-4 line-clamp-2 text-xs font-medium leading-5 text-slate-500">
                  {template.description ||
                    'No description provided.'}
                </p>

                <div className="mt-4 rounded-xl bg-slate-50 p-3">
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                    Subject
                  </p>

                  <p className="mt-1 line-clamp-2 text-xs font-bold text-slate-700">
                    {template.subject}
                  </p>
                </div>

                <div className="mt-4 flex-1">
                  <p className="line-clamp-4 text-[11px] font-medium leading-5 text-slate-500">
                    {getPlainText(
                      template.bodyHtml,
                    )}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() =>
                      handleDuplicate(
                        template,
                      )
                    }
                    disabled={
                      createMutation.isPending
                    }
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-[10px] font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Copy className="h-3.5 w-3.5" />

                    Copy
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      openEditModal(
                        template,
                      )
                    }
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 text-[10px] font-black text-blue-700 transition hover:bg-blue-100"
                  >
                    <Pencil className="h-3.5 w-3.5" />

                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      openDeactivateModal(
                        template,
                      )
                    }
                    disabled={
                      deleteMutation.isPending ||
                      !template.isActive
                    }
                    className="inline-flex h-9 items-center justify-center rounded-lg border border-rose-200 px-3 text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                    title={
                      template.isActive
                        ? 'Deactivate template'
                        : 'Template is already inactive'
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </article>
            ),
          )}
        </div>
      ) : null}

      {modalOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Close modal"
            className="absolute inset-0"
            onClick={
              closeModal
            }
          />

          <div className="relative z-10 flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-sm font-black text-slate-950">
                  {editingTemplate
                    ? 'Edit Contract Template'
                    : 'Create Contract Template'}
                </h2>

                <p className="mt-1 text-[11px] font-medium text-slate-500">
                  Build a reusable rich-text contract document.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeModal
                }
                disabled={
                  saving
                }
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={
                handleSave
              }
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="flex-1 space-y-5 overflow-y-auto p-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Template Name *
                    </label>

                    <input
                      type="text"
                      required
                      value={
                        form.name
                      }
                      onChange={(
                        event,
                      ) =>
                        setForm(
                          (
                            previous,
                          ) => ({
                            ...previous,

                            name:
                              event.currentTarget.value,
                          }),
                        )
                      }
                      placeholder="Permanent Employment Contract"
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Contract Type *
                    </label>

                    <select
                      required
                      value={
                        form.contractType
                      }
                      onChange={(
                        event,
                      ) =>
                        setForm(
                          (
                            previous,
                          ) => ({
                            ...previous,

                            contractType:
                              event.currentTarget.value,
                          }),
                        )
                      }
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                    >
                      {CONTRACT_TYPES.map(
                        (type) => (
                          <option
                            key={
                              type
                            }
                            value={
                              type
                            }
                          >
                            {formatContractType(
                              type,
                            )}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Description
                  </label>

                  <textarea
                    rows={
                      2
                    }
                    value={
                      form.description ||
                      ''
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm(
                        (
                          previous,
                        ) => ({
                          ...previous,

                          description:
                            event.currentTarget.value,
                        }),
                      )
                    }
                    placeholder="Describe when this contract template should be used."
                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Document Subject *
                  </label>

                  <input
                    type="text"
                    required
                    value={
                      form.subject
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm(
                        (
                          previous,
                        ) => ({
                          ...previous,

                          subject:
                            event.currentTarget.value,
                        }),
                      )
                    }
                    placeholder="Employment Contract - {{candidateName}}"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <RichTextEditor
                  label="Contract Content"
                  description="Use the variables below to insert employee, company, salary, and date information."
                  required
                  value={
                    form.bodyHtml
                  }
                  onChange={(
                    bodyHtml,
                  ) =>
                    setForm(
                      (
                        previous,
                      ) => ({
                        ...previous,

                        bodyHtml,
                      }),
                    )
                  }
                  variables={
                    CONTRACT_VARIABLES
                  }
                  minHeight={
                    340
                  }
                  maxHeight={
                    540
                  }
                />

                <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={
                        Boolean(
                          form.isDefault,
                        )
                      }
                      onChange={(
                        event,
                      ) => {
                        const checked =
                          event.currentTarget.checked;

                        setForm(
                          (
                            previous,
                          ) => ({
                            ...previous,

                            isDefault:
                              checked,
                          }),
                        );
                      }}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />

                    <span>
                      <span className="block text-xs font-black text-slate-800">
                        Default template
                      </span>

                      <span className="mt-0.5 block text-[11px] font-medium text-slate-500">
                        Use this template as the default for this contract type.
                      </span>
                    </span>
                  </label>

                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={
                        form.isActive !==
                        false
                      }
                      onChange={(
                        event,
                      ) => {
                        const checked =
                          event.currentTarget.checked;

                        setForm(
                          (
                            previous,
                          ) => ({
                            ...previous,

                            isActive:
                              checked,
                          }),
                        );
                      }}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />

                    <span>
                      <span className="block text-xs font-black text-slate-800">
                        Active template
                      </span>

                      <span className="mt-0.5 block text-[11px] font-medium text-slate-500">
                        Allow this template to be selected when creating contracts.
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-white px-5 py-4">
                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  disabled={
                    saving
                  }
                  className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-5 text-xs font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}

                  {editingTemplate
                    ? 'Save Changes'
                    : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <ContractTemplateStatusModal
        open={
          Boolean(
            statusModal,
          )
        }
        mode={
          statusModal?.mode ||
          'deactivate'
        }
        templateName={
          statusModal?.template
            .name ||
          ''
        }
        loading={
          statusActionLoading
        }
        onClose={
          closeStatusModal
        }
        onConfirm={
          handleConfirmStatusAction
        }
      />
    </div>
  );
}
