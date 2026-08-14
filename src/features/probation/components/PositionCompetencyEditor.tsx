import {
  AlertCircle,
  CheckCircle2,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { PositionCompetencyInput } from "../../../api/probation";

export type EditablePositionCompetency = PositionCompetencyInput & {
  localId: string;
};

export function createEmptyCompetency(
  sortOrder: number,
): EditablePositionCompetency {
  return {
    localId: crypto.randomUUID(),
    name: "",
    description: "",
    weight: 0,
    isRequired: true,
    sortOrder,
    isActive: true,
  };
}

export function normalizeCompetencyRows(
  rows: Array<{
    id?: string;
    name: string;
    description?: string | null;
    weight: number | string;
    isRequired?: boolean;
    sortOrder?: number;
    isActive?: boolean;
  }>,
): EditablePositionCompetency[] {
  return rows.map((row, index) => ({
    localId: row.id || crypto.randomUUID(),
    name: row.name || "",
    description: row.description || "",
    weight: Number(row.weight || 0),
    isRequired: row.isRequired !== false,
    sortOrder: row.sortOrder ?? index,
    isActive: row.isActive !== false,
  }));
}

export function toCompetencyPayload(
  rows: EditablePositionCompetency[],
): PositionCompetencyInput[] {
  return rows.map((row, index) => ({
    name: row.name.trim(),
    description: row.description?.trim() || null,
    weight: Number(row.weight),
    isRequired: row.isRequired,
    sortOrder: index,
    isActive: row.isActive,
  }));
}

export function validateCompetencies(
  rows: EditablePositionCompetency[],
): string | null {
  if (!rows.length) {
    return "Add at least one probation competency.";
  }

  if (rows.some((row) => !row.name.trim())) {
    return "Every competency needs a name.";
  }

  if (rows.some((row) => Number(row.weight) <= 0)) {
    return "Every competency weight must be greater than zero.";
  }

  const normalizedNames = rows.map((row) => row.name.trim().toLowerCase());

  if (new Set(normalizedNames).size !== normalizedNames.length) {
    return "Competency names must be unique.";
  }

  const total = rows.reduce(
    (sum, row) => sum + Number(row.weight || 0),
    0,
  );

  if (Math.abs(total - 100) > 0.01) {
    return `Competency weights must total 100%. Current total is ${total.toFixed(
      2,
    )}%.`;
  }

  return null;
}

export function PositionCompetencyEditor({
  rows,
  onChange,
  disabled = false,
}: {
  rows: EditablePositionCompetency[];
  onChange: (rows: EditablePositionCompetency[]) => void;
  disabled?: boolean;
}) {
  const totalWeight = rows.reduce(
    (sum, row) => sum + Number(row.weight || 0),
    0,
  );

  const validTotal = Math.abs(totalWeight - 100) <= 0.01;
  const progress = Math.min(100, Math.max(0, totalWeight));
  const remaining = Math.abs(100 - totalWeight);

  const totalMessage = validTotal
    ? "Weight distribution is complete."
    : totalWeight < 100
      ? `${remaining.toFixed(2)}% remaining to assign.`
      : `Reduce the total by ${remaining.toFixed(2)}%.`;

  const updateRow = (
    localId: string,
    patch: Partial<EditablePositionCompetency>,
  ) => {
    onChange(
      rows.map((row) =>
        row.localId === localId
          ? {
              ...row,
              ...patch,
            }
          : row,
      ),
    );
  };

  const removeRow = (localId: string) => {
    onChange(
      rows
        .filter((row) => row.localId !== localId)
        .map((row, index) => ({
          ...row,
          sortOrder: index,
        })),
    );
  };

  const addRow = () => {
    onChange([...rows, createEmptyCompetency(rows.length)]);
  };

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-border bg-muted/20 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-foreground">
                Evaluation competencies
              </p>
              <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                {rows.length} {rows.length === 1 ? "item" : "items"}
              </span>
            </div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Define what will be evaluated during probation and assign each
              competency a percentage. The total must equal 100%.
            </p>
          </div>

          <div
            className={`shrink-0 rounded-lg border px-3 py-2 text-right ${
              validTotal
                ? "border-emerald-500/30 bg-emerald-500/10"
                : "border-amber-500/30 bg-amber-500/10"
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              Total weight
            </p>
            <p
              className={`mt-0.5 text-sm font-black ${
                validTotal
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-amber-600 dark:text-amber-400"
              }`}
            >
              {totalWeight.toFixed(2)} / 100%
            </p>
          </div>
        </div>

        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${
              validTotal
                ? "bg-emerald-500"
                : totalWeight > 100
                  ? "bg-destructive"
                  : "bg-primary"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          {validTotal ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
          )}
          {totalMessage}
        </div>
      </section>

      <div className="space-y-3">
        {rows.map((row, index) => (
          <section
            key={row.localId}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-black text-primary">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground">
                    Competency {index + 1}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    Name the skill or behavior and define its importance.
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="destructive"
                size="icon-sm"
                onClick={() => removeRow(row.localId)}
                disabled={disabled || rows.length === 1}
                aria-label={`Remove competency ${index + 1}`}
                title={
                  rows.length === 1
                    ? "At least one competency is required"
                    : "Remove competency"
                }
              >
                <Trash2 />
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_140px]">
              <label className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  Competency name
                </span>
                <Input
                  value={row.name}
                  onChange={(event) =>
                    updateRow(row.localId, {
                      name: event.currentTarget.value,
                    })
                  }
                  disabled={disabled}
                  placeholder="e.g. Code quality"
                  className="h-9"
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  Weight (%)
                </span>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={row.weight}
                    onChange={(event) =>
                      updateRow(row.localId, {
                        weight: Number(event.currentTarget.value),
                      })
                    }
                    disabled={disabled}
                    className="h-9 pr-8 font-bold tabular-nums"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                    %
                  </span>
                </div>
              </label>
            </div>

            <label className="mt-4 block space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                What good performance looks like
              </span>
              <Textarea
                value={row.description || ""}
                onChange={(event) =>
                  updateRow(row.localId, {
                    description: event.currentTarget.value,
                  })
                }
                disabled={disabled}
                rows={2}
                placeholder="Describe the expected behavior, output, or standard for this competency."
                className="min-h-[72px] resize-none"
              />
            </label>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-muted/15 px-3 py-2.5 transition hover:bg-muted/30">
                <input
                  type="checkbox"
                  checked={row.isRequired}
                  onChange={(event) =>
                    updateRow(row.localId, {
                      isRequired: event.currentTarget.checked,
                    })
                  }
                  disabled={disabled}
                  className="mt-0.5 h-4 w-4 accent-primary"
                />
                <span className="min-w-0">
                  <span className="block text-[11px] font-bold text-foreground">
                    Required for review
                  </span>
                  <span className="mt-0.5 block text-[10px] leading-4 text-muted-foreground">
                    Reviewers must score this competency.
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-muted/15 px-3 py-2.5 transition hover:bg-muted/30">
                <input
                  type="checkbox"
                  checked={row.isActive}
                  onChange={(event) =>
                    updateRow(row.localId, {
                      isActive: event.currentTarget.checked,
                    })
                  }
                  disabled={disabled}
                  className="mt-0.5 h-4 w-4 accent-primary"
                />
                <span className="min-w-0">
                  <span className="block text-[11px] font-bold text-foreground">
                    Active
                  </span>
                  <span className="mt-0.5 block text-[10px] leading-4 text-muted-foreground">
                    Include this competency in new probation reviews.
                  </span>
                </span>
              </label>
            </div>
          </section>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addRow}
        disabled={disabled}
        className="border-dashed"
      >
        <Plus />
        Add competency
      </Button>
    </div>
  );
}
