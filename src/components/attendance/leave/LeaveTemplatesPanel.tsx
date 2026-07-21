import { useState } from "react";
import { Edit2, LayoutTemplate, Paperclip, Plus, RefreshCw, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { useDeleteLeaveTemplate, useLeaveTemplates, useToggleLeaveTemplate, type LeaveTemplate } from "../../../hooks/useLeave";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TemplateModal } from "./LeaveTemplateDialog";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AnimatePresence } from "motion/react";

function LeaveTypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    annual: "bg-blue-600", sick: "bg-amber-500", maternity: "bg-pink-500",
    paternity: "bg-cyan-500", casual: "bg-purple-500", unpaid: "bg-slate-500", custom: "bg-emerald-600",
  };
  return <span className={cn("rounded px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-white", colors[type] ?? "bg-slate-500")}>{type}</span>;
}

export function TemplatesPanel({ showAlert }: { showAlert: (m: string, t?: "success" | "error") => void }) {
  const { data: templates = [], isLoading, refetch } = useLeaveTemplates(false);
  const toggleMut  = useToggleLeaveTemplate();
  const deleteMut  = useDeleteLeaveTemplate();
  const [showCreate, setShowCreate]       = useState(false);
  const [editTarget, setEditTarget]       = useState<LeaveTemplate | undefined>();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleToggle = async (id: string) => {
    try {
      await toggleMut.mutateAsync(id);
    } catch (err: any) {
      showAlert(err?.response?.data?.message || err?.message || "Failed", "error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMut.mutateAsync(id);
      showAlert("Template deleted", "success");
      setConfirmDelete(null);
    } catch (err: any) {
      showAlert(err?.response?.data?.message || err?.message || "Failed", "error");
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_5px_22px_rgba(0,0,0,0.015)]">
        <div>
          <span className="bg-violet-50 border border-violet-100 text-violet-700 text-[9.5px] font-bold tracking-widest px-2.5 py-1 rounded-full uppercase">
            Template Management
          </span>
          <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none mt-1">Leave Templates</h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Create and activate leave types for your organization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
            className="p-2 h-9 w-9 rounded-xl bg-slate-100 border-0 hover:bg-slate-200 text-slate-600"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </Button>
          <Button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 h-9 rounded-xl"
          >
            <Plus className="w-3.5 h-3.5" />
            New Template
          </Button>
        </div>
      </div>

      {/* Templates grid */}
      {isLoading ? (
        <div className="py-16 text-center">
          <RefreshCw className="w-8 h-8 text-slate-300 mx-auto animate-spin" />
          <p className="text-sm text-slate-500 mt-3 font-semibold">Loading templates…</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-100">
          <LayoutTemplate className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-500 mt-3">No leave templates yet</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-3 text-xs text-blue-600 font-bold hover:underline"
          >
            Create your first template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tpl) => (
            <div key={tpl.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col gap-3">
              {/* Header row */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <LeaveTypeBadge type={tpl.leaveType} />
                  <h4 className="text-[12px] font-extrabold text-slate-900 mt-2 leading-tight">{tpl.name}</h4>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {tpl.isDeprecated && (
                      <span className="rounded-full bg-amber-50 border border-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-700">
                        Deprecated
                      </span>
                    )}
                    {tpl.isVisibleForRequest === false && (
                      <span className="rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[9px] font-bold text-slate-600">
                        Hidden
                      </span>
                    )}
                  </div>
                  {tpl.requiresEvidence && (
                    <div className="inline-flex items-center gap-1 mt-2 rounded-full bg-blue-50 border border-blue-100 px-2 py-0.5 text-[9px] font-bold text-blue-700">
                      <Paperclip className="w-3 h-3" />
                      Evidence required
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => setEditTarget(tpl)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(tpl.id)}
                    className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="bg-slate-50 rounded-xl px-3 py-2.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">Total Days</span>
                  <span className="text-lg font-black text-blue-600">{tpl.hasAmount === false ? "No amount" : tpl.totalDays}</span>
                </div>
                {tpl.description && (
                  <p className="text-[10px] text-slate-500 font-medium max-w-[120px] text-right line-clamp-2 leading-relaxed">
                    {tpl.description}
                  </p>
                )}
              </div>

              <Separator />

              {/* Active toggle */}
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => handleToggle(tpl.id)}
              >
                <span className="text-xs font-bold text-slate-600">
                  {tpl.isActive ? "Active" : "Inactive"}
                </span>
                {tpl.isActive ? (
                  <div className="flex items-center gap-1">
                    <ToggleRight className="w-6 h-6 text-emerald-500" />
                    <span className="text-[10px] text-emerald-600 font-bold">Employees can request</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <ToggleLeft className="w-6 h-6 text-slate-300" />
                    <span className="text-[10px] text-slate-400 font-bold">Not available</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <Dialog open onOpenChange={(open) => !open && setConfirmDelete(null)}>
          <DialogContent className="max-w-sm rounded-2xl p-5 space-y-4">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-red-50 rounded-xl text-red-600">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <DialogTitle className="text-sm font-black text-slate-900">Delete Template</DialogTitle>
                  <DialogDescription className="text-[11px] text-slate-400">This cannot be undone</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <p className="text-xs text-slate-600 font-medium">
              Referenced templates are hidden and deprecated instead of being removed.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setConfirmDelete(null)} className="flex-1 border-slate-200 text-slate-600 font-bold text-xs h-9 rounded-xl">
                Cancel
              </Button>
              <Button
                onClick={() => handleDelete(confirmDelete)}
                disabled={deleteMut.isPending}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-bold text-xs h-9 rounded-xl"
              >
                {deleteMut.isPending ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <AnimatePresence>
        {(showCreate || editTarget) && (
          <TemplateModal
            editTarget={editTarget}
            onClose={() => { setShowCreate(false); setEditTarget(undefined); }}
            showAlert={showAlert}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main LeavePage Component ──────────────────────────────────────────────────

interface LeavePageProps {
  showAlert: (title: string, type?: "success" | "info" | "error") => void;
}
