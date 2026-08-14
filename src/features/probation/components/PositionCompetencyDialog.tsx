import React from "react";
import {
  AlertCircle,
  Loader2,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
    type?: "success" | "error" | "info",
  ) => void;
}) {
  const query = usePositionCompetencies(
    positionId || undefined,
    isOpen,
  );

  const replaceMutation = useReplacePositionCompetencies();

  const [rows, setRows] = React.useState<EditablePositionCompetency[]>([
    createEmptyCompetency(0),
  ]);

  React.useEffect(() => {
    if (!isOpen) return;

    if (query.data) {
      setRows(
        query.data.length
          ? normalizeCompetencyRows(query.data)
          : [createEmptyCompetency(0)],
      );
    }
  }, [isOpen, query.data]);

  const validationError = validateCompetencies(rows);
  const canSave =
    Boolean(positionId) &&
    !query.isLoading &&
    !query.isError &&
    !replaceMutation.isPending &&
    !validationError;

  const handleSave = async () => {
    if (!positionId) return;

    const currentValidationError = validateCompetencies(rows);

    if (currentValidationError) {
      showAlert(currentValidationError, "error");
      return;
    }

    try {
      await replaceMutation.mutateAsync({
        positionId,
        competencies: toCompetencyPayload(rows),
      });

      showAlert("Probation competencies updated", "success");
      onClose();
    } catch (error: any) {
      showAlert(
        error?.response?.data?.message ||
          "Failed to update probation competencies",
        "error",
      );
    }
  };

  return (
    <Dialog
      open={isOpen && Boolean(positionId)}
      onOpenChange={(open) => {
        if (!open && !replaceMutation.isPending) {
          onClose();
        }
      }}
    >
      <DialogContent
        className="flex max-h-[92vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl"
        showCloseButton={!replaceMutation.isPending}
      >
        <DialogHeader className="border-b border-border px-5 py-4 sm:px-6">
          <DialogTitle className="text-base font-bold">
            Probation criteria
          </DialogTitle>
          <DialogDescription className="text-xs leading-5">
            Set the evaluation criteria for{" "}
            <span className="font-semibold text-foreground">
              {positionTitle || "this position"}
            </span>
            . Each new employee probation for this position will use these
            competencies.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {query.isLoading ? (
            <div className="flex min-h-56 items-center justify-center gap-2 text-xs font-semibold text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading competencies...
            </div>
          ) : query.isError ? (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-xs font-medium text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-bold">Could not load probation criteria.</p>
                <p className="mt-1 text-destructive/80">
                  Close this window and try again.
                </p>
              </div>
            </div>
          ) : (
            <PositionCompetencyEditor
              rows={rows}
              onChange={setRows}
              disabled={replaceMutation.isPending}
            />
          )}
        </div>

        <DialogFooter className="mx-0 mb-0 rounded-none border-t border-border bg-muted/30 px-5 py-3 sm:px-6">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 text-[11px] text-muted-foreground">
              {!query.isLoading && !query.isError ? (
                validationError ? (
                  <span className="inline-flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                    {validationError}
                  </span>
                ) : (
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    Criteria are complete and ready to save.
                  </span>
                )
              ) : null}
            </div>

            <div className="flex shrink-0 justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={replaceMutation.isPending}
              >
                Cancel
              </Button>

              <Button
                type="button"
                onClick={() => void handleSave()}
                disabled={!canSave}
              >
                {replaceMutation.isPending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Save />
                )}
                Save criteria
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
