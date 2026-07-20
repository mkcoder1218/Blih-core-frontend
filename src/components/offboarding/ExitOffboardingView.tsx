import ExitClearancePage from "./pages/ExitClearancePage";
import ExitReasonsPage from "./pages/ExitReasonsPage";
import ExitRequestsPage from "./pages/ExitRequestsPage";
import MyExitPage from "./pages/MyExitPage";

export type ExitPageTab =
  | "my-exit"
  | "requests"
  | "clearance"
  | "reasons"
  | "overview"
  | "offboarding"
  | "resign"
  | "interviews"
  | "forms"
  | "documents";

interface ExitOffboardingViewProps {
  currentTab: ExitPageTab;

  onDraftAiSuggestion: (
    context: string,
  ) => void;

  showAlert: (
    message: string,
    type?: "success" | "error" | "info",
  ) => void;
}

function resolveTab(
  tab: ExitPageTab,
):
  | "my-exit"
  | "requests"
  | "clearance"
  | "reasons" {
  switch (tab) {
    case "my-exit":
    case "offboarding":
      return "my-exit";

    case "requests":
    case "resign":
    case "overview":
      return "requests";

    case "clearance":
    case "interviews":
    case "documents":
      return "clearance";

    case "reasons":
    case "forms":
      return "reasons";

    default:
      return "my-exit";
  }
}

export default function ExitOffboardingView({
  currentTab,
  showAlert,
}: ExitOffboardingViewProps) {
  const activeTab =
    resolveTab(currentTab);

  if (activeTab === "my-exit") {
    return (
      <MyExitPage
        showAlert={showAlert}
      />
    );
  }

  if (activeTab === "clearance") {
    return (
      <ExitClearancePage
        showAlert={showAlert}
      />
    );
  }

  if (activeTab === "reasons") {
    return (
      <ExitReasonsPage
        showAlert={showAlert}
      />
    );
  }

  return (
    <ExitRequestsPage
      showAlert={showAlert}
    />
  );
}