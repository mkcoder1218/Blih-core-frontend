import React from "react";
import {
  Loader2,
  Save,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import {
  usePositionCompetencies,
  useReplacePositionCompetencies,
} from "../../../hooks/useProbationCompetencies";
import {
  PositionCompetencyEditor,
  createEmptyCompetency,
  normalizeCompetencyRows,
  toCompetencyPayload,
  validateCompetencies,
  type EditablePositionCompetency,
} from "./PositionCompetencyEditor";

export function PositionCompetencyDialog({
  isOpen,
  positionId,
  positionTitle,
  onClose,
  showAlert,
}: {
  isOpen: boolean;
  positionId: string | null;
  positionTitle: string;
  onClose: () => void;
  showAlert: (
    title: string,
    type?:
      | "success"
      | "error"
      | "info",
  ) => void;
}) {
  const query =
    usePositionCompetencies(
      positionId || undefined,
      isOpen,
    );

  const replaceMutation =
    useReplacePositionCompetencies();

  const [rows, setRows] =
    React.useState<
      EditablePositionCompetency[]
    >([
      createEmptyCompetency(0),
    ]);

  React.useEffect(() => {
    if (!isOpen) return;

    if (query.data) {
      setRows(
        query.data.length
          ? normalizeCompetencyRows(
              query.data,
            )
          : [
              createEmptyCompetency(
                0,
              ),
            ],
      );
    }
  }, [isOpen, query.data]);

  if (!isOpen || !positionId) {
    return null;
  }

  const handleSave = async () => {
    const validationError =
      validateCompetencies(rows);

    if (validationError) {
      showAlert(
        validationError,
        "error",
      );
      return;
    }

    try {
      await replaceMutation.mutateAsync({
        positionId,
        competencies:
          toCompetencyPayload(rows),
      });

      showAlert(
        "Probation competencies updated",
        "success",
      );

      onClose();
    } catch (error: any) {
      showAlert(
        error?.response?.data
          ?.message ||
          "Failed to update probation competencies",
        "error",
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close"
      />

      <motion.div
        initial={{
          opacity: 0,
          scale: 0.97,
          y: 8,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
        }}
        className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h3 className="text-base font-black text-slate-950">
              Probation criteria
            </h3>

            <p className="mt-1 text-xs font-semibold text-slate-500">
              {positionTitle}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {query.isLoading ? (
            <div className="flex min-h-52 items-center justify-center gap-2 text-xs font-bold text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading competencies...
            </div>
          ) : query.isError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700">
              Failed to load probation
              competencies.
            </div>
          ) : (
            <PositionCompetencyEditor
              rows={rows}
              onChange={setRows}
              disabled={
                replaceMutation.isPending
              }
            />
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-600"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={
              query.isLoading ||
              query.isError ||
              replaceMutation.isPending
            }
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {replaceMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}

            Save criteria
          </button>
        </div>
      </motion.div>
    </div>
  );
}
