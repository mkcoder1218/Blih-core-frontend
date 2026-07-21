import { useState } from "react";
import { XCircle } from "lucide-react";
import { useRejectLeave } from "../../../hooks/useLeave";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function RejectModal({
  requestId,
  onClose,
  showAlert,
}: {
  requestId: string;
  onClose: () => void;
  showAlert: (m: string, t?: "success" | "error") => void;
}) {
  const reject = useRejectLeave();
  const [reason, setReason] = useState("");

  const handleReject = async () => {
    if (!reason.trim()) { showAlert("Please provide a rejection reason", "error"); return; }
    try {
      await reject.mutateAsync({ id: requestId, reason });
      showAlert("Request rejected", "success");
      onClose();
    } catch (err: any) {
      showAlert(err?.response?.data?.message || err?.message || "Failed", "error");
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl p-5 space-y-4">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-50 rounded-xl text-red-600">
              <XCircle className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-black text-slate-900">Reject Request</DialogTitle>
              <DialogDescription className="text-[11px] text-slate-400">Provide a reason for rejection</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <Textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="State the rejection reason..."
          className="bg-slate-50 border-slate-200 rounded-xl text-xs font-semibold resize-none"
        />
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1 border-slate-200 text-slate-600 font-bold text-xs h-9 rounded-xl">
            Cancel
          </Button>
          <Button
            onClick={handleReject}
            disabled={reject.isPending}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-bold text-xs h-9 rounded-xl"
          >
            {reject.isPending ? "Rejecting…" : "Confirm Reject"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Template Management Modal (HR/Admin only) ─────────────────────────────────
