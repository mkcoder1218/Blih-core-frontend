import { useEffect, useState } from "react";
import { ArrowRight, Loader2, Pencil, Trash2 } from "lucide-react";
import type { EmploymentChangeRequest } from "../../../api/employmentChanges";
import {
  useApproveEmploymentChange,
  useCounterEmploymentChange,
  useEmploymentChangeHistory,
  useRejectEmploymentChange,
} from "../../../hooks/useEmploymentChanges";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  kindLabel,
  money,
  netSalarySummary,
  nice,
} from "./employmentRequest.utils";

type DecisionMode = "APPROVE" | "REJECT" | "COUNTER" | null;

type Props = {
  open: boolean;
  request: EmploymentChangeRequest | null;
  currency: string;
  allowUpdate: boolean;
  allowDelete: boolean;
  deletePending: boolean;
  initialDecision?: DecisionMode;
  onOpenChange: (open: boolean) => void;
  onEdit: (request: EmploymentChangeRequest) => void;
  onDelete: (request: EmploymentChangeRequest) => void;
  showAlert: (message: string, type?: "success" | "info" | "error") => void;
};

export function EmploymentRequestDetailsDialog({
  open,
  request,
  currency,
  allowUpdate,
  allowDelete,
  deletePending,
  initialDecision = null,
  onOpenChange,
  onEdit,
  onDelete,
  showAlert,
}: Props) {
  const history = useEmploymentChangeHistory(request?.id);
  const approveMutation = useApproveEmploymentChange();
  const rejectMutation = useRejectEmploymentChange();
  const counterMutation = useCounterEmploymentChange();

  const [decisionMode, setDecisionMode] = useState<DecisionMode>(null);
  const [decisionComment, setDecisionComment] = useState("");
  const [counterSalary, setCounterSalary] = useState("");

  useEffect(() => {
    if (!open) return;
    setDecisionMode(initialDecision);
    setDecisionComment("");
    setCounterSalary(
      initialDecision === "COUNTER" && request
        ? String(request.finalSalary ?? request.requestedSalary ?? "")
        : "",
    );
  }, [initialDecision, open, request]);

  const close = () => {
    setDecisionMode(null);
    setDecisionComment("");
    setCounterSalary("");
    onOpenChange(false);
  };

  const submitDecision = async () => {
    if (!request || !decisionMode) return;

    try {
      if (decisionMode === "APPROVE") {
        await approveMutation.mutateAsync({
          id: request.id,
          comment: decisionComment.trim() || undefined,
        });
        showAlert("Request approved and moved to the next stage.", "success");
      } else if (decisionMode === "REJECT") {
        if (!decisionComment.trim()) {
          showAlert("Rejection reason is required.", "error");
          return;
        }
        await rejectMutation.mutateAsync({
          id: request.id,
          reason: decisionComment.trim(),
        });
        showAlert("Request rejected.", "info");
      } else {
        if (!decisionComment.trim() || Number(counterSalary) <= 0) {
          showAlert("Recommended salary and comment are required.", "error");
          return;
        }
        await counterMutation.mutateAsync({
          id: request.id,
          recommendedSalary: Number(counterSalary),
          comment: decisionComment.trim(),
        });
        showAlert("Recommended salary saved and forwarded.", "success");
      }
      close();
    } catch (error: any) {
      showAlert(
        error?.response?.data?.message || "Could not update the request.",
        "error",
      );
    }
  };

  const decisionPending =
    approveMutation.isPending ||
    rejectMutation.isPending ||
    counterMutation.isPending;

  const netSummary = request ? netSalarySummary(request, currency) : null;

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto rounded-2xl">
        {request && (
          <>
            <DialogHeader>
              <DialogTitle>{kindLabel(request)}</DialogTitle>
              <DialogDescription>
                {request.employee?.fullName || "Employee"} · {nice(request.status)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase text-slate-400">Change</p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-800">
                  {request.targetTitle ? (
                    <>
                      {request.currentTitle || "Current title"}
                      <ArrowRight className="h-3.5 w-3.5" />
                      {request.targetTitle}
                    </>
                  ) : (
                    "Salary change"
                  )}
                </p>

                {netSummary && (
                  <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/70 px-3 py-2.5">
                    <p className="text-[9px] font-black uppercase tracking-wide text-emerald-600">
                      Net salary
                    </p>
                    <p className="mt-1 text-xs font-bold text-emerald-700">
                      {netSummary}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 p-3 text-xs">
                  <span className="text-slate-400">Stage</span>
                  <p className="mt-1 font-bold text-slate-700">
                    {nice(request.approvalStage)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 p-3 text-xs">
                  <span className="text-slate-400">Effective</span>
                  <p className="mt-1 font-bold text-slate-700">
                    {request.effectiveDate}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-black text-slate-700">Reason</p>
                <p className="mt-1 whitespace-pre-wrap text-xs text-slate-500">
                  {request.reason}
                </p>
              </div>

              {!decisionMode &&
                (request.canApprove || allowUpdate || allowDelete) && (
                  <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                    {request.canApprove && (
                      <Button
                        size="sm"
                        onClick={() => setDecisionMode("APPROVE")}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        Approve
                      </Button>
                    )}

                    {request.canCounter && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setCounterSalary(
                            String(
                              request.finalSalary ?? request.requestedSalary ?? "",
                            ),
                          );
                          setDecisionMode("COUNTER");
                        }}
                      >
                        Counter Salary
                      </Button>
                    )}

                    {request.canApprove && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-200 text-red-600"
                        onClick={() => setDecisionMode("REJECT")}
                      >
                        Reject
                      </Button>
                    )}

                    {allowUpdate && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-blue-200 text-blue-700 hover:bg-blue-50"
                        onClick={() => onEdit(request)}
                      >
                        <Pencil className="mr-1.5 h-3.5 w-3.5" />
                        Update Request
                      </Button>
                    )}

                    {allowDelete && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={deletePending}
                        className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => onDelete(request)}
                      >
                        {deletePending ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        Delete Request
                      </Button>
                    )}
                  </div>
                )}

              {decisionMode && (
                <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/40 p-4">
                  {decisionMode === "COUNTER" && (
                    <div>
                      <label className="mb-1.5 block text-[11px] font-bold text-slate-600">
                        Recommended base salary
                      </label>
                      <Input
                        type="number"
                        min="0"
                        value={counterSalary}
                        onChange={(event) => setCounterSalary(event.currentTarget.value)}
                      />
                    </div>
                  )}
                  <Textarea
                    rows={3}
                    value={decisionComment}
                    onChange={(event) => setDecisionComment(event.currentTarget.value)}
                    placeholder={
                      decisionMode === "APPROVE"
                        ? "Comment (optional)"
                        : "Comment / reason"
                    }
                  />
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => setDecisionMode(null)}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => void submitDecision()}
                      disabled={decisionPending}
                    >
                      {decisionPending && (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      )}
                      Confirm
                    </Button>
                  </div>
                </div>
              )}

              <div className="border-t border-slate-100 pt-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-xs font-black text-slate-700">History</p>
                  <span className="text-[10px] font-medium text-slate-400">
                    Scroll for older activity
                  </span>
                </div>

                {history.isLoading ? (
                  <p className="text-xs text-slate-400">Loading history...</p>
                ) : (
                  <div className="max-h-64 space-y-2 overflow-y-auto overscroll-contain pr-1">
                    {(history.data || []).map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg border border-slate-100 px-3 py-2"
                      >
                        <p className="text-xs font-bold text-slate-700">
                          {nice(item.action)}
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-400">
                          {item.actor?.fullName || "System"} ·{" "}
                          {new Date(item.createdAt).toLocaleString()}
                        </p>
                        {item.comment && (
                          <p className="mt-1 whitespace-pre-wrap text-[11px] leading-4 text-slate-500">
                            {item.comment}
                          </p>
                        )}
                      </div>
                    ))}
                    {!history.data?.length && (
                      <p className="py-3 text-center text-[11px] text-slate-400">
                        No history recorded yet.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
