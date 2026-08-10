import { useState } from "react";
import { BookOpen, BriefcaseBusiness, Plus } from "lucide-react";

import {
  ConfirmDialog,
  EmptyState,
  FilterBar,
  FormField,
  FormRow,
  InfoAlert,
  LoadingSpinner,
  PageHeader,
  SectionCard,
  StatusBadge,
  TabSwitcher,
  UserAvatar,
} from "@/components/ui/blih";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmploymentChangesPanel } from "@/components/people/employment-changes/EmploymentChangesPanel";
import {
  useApproveTrainingRequest,
  useRejectTrainingRequest,
  useSubmitTrainingRequest,
  useTrainingRequests,
} from "../../../hooks/useDevelopment";

interface DevelopmentTabProps {
  showAlert: (title: string, type?: "success" | "info" | "error") => void;
}

interface TrainingForm {
  title: string;
  provider: string;
  trainingType: string;
  startDate: string;
  endDate: string;
  cost: string;
}

const EMPTY_TRAINING: TrainingForm = {
  title: "",
  provider: "",
  trainingType: "external",
  startDate: "",
  endDate: "",
  cost: "",
};

function initialSubTab(): "training" | "employment" {
  if (typeof window === "undefined") return "training";
  return new URLSearchParams(window.location.search).has("employmentChangeRequestId")
    ? "employment"
    : "training";
}

