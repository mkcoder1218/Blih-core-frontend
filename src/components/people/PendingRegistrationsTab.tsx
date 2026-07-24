/**
 * PendingRegistrationsTab
 *
 * HR workflow for reviewing self-registered applicants.
 *
 * Approval flow:
 * 1. Review registration
 * 2. Confirm financial information
 * 3. Choose employment initialization
 * 4. Approve account
 * 5. Initialize probation when requested
 */

import React, {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  XCircle,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
} from "framer-motion";
import {
  pendingRegistrationsApi,
  REJECTION_TEMPLATES,
  type ApprovalFinancialInfo,
  type PendingRegistrant,
} from "../../api/pendingRegistrations";
import { initializeEmployeeProbation } from "../../api/employeeProbation";
import {
  DataTable,
  FilterBar,
  PageHeader,
  StatusBadge,
  UserAvatar,
} from "@/components/ui/blih";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { RegistrantDrawer } from "./RegisterantDrawer";
import {
  RegistrationApprovalDecisionDialog,
  type RegistrationProbationConfiguration,
} from "../../features/probation/components/RegistrationApprovalDecisionDialog";

function formatDate(
  value: string | null,
) {
  if (!value) {
    return "—";
  }

  return new Date(
    value,
  ).toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
}

function RejectModal({
  open,
  onClose,
  onConfirm,
  loading,
  applicantName,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (
    reason: string,
    templateMessage: string,
  ) => void;
  loading: boolean;
  applicantName: string;
}) {
  const [reason, setReason] =
    useState("");

  const [
    templateId,
    setTemplateId,
  ] = useState("");

  const selectedTemplate =
    REJECTION_TEMPLATES.find(
      (template) =>
        template.id ===
        templateId,
    );

  useEffect(() => {
    if (!open) {
      setReason("");
      setTemplateId("");
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const selectTemplate = (
    id: string,
  ) => {
    setTemplateId(id);

    const template =
      REJECTION_TEMPLATES.find(
        (item) =>
          item.id === id,
      );

    if (template) {
      setReason(
        template.message,
      );
    }
  };

  const submit = () => {
    if (!reason.trim()) {
      return;
    }

    onConfirm(
      reason.trim(),
      selectedTemplate?.message ||
        "",
    );
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.96,
          y: 8,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
        }}
        exit={{
          opacity: 0,
          scale: 0.96,
          y: 8,
        }}
        className="w-full max-w-md space-y-5 rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50">
            <XCircle className="h-5 w-5 text-rose-500" />
          </div>

          <div>
            <h3 className="text-sm font-black text-slate-900">
              Reject Registration
            </h3>

            <p className="mt-0.5 text-[11px] text-slate-500">
              {applicantName}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Use a template
          </p>

          <Select
            value={templateId}
            onValueChange={
              selectTemplate
            }
          >
            <SelectTrigger className="h-9 rounded-lg border-slate-200 text-xs">
              <SelectValue placeholder="Select a template (optional)" />
            </SelectTrigger>

            <SelectContent>
              {REJECTION_TEMPLATES.map(
                (template) => (
                  <SelectItem
                    key={
                      template.id
                    }
                    value={
                      template.id
                    }
                    className="text-xs"
                  >
                    {
                      template.label
                    }
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Reason message{" "}
            <span className="text-rose-400">
              *
            </span>
          </p>

          <textarea
            value={reason}
            onChange={(event) =>
              setReason(
                event.target.value,
              )
            }
            rows={4}
            placeholder="Explain why this application is being rejected."
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
          />

          <p className="text-[9px] text-slate-400">
            The applicant will
            receive this message by
            email with a link to
            update and resubmit.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading}
            className="h-8 rounded-lg px-4 text-xs"
          >
            Cancel
          </Button>

          <Button
            onClick={submit}
            disabled={
              !reason.trim() ||
              loading
            }
            className="h-8 rounded-lg bg-rose-600 px-5 text-xs text-white shadow-sm shadow-rose-600/20 hover:bg-rose-700"
          >
            {loading
              ? "Sending…"
              : "Reject & Notify"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export default function PendingRegistrationsTab({
  showAlert,
}: {
  showAlert: (
    message: string,
    type?:
      | "success"
      | "error"
      | "info",
  ) => void;
}) {
  const [
    statusFilter,
    setStatusFilter,
  ] = useState<
    "pending" | "rejected"
  >("pending");

  const [search, setSearch] =
    useState("");

  const [items, setItems] =
    useState<
      PendingRegistrant[]
    >([]);

  const [total, setTotal] =
    useState(0);

  const [page, setPage] =
    useState(1);

  const [pages, setPages] =
    useState(1);

  const [loading, setLoading] =
    useState(false);

  const [
    selected,
    setSelected,
  ] =
    useState<PendingRegistrant | null>(
      null,
    );

  const [
    snapshot,
    setSnapshot,
  ] =
    useState<PendingRegistrant | null>(
      null,
    );

  const [
    rejectOpen,
    setRejectOpen,
  ] = useState(false);

  const [
    decisionOpen,
    setDecisionOpen,
  ] = useState(false);

  const [
    pendingFinancialInfo,
    setPendingFinancialInfo,
  ] =
    useState<ApprovalFinancialInfo | null>(
      null,
    );

  const [
    approving,
    setApproving,
  ] = useState(false);

  const [
    rejecting,
    setRejecting,
  ] = useState(false);

  const load = useCallback(
    async (
      requestedPage = 1,
    ) => {
      setLoading(true);

      try {
        const response =
          await pendingRegistrationsApi.list(
            statusFilter,
            requestedPage,
          );

        const data =
          response.data?.data ||
          response.data;

        setItems(
          data.items || [],
        );

        setTotal(
          data.total || 0,
        );

        setPages(
          data.pages || 1,
        );

        setPage(
          requestedPage,
        );
      } catch {
        showAlert(
          "Failed to load registrations",
          "error",
        );
      } finally {
        setLoading(false);
      }
    },
    [
      statusFilter,
      showAlert,
    ],
  );

  useEffect(() => {
    load(1);
  }, [load]);

  const filtered =
    search.trim()
      ? items.filter(
          (item) =>
            item.fullName
              .toLowerCase()
              .includes(
                search.toLowerCase(),
              ) ||
            item.email
              .toLowerCase()
              .includes(
                search.toLowerCase(),
              ),
        )
      : items;

  const openDrawer = (
    row: PendingRegistrant,
  ) => {
    setSelected(row);
    setSnapshot(row);
  };

  const requestApproval = (
    financialInfo: ApprovalFinancialInfo,
  ) => {
    if (!snapshot) {
      return;
    }

    setPendingFinancialInfo(
      financialInfo,
    );

    setSelected(null);
    setDecisionOpen(true);
  };

  const completeApproval =
    async (
      configuration: RegistrationProbationConfiguration,
    ) => {
      if (
        !snapshot ||
        !pendingFinancialInfo
      ) {
        return;
      }

      setApproving(true);

      try {
        const approval =
          await pendingRegistrationsApi.approve(
            snapshot.id,
            {
              financialInfo:
                pendingFinancialInfo,

              approvalMode:
                configuration.mode,
            },
          );

        const approvedUserId =
          approval.userId ||
          snapshot.id;

        if (
          configuration.mode ===
          "START_PROBATION"
        ) {
          if (
            !configuration.startDate ||
            !configuration.durationMonths ||
            !configuration.expectedEndDate ||
            !configuration.managerUserId
          ) {
            throw new Error(
              "Probation configuration is incomplete.",
            );
          }

          await initializeEmployeeProbation(
            {
              employeeUserId:
                approvedUserId,

              startDate:
                configuration.startDate,

              durationMonths:
                configuration.durationMonths,

              expectedEndDate:
                configuration.expectedEndDate,

              managerUserId:
                configuration.managerUserId,

              finalApproverUserId:
                configuration.finalApproverUserId ||
                null,

              source:
                "PORTAL_REGISTRATION",

              status: "ACTIVE",

              notes:
                configuration.notes ||
                null,

              metadata: {
                registrationApprovalMode:
                  configuration.mode,

                registrationId:
                  snapshot.id,
              },
            },
          );
        }

        showAlert(
          configuration.mode ===
            "START_PROBATION"
            ? `${snapshot.fullName} has been approved and probation was initialized`
            : `${snapshot.fullName} has been approved`,
          "success",
        );

        setDecisionOpen(false);
        setSelected(null);
        setSnapshot(null);
        setPendingFinancialInfo(
          null,
        );

        await load(page);
      } catch (error: any) {
        showAlert(
          error?.response?.data
            ?.message ||
            error?.message ||
            "Failed to approve registration",
          "error",
        );
      } finally {
        setApproving(false);
      }
    };

  const handleReject =
    async (
      reason: string,
      templateMessage: string,
    ) => {
      if (!snapshot) {
        return;
      }

      setRejecting(true);

      try {
        await pendingRegistrationsApi.reject(
          snapshot.id,
          reason,
          templateMessage,
        );

        showAlert(
          `${snapshot.fullName} has been rejected and notified`,
          "success",
        );

        setRejectOpen(false);
        setSelected(null);
        setSnapshot(null);

        await load(page);
      } catch (error: any) {
        showAlert(
          error?.response?.data
            ?.message ||
            error?.message ||
            "Failed to reject registration",
          "error",
        );
      } finally {
        setRejecting(false);
      }
    };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="People"
        title="Pending Registrations"
        description="Review self-registered applicants and approve, start probation, or reject their account requests."
        actions={
          <Button
            variant="outline"
            onClick={() =>
              load(page)
            }
            className="h-8 gap-1.5 rounded-xl border-slate-200 text-xs"
          >
            <RefreshCw
              className={cn(
                "h-3.5 w-3.5",
                loading &&
                  "animate-spin",
              )}
            />

            Refresh
          </Button>
        }
      />

      <FilterBar
        search={search}
        onSearchChange={
          setSearch
        }
        searchPlaceholder="Search by name or email…"
        filters={[
          {
            value:
              statusFilter,

            onChange: (
              value,
            ) => {
              setStatusFilter(
                value as
                  | "pending"
                  | "rejected",
              );

              setPage(1);
            },

            placeholder:
              "Status",

            options: [
              {
                value:
                  "pending",
                label:
                  "Pending Review",
              },

              {
                value:
                  "rejected",
                label:
                  "Rejected",
              },
            ],
          },
        ]}
      />

      <div className="flex items-center gap-3 text-[11px]">
        <span className="font-medium text-slate-400">
          {total}{" "}
          {statusFilter ===
          "pending"
            ? "pending"
            : "rejected"}{" "}
          applicant
          {total !== 1
            ? "s"
            : ""}
        </span>

        {pages > 1 ? (
          <>
            <span className="text-slate-300">
              ·
            </span>

            <span className="font-medium text-slate-400">
              Page {page} of{" "}
              {pages}
            </span>
          </>
        ) : null}
      </div>

      <DataTable
        columns={[
          "Applicant",
          "Role Requested",
          "Department",
          "Applied On",
          "Status",
          "",
        ]}
        rows={filtered}
        loading={loading}
        emptyMessage={
          statusFilter ===
          "pending"
            ? "No pending registrations — all caught up!"
            : "No rejected applications found."
        }
        renderRow={(row) => {
          const registrant =
            row as PendingRegistrant;

          return (
            <tr
              key={
                registrant.id
              }
              className="cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50/60"
              onClick={() =>
                openDrawer(
                  registrant,
                )
              }
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <UserAvatar
                    name={
                      registrant.fullName
                    }
                    size="sm"
                  />

                  <div>
                    <p className="text-xs font-bold leading-none text-slate-900">
                      {
                        registrant.fullName
                      }
                    </p>

                    <p className="mt-0.5 text-[10px] text-slate-400">
                      {
                        registrant.email
                      }
                    </p>
                  </div>
                </div>
              </td>

              <td className="px-4 py-3">
                <span className="text-[11px] font-semibold text-slate-600">
                  {registrant.requestedRoleKey?.replace(
                    /_/g,
                    " ",
                  ) || "—"}
                </span>
              </td>

              <td className="px-4 py-3">
                <span className="text-[11px] text-slate-500">
                  {registrant
                    .department
                    ?.name ||
                    "—"}
                </span>
              </td>

              <td className="px-4 py-3">
                <span className="text-[11px] text-slate-500">
                  {formatDate(
                    registrant.createdAt,
                  )}
                </span>
              </td>

              <td className="px-4 py-3">
                <StatusBadge
                  status={
                    registrant.status
                  }
                />
              </td>

              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={(
                    event,
                  ) => {
                    event.stopPropagation();

                    openDrawer(
                      registrant,
                    );
                  }}
                  className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 transition-colors hover:border-blue-200 hover:bg-blue-50"
                >
                  <Eye className="h-3.5 w-3.5 text-slate-400 hover:text-blue-500" />
                </button>
              </td>
            </tr>
          );
        }}
      />

      {pages > 1 ? (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              load(page - 1)
            }
            disabled={
              page <= 1 ||
              loading
            }
            className="h-7 w-7 rounded-lg p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="px-2 text-xs font-semibold text-slate-500">
            {page} / {pages}
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              load(page + 1)
            }
            disabled={
              page >= pages ||
              loading
            }
            className="h-7 w-7 rounded-lg p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      ) : null}

      <AnimatePresence>
        {selected ? (
          <>
            <div
              className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[2px]"
              onClick={() =>
                setSelected(null)
              }
            />

            <RegistrantDrawer
              registrant={
                selected
              }
              onClose={() =>
                setSelected(null)
              }
              onApprove={
                requestApproval
              }
              onReject={() =>
                setRejectOpen(
                  true,
                )
              }
              approving={
                approving
              }
              rejecting={
                rejecting
              }
            />
          </>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        <RejectModal
          open={rejectOpen}
          onClose={() =>
            setRejectOpen(
              false,
            )
          }
          onConfirm={
            handleReject
          }
          loading={
            rejecting
          }
          applicantName={
            snapshot?.fullName ||
            ""
          }
        />
      </AnimatePresence>

      <RegistrationApprovalDecisionDialog
        isOpen={
          decisionOpen
        }
        registrant={
          snapshot
        }
        submitting={
          approving
        }
        onClose={() => {
          if (approving) {
            return;
          }

          setDecisionOpen(
            false,
          );

          setPendingFinancialInfo(
            null,
          );
        }}
        onConfirm={
          completeApproval
        }
      />
    </div>
  );
}
