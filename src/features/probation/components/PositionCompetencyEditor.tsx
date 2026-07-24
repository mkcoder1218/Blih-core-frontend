import React from "react";
import {
  AlertCircle,
  GripVertical,
  Plus,
  Trash2,
} from "lucide-react";
import type { PositionCompetencyInput } from "../../../api/probation";

export type EditablePositionCompetency =
  PositionCompetencyInput & {
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
    localId:
      row.id || crypto.randomUUID(),
    name: row.name || "",
    description:
      row.description || "",
    weight: Number(row.weight || 0),
    isRequired:
      row.isRequired !== false,
    sortOrder:
      row.sortOrder ?? index,
    isActive:
      row.isActive !== false,
  }));
}

export function toCompetencyPayload(
  rows: EditablePositionCompetency[],
): PositionCompetencyInput[] {
  return rows.map((row, index) => ({
    name: row.name.trim(),
    description:
      row.description?.trim() || null,
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

  if (
    rows.some(
      (row) => !row.name.trim(),
    )
  ) {
    return "Every competency needs a name.";
  }

  if (
    rows.some(
      (row) =>
        Number(row.weight) <= 0,
    )
  ) {
    return "Every competency weight must be greater than zero.";
  }

  const normalizedNames = rows.map(
    (row) =>
      row.name.trim().toLowerCase(),
  );

  if (
    new Set(normalizedNames).size !==
    normalizedNames.length
  ) {
    return "Competency names must be unique.";
  }

  const total = rows.reduce(
    (sum, row) =>
      sum + Number(row.weight || 0),
    0,
  );

  if (
    Math.abs(total - 100) > 0.01
  ) {
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
  onChange: (
    rows: EditablePositionCompetency[],
  ) => void;
  disabled?: boolean;
}) {
  const totalWeight = rows.reduce(
    (sum, row) =>
      sum + Number(row.weight || 0),
    0,
  );

  const validTotal =
    Math.abs(totalWeight - 100) <=
    0.01;

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

  const removeRow = (
    localId: string,
  ) => {
    onChange(
      rows
        .filter(
          (row) =>
            row.localId !== localId,
        )
        .map((row, index) => ({
          ...row,
          sortOrder: index,
        })),
    );
  };

  const addRow = () => {
    onChange([
      ...rows,
      createEmptyCompetency(
        rows.length,
      ),
    ]);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black text-slate-900">
            Probation evaluation
            competencies
          </p>

          <p className="mt-1 text-[11px] font-medium text-slate-500">
            These criteria are copied
            into each employee probation
            when it starts.
          </p>
        </div>

        <div
          className={`rounded-xl border px-3 py-2 text-xs font-black ${
            validTotal
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-amber-200 bg-amber-50 text-amber-700"
          }`}
        >
          Total{" "}
          {totalWeight.toFixed(2)}%
        </div>
      </div>

      <div className="space-y-3">
        {rows.map(
          (row, index) => (
            <div
              key={row.localId}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <GripVertical className="mt-2 h-4 w-4 shrink-0 text-slate-300" />

                <div className="min-w-0 flex-1 space-y-3">
                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_120px]">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Competency{" "}
                        {index + 1}
                      </label>

                      <input
                        value={
                          row.name
                        }
                        onChange={(
                          event,
                        ) =>
                          updateRow(
                            row.localId,
                            {
                              name: event
                                .target
                                .value,
                            },
                          )
                        }
                        disabled={
                          disabled
                        }
                        placeholder="e.g. Code quality"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white disabled:opacity-60"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Weight
                      </label>

                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={
                            row.weight
                          }
                          onChange={(
                            event,
                          ) =>
                            updateRow(
                              row.localId,
                              {
                                weight:
                                  Number(
                                    event
                                      .target
                                      .value,
                                  ),
                              },
                            )
                          }
                          disabled={
                            disabled
                          }
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-8 text-xs font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white disabled:opacity-60"
                        />

                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                          %
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Description
                    </label>

                    <textarea
                      value={
                        row.description ||
                        ""
                      }
                      onChange={(
                        event,
                      ) =>
                        updateRow(
                          row.localId,
                          {
                            description:
                              event.target
                                .value,
                          },
                        )
                      }
                      disabled={
                        disabled
                      }
                      rows={2}
                      placeholder="Describe what good performance looks like for this competency."
                      className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white disabled:opacity-60"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <label className="inline-flex items-center gap-2 text-[11px] font-bold text-slate-600">
                      <input
                        type="checkbox"
                        checked={
                          row.isRequired
                        }
                        onChange={(
                          event,
                        ) =>
                          updateRow(
                            row.localId,
                            {
                              isRequired:
                                event
                                  .target
                                  .checked,
                            },
                          )
                        }
                        disabled={
                          disabled
                        }
                        className="h-4 w-4 rounded border-slate-300"
                      />

                      Required for
                      probation review
                    </label>

                    <label className="inline-flex items-center gap-2 text-[11px] font-bold text-slate-600">
                      <input
                        type="checkbox"
                        checked={
                          row.isActive
                        }
                        onChange={(
                          event,
                        ) =>
                          updateRow(
                            row.localId,
                            {
                              isActive:
                                event
                                  .target
                                  .checked,
                            },
                          )
                        }
                        disabled={
                          disabled
                        }
                        className="h-4 w-4 rounded border-slate-300"
                      />

                      Active
                    </label>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    removeRow(
                      row.localId,
                    )
                  }
                  disabled={
                    disabled ||
                    rows.length === 1
                  }
                  className="rounded-xl border border-rose-200 p-2 text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Remove competency"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ),
        )}
      </div>

      {!validTotal ? (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] font-bold text-amber-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

          The total weight must equal
          exactly 100% before saving.
        </div>
      ) : null}

      <button
        type="button"
        onClick={addRow}
        disabled={disabled}
        className="inline-flex items-center gap-2 rounded-xl border border-dashed border-blue-300 bg-blue-50 px-4 py-2.5 text-xs font-black text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
      >
        <Plus className="h-4 w-4" />
        Add competency
      </button>
    </div>
  );
}
