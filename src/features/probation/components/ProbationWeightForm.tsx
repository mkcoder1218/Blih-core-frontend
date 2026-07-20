import { Save, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField, FormRow, SectionCard } from "@/components/ui/blih";
import type { ProbationWeights } from "../types";

interface ProbationWeightFormProps {
  value: ProbationWeights;
  onChange: (value: ProbationWeights) => void;
  onSubmit: () => void;
  loading?: boolean;
  saving?: boolean;
}

export function ProbationWeightForm({
  value,
  onChange,
  onSubmit,
  loading = false,
  saving = false,
}: ProbationWeightFormProps) {
  const total = value.punctualityWeight + value.attendanceWeight + value.performanceWeight;
  const valid = total === 100;

  const update = (key: keyof ProbationWeights, nextValue: number) => {
    onChange({ ...value, [key]: nextValue });
  };

  return (
    <SectionCard
      title="Probation assessment weights"
      description="Configure how final probation scores are calculated. Total weight must equal 100%."
      icon={<Scale className="h-5 w-5" />}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
        className="space-y-4"
      >
        <FormRow cols={3}>
          <WeightField label="Punctuality" value={value.punctualityWeight} onChange={(next) => update("punctualityWeight", next)} />
          <WeightField label="Attendance" value={value.attendanceWeight} onChange={(next) => update("attendanceWeight", next)} />
          <WeightField label="Performance review" value={value.performanceWeight} onChange={(next) => update("performanceWeight", next)} />
        </FormRow>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className={valid ? "text-xs font-black text-emerald-600" : "text-xs font-black text-rose-600"}>
            Total: {total}%
          </p>
          <Button type="submit" size="lg" disabled={!valid || saving || loading}>
            <Save />
            {saving ? "Saving…" : "Save weights"}
          </Button>
        </div>
      </form>
    </SectionCard>
  );
}

function WeightField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <FormField label={label}>
      <Input
        type="number"
        min={0}
        max={100}
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value || 0))}
        className="h-11 text-sm font-bold"
      />
    </FormField>
  );
}

