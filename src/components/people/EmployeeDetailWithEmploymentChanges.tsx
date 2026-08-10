import EmployeeDetailPage from "./EmployeeDetailPage";
import { EmploymentChangesPanel } from "./employment-changes/EmploymentChangesPanel";

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
  const notify =
    showAlert ||
    ((message: string, type?: "success" | "info" | "error") => {
      if (type === "error") {
        window.alert(message);
      }
    });

  return (
    <div className="space-y-5">
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
    </div>
  );
}
