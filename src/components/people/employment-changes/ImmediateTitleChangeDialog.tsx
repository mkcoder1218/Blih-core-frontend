import { useState } from "react";
import { Loader2 } from "lucide-react";

import { useEmploymentChangeContext, useImmediateTitleChange } from "../../../hooks/useEmploymentChanges";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Textarea } from "@/components/ui/textarea";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeUserId: string;
  showAlert: (message: string, type?: "success" | "info" | "error") => void;
}

type TitleMode = "POSITION" | "CUSTOM";

export function ImmediateTitleChangeDialog({
  open,
  onOpenChange,
  employeeUserId,
  showAlert,
}: Props) {
  const [mode, setMode] = useState<TitleMode>("POSITION");
  const [positionId, setPositionId] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [reason, setReason] = useState("");

  const context = useEmploymentChangeContext(employeeUserId);
  const mutation = useImmediateTitleChange();
  const positions = context.data?.positions || [];
  const departments = context.data?.departments || [];
  const selectedPosition = positions.find((position) => position.id === positionId);

  const reset = () => {
    setMode("POSITION");
    setPositionId("");
    setCustomTitle("");
    setDepartmentId("");
    setReason("");
  };

  const submit = async () => {
    if (mode === "POSITION" && !positionId) {
      showAlert("Select the new position.", "error");
      return;
    }
    if (mode === "CUSTOM" && !customTitle.trim()) {
      showAlert("Enter the new title.", "error");
      return;
    }
    if (!reason.trim()) {
      showAlert("A reason is required for an immediate title change.", "error");
      return;
    }

    try {
      await mutation.mutateAsync({
        employeeUserId,
        titleChangeType: "PROMOTION",
        targetPositionId: mode === "POSITION" ? positionId : undefined,
        targetTitle: mode === "CUSTOM" ? customTitle.trim() : undefined,
        targetDepartmentId:
          mode === "POSITION"
            ? selectedPosition?.departmentId || context.data?.current.departmentId || undefined
            : departmentId || context.data?.current.departmentId || undefined,
        reason: reason.trim(),
      });
      onOpenChange(false);
      reset();
      showAlert("Employee title updated immediately and added to employment history.", "success");
    } catch (error: any) {
      showAlert(
        error?.response?.data?.message ||
          error?.message ||
          "Could not update the employee title.",
        "error",
      );
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) reset();
      }}
    >
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle>Immediate Title Change</DialogTitle>
          <DialogDescription>
            This bypasses the normal approval flow and updates the employee immediately. The action is still saved in employment history and audit logs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
            <p className="text-xs font-bold text-amber-800">
              Current title: {context.data?.current.title || "Not configured"}
            </p>
          </div>

          <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setMode("POSITION")}
              className={`rounded-lg px-3 py-2 text-xs font-bold ${mode === "POSITION" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}
            >
              Existing Position
            </button>
            <button
              type="button"
              onClick={() => setMode("CUSTOM")}
              className={`rounded-lg px-3 py-2 text-xs font-bold ${mode === "CUSTOM" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}
            >
              Free-text Title
            </button>
          </div>

          {mode === "POSITION" ? (
            <Select value={positionId} onValueChange={setPositionId}>
              <SelectTrigger>
                <SelectValue placeholder="Select new position" />
              </SelectTrigger>
              <SelectContent>
                {positions.map((position) => (
                  <SelectItem key={position.id} value={position.id}>
                    {position.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                value={customTitle}
                onChange={(event) => setCustomTitle(event.currentTarget.value)}
                placeholder="New title"
              />
              <Select
                value={departmentId || context.data?.current.departmentId || ""}
                onValueChange={setDepartmentId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((department) => (
                    <SelectItem key={department.id} value={department.id}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">
              Reason
            </label>
            <Textarea
              rows={4}
              value={reason}
              onChange={(event) => setReason(event.currentTarget.value)}
              placeholder="Why is this title being changed immediately?"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button onClick={() => void submit()} disabled={mutation.isPending || context.isLoading} className="bg-blue-600 hover:bg-blue-700">
              {mutation.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Apply Immediately
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
