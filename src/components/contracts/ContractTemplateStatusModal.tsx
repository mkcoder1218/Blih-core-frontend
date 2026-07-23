import {
  AlertTriangle,
  Loader2,
  Trash2,
  XCircle,
} from "lucide-react";

interface ContractTemplateStatusModalProps {
  open: boolean;
  mode: "deactivate" | "delete";
  templateName: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ContractTemplateStatusModal({
  open,
  mode,
  templateName,
  loading = false,
  onClose,
  onConfirm,
}: ContractTemplateStatusModalProps) {
  if (!open) {
    return null;
  }

  const isDelete =
    mode === "delete";

  const title = isDelete
    ? "Delete contract template"
    : "Deactivate contract template";

  const description = isDelete
    ? `Are you sure you want to delete "${templateName}"? This action cannot be undone.`
    : `Deactivate "${templateName}"? Existing contracts will not be changed.`;

  const confirmLabel = isDelete
    ? "Delete Template"
    : "Deactivate Template";

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Close modal overlay"
        className="absolute inset-0"
        onClick={() => {
          if (!loading) {
            onClose();
          }
        }}
      />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-100 px-6 py-5">
          <div className="flex items-start gap-3">
            <div
              className={[
                "flex h-11 w-11 items-center justify-center rounded-2xl",
                isDelete
                  ? "bg-rose-50 text-rose-600"
                  : "bg-amber-50 text-amber-600",
              ].join(" ")}
            >
              {isDelete ? (
                <Trash2 className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-black text-slate-900">
                {title}
              </h2>

              <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
                {description}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <XCircle className="h-4 w-4" />
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={[
              "inline-flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-black text-white transition disabled:cursor-not-allowed disabled:opacity-50",
              isDelete
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-amber-600 hover:bg-amber-700",
            ].join(" ")}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isDelete ? (
              <Trash2 className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}

            {loading
              ? "Processing..."
              : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
