import { useEffect, useState } from "react";
import { InfoAlert, PageHeader } from "@/components/ui/blih";
import { getProbationErrorMessage, useProbationDashboard, useUpdateProbationWeights } from "./hooks";
import type { ProbationWeights } from "./types";
import { ProbationWeightForm } from "./components/ProbationWeightForm";

interface ProbationSettingsProps {
  showAlert: (message: string, type?: "success" | "info" | "error") => void;
}

const defaultWeights: ProbationWeights = {
  punctualityWeight: 30,
  attendanceWeight: 30,
  performanceWeight: 40,
};

export function ProbationSettings({ showAlert }: ProbationSettingsProps) {
  const settings = useProbationDashboard({});
  const [draft, setDraft] = useState<ProbationWeights>(defaultWeights);
  const save = useUpdateProbationWeights({
    onSuccess: () => showAlert("Probation assessment weights saved.", "success"),
    onError: (message) => showAlert(message, "error"),
  });

  useEffect(() => {
    if (settings.data?.weights) setDraft(settings.data.weights);
  }, [settings.data?.weights]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <PageHeader
        eyebrow="Business settings"
        title="Probation settings"
        description="Control the scoring model used for employee probation assessments."
      />

      {settings.isError ? (
        <InfoAlert
          variant="error"
          message={getProbationErrorMessage(settings.error, "Unable to load probation settings.")}
        />
      ) : null}

      <ProbationWeightForm
        value={draft}
        onChange={setDraft}
        onSubmit={() => save.mutate(draft)}
        loading={settings.isLoading}
        saving={save.isPending}
      />
    </div>
  );
}