export default function DevelopmentTab({ showAlert }: DevelopmentTabProps) {
  const [subTab, setSubTab] = useState<"training" | "employment">(initialSubTab);
  const [search, setSearch] = useState("");
  const [trainingModalOpen, setTrainingModalOpen] = useState(false);
  const [trainingForm, setTrainingForm] = useState<TrainingForm>(EMPTY_TRAINING);
  const [confirmRejectTraining, setConfirmRejectTraining] = useState<string | null>(null);
  const [confirmApproveTraining, setConfirmApproveTraining] = useState<string | null>(null);

  const {
    data: trainingData,
    isLoading: trainingLoading,
    error: trainingError,
  } = useTrainingRequests();
  const submitTraining = useSubmitTrainingRequest();
  const approveTraining = useApproveTrainingRequest();
  const rejectTraining = useRejectTrainingRequest();

  const trainingRows = (trainingData?.rows ?? []).filter(
    (request) =>
      request.title.toLowerCase().includes(search.toLowerCase()) ||
      (request.employee?.fullName ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const handleSubmitTraining = async () => {
    if (!trainingForm.title.trim()) return;

    try {
      await submitTraining.mutateAsync({
        title: trainingForm.title.trim(),
        provider: trainingForm.provider || undefined,
        trainingType: trainingForm.trainingType || undefined,
        startDate: trainingForm.startDate || undefined,
        endDate: trainingForm.endDate || undefined,
        cost: trainingForm.cost ? Number(trainingForm.cost) : undefined,
      });
      setTrainingModalOpen(false);
      setTrainingForm(EMPTY_TRAINING);
      showAlert("Training request submitted successfully!", "success");
    } catch (error: any) {
      showAlert(
        error?.response?.data?.message || "Could not submit training request.",
        "error",
      );
    }
  };

  const handleApproveTraining = async (id: string) => {
    try {
      await approveTraining.mutateAsync({ id });
      setConfirmApproveTraining(null);
      showAlert("Training request approved!", "success");
    } catch (error: any) {
      showAlert(
        error?.response?.data?.message || "Could not approve training request.",
        "error",
      );
    }
  };

  const handleRejectTraining = async (id: string) => {
    try {
      await rejectTraining.mutateAsync({ id });
      setConfirmRejectTraining(null);
      showAlert("Training request rejected.", "info");
    } catch (error: any) {
      showAlert(
        error?.response?.data?.message || "Could not reject training request.",
        "error",
      );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Career Management"
        title="Development & Employment Changes"
        description="Manage training, title changes, salary increases, and their approval workflows."
        actions={
          subTab === "training" ? (
            <Button onClick={() => setTrainingModalOpen(true)} className="gap-1.5">
              <Plus className="h-4 w-4" /> New Training Request
            </Button>
          ) : undefined
        }
      />

      <TabSwitcher
        tabs={[
          {
            id: "training",
            label: "Training Requests",
            badge:
              trainingData?.rows?.filter((request) => request.status === "requested")
                .length ?? 0,
          },
          {
            id: "employment",
            label: "Employment Changes",
          },
        ]}
        active={subTab}
        onChange={(tab) => {
          setSubTab(tab as "training" | "employment");
          setSearch("");
        }}
        variant="pill"
      />

      {subTab === "training" && (
        <SectionCard title="Training Requests" icon={<BookOpen />} accent="blue">
          <div className="space-y-4">
            <FilterBar
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search by title or employee..."
            />

            {trainingError && (
              <InfoAlert variant="error" message="Failed to load training requests." />
            )}

            {trainingLoading ? (
              <LoadingSpinner label="Loading training requests…" />
            ) : trainingRows.length === 0 ? (
              <EmptyState
                icon={<BookOpen />}
                title="No training requests"
                description="Training requests will appear here once submitted."
                action={
                  <Button
                    onClick={() => setTrainingModalOpen(true)}
                    className="gap-1.5"
                  >
                    <Plus className="h-4 w-4" /> New Request
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {trainingRows.map((request) => (
                  <div
                    key={request.id}
                    className="flex flex-col justify-between rounded-xl border border-slate-100 bg-white p-5 transition-all hover:border-slate-200"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <UserAvatar
                          name={request.employee?.fullName ?? "Employee"}
                          subtitle={request.employee?.email ?? "Training Request"}
                        />
                        <StatusBadge status={request.status} />
                      </div>

                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <p className="text-xs font-bold text-blue-700">
                          {request.title}
                        </p>
                        {request.provider && (
                          <p className="mt-0.5 text-[10px] text-slate-400">
                            Provider: {request.provider}
                          </p>
                        )}

                        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-200/50 pt-3 text-center text-xs">
                          <div>
                            <span className="block text-[9px] font-medium uppercase text-slate-400">
                              Type
                            </span>
                            <p className="mt-0.5 font-bold capitalize text-slate-800">
                              {request.trainingType ?? "—"}
                            </p>
                          </div>
                          <div>
                            <span className="block text-[9px] font-medium uppercase text-slate-400">
                              Cost
                            </span>
                            <p className="mt-0.5 font-bold text-slate-800">
                              {request.cost ? `$${request.cost.toLocaleString()}` : "—"}
                            </p>
                          </div>
                          <div>
                            <span className="block text-[9px] font-medium uppercase text-slate-400">
                              Start
                            </span>
                            <p className="mt-0.5 font-mono font-bold text-slate-800">
                              {request.startDate?.slice(0, 10) ?? "—"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {request.status === "requested" && (
                      <div className="mt-4 flex gap-3 border-t border-slate-50 pt-4">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => setConfirmApproveTraining(request.id)}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => setConfirmRejectTraining(request.id)}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {subTab === "employment" && (
        <SectionCard
          title="Employment Changes"
          icon={<BriefcaseBusiness />}
          accent="blue"
        >
          <EmploymentChangesPanel showAlert={showAlert} />
        </SectionCard>
      )}

      <Dialog open={trainingModalOpen} onOpenChange={setTrainingModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-600" /> New Training Request
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <FormField label="Training Title" required>
              <Input
                placeholder="e.g. Advanced Cloud Architecture"
                value={trainingForm.title}
                onChange={(event) =>
                  setTrainingForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
              />
            </FormField>

            <FormRow cols={2}>
              <FormField label="Provider">
                <Input
                  placeholder="e.g. AWS, Google, Coursera"
                  value={trainingForm.provider}
                  onChange={(event) =>
                    setTrainingForm((current) => ({
                      ...current,
                      provider: event.target.value,
                    }))
                  }
                />
              </FormField>

              <FormField label="Training Type">
                <Select
                  value={trainingForm.trainingType}
                  onValueChange={(value) =>
                    setTrainingForm((current) => ({
                      ...current,
                      trainingType: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="external">External</SelectItem>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                    <SelectItem value="certification">Certification</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </FormRow>

            <FormRow cols={2}>
              <FormField label="Start Date">
                <Input
                  type="date"
                  value={trainingForm.startDate}
                  onChange={(event) =>
                    setTrainingForm((current) => ({
                      ...current,
                      startDate: event.target.value,
                    }))
                  }
                />
              </FormField>

              <FormField label="End Date">
                <Input
                  type="date"
                  value={trainingForm.endDate}
                  onChange={(event) =>
                    setTrainingForm((current) => ({
                      ...current,
                      endDate: event.target.value,
                    }))
                  }
                />
              </FormField>
            </FormRow>

            <FormField label="Estimated Cost (USD)">
              <Input
                type="number"
                min="0"
                placeholder="e.g. 2500"
                value={trainingForm.cost}
                onChange={(event) =>
                  setTrainingForm((current) => ({
                    ...current,
                    cost: event.target.value,
                  }))
                }
              />
            </FormField>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setTrainingModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                disabled={!trainingForm.title.trim() || submitTraining.isPending}
                onClick={() => void handleSubmitTraining()}
              >
                {submitTraining.isPending ? "Submitting…" : "Submit Request"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(confirmApproveTraining)}
        onClose={() => setConfirmApproveTraining(null)}
        onConfirm={() => void handleApproveTraining(String(confirmApproveTraining))}
        title="Approve Training Request"
        description="This will move the request to scheduled status and notify the employee."
        confirmLabel="Approve"
        loading={approveTraining.isPending}
      />

      <ConfirmDialog
        open={Boolean(confirmRejectTraining)}
        onClose={() => setConfirmRejectTraining(null)}
        onConfirm={() => void handleRejectTraining(String(confirmRejectTraining))}
        title="Reject Training Request"
        description="The employee will be notified that this request was declined."
        confirmLabel="Reject"
        variant="destructive"
        loading={rejectTraining.isPending}
      />
    </div>
  );
}
