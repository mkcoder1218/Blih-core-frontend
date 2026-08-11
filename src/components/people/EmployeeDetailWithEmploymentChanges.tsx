import { BriefcaseBusiness, MoreHorizontal } from "lucide-react";

import { useMyPermissions } from "../../hooks/usePermissions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import EmployeeDetailPage from "./EmployeeDetailPage";
import { EmploymentChangesPanel } from "./employment-changes/EmploymentChangesPanel";
import { ImmediateTitleChangeDialog } from "./employment-changes/ImmediateTitleChangeDialog";
import { useState } from "react";

interface Props {
  user?: {
    name: string;
    email: string;
    role: string;
  };
  onBack: () => void;
  onEdit?: () => void;
  readOnly?: boolean;
  targetUserId?: string;
  showAlert?: (message: string, type?: "success" | "info" | "error") => void;
}

export default function EmployeeDetailWithEmploymentChanges({
  user,
  onBack,
  onEdit,
  readOnly = false,
  targetUserId,
  showAlert,
}: Props) {
  const [immediateTitleOpen, setImmediateTitleOpen] = useState(false);
  const permissions = useMyPermissions();

  const notify =
    showAlert ||
    ((message: string, type?: "success" | "info" | "error") => {
      if (type === "error") {
        window.alert(message);
      }
    });

  const canShowImmediateTitle =
    Boolean(targetUserId) &&
    !readOnly &&
    permissions.hasAny(
      "hr.write",
      "position.update",
      "position.create",
      "user.update",
    );

  return (
    <div className="relative space-y-5">
      {canShowImmediateTitle && (
        <div className="absolute right-0 top-0 z-20">
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
              aria-label="Employee actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => setImmediateTitleOpen(true)}>
                <BriefcaseBusiness className="h-4 w-4" />
                Immediate Title Change
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <EmployeeDetailPage
        user={user}
        onBack={onBack}
        onEdit={onEdit}
        readOnly={readOnly}
        targetUserId={targetUserId}
      />

      {targetUserId && !readOnly && (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <EmploymentChangesPanel
            showAlert={notify}
            employeeUserId={targetUserId}
            employeeName={user?.name}
            compact
          />
        </div>
      )}

      {targetUserId && (
        <ImmediateTitleChangeDialog
          open={immediateTitleOpen}
          onOpenChange={setImmediateTitleOpen}
          employeeUserId={targetUserId}
          showAlert={notify}
        />
      )}
    </div>
  );
}
