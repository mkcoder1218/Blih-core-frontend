import CareerOverviewTab from "./tabs/CareerOverviewTab";
import EmploymentRequestsTable from "./EmploymentRequestsTable";

export type TalentTab = "overview" | "my-requests" | "requests";

interface CareerManagementViewProps {
  currentTab: TalentTab | string;
  onDraftAiSuggestion: (context: string) => void;
  showAlert: (title: string, type?: "success" | "info" | "error") => void;
}

export default function CareerManagementView({
  currentTab,
  onDraftAiSuggestion,
  showAlert,
}: CareerManagementViewProps) {
  const normalizedTab: TalentTab =
    currentTab === "my-requests"
      ? "my-requests"
      : currentTab === "requests" || currentTab === "development" || currentTab === "culture"
        ? "requests"
        : "overview";

  return (
    <div className="mx-auto max-w-7xl space-y-6 font-sans">
      {normalizedTab === "overview" && (
        <CareerOverviewTab
          onDraftAiSuggestion={onDraftAiSuggestion}
          showAlert={showAlert}
        />
      )}

      {normalizedTab === "my-requests" && (
        <EmploymentRequestsTable scope="mine" showAlert={showAlert} />
      )}

      {normalizedTab === "requests" && (
        <EmploymentRequestsTable scope="visible" showAlert={showAlert} />
      )}
    </div>
  );
}
