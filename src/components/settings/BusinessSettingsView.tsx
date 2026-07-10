import { Navigate, useLocation, useParams } from "react-router-dom";
import BusinessSmtpSettingsPanel from "../businesses/BusinessSmtpSettingsPanel";
import SubscriptionPage from "../../pages/SubscriptionPage";
import GeneralSettingsTab from "./GeneralSettingsTab";
import PunctualityMessagesTab from "./PunctualityMessagesTab";

type Props = {
  showAlert: (msg: string, type?: "success" | "info" | "error") => void;
};

const validTabs = ["general", "smtp", "punctuality-messages", "subscription"] as const;

export default function BusinessSettingsView({ showAlert }: Props) {
  const { tab } = useParams<{ tab?: string }>();
  const location = useLocation();
  const activeTab = tab || "general";
  const prefix = location.pathname.startsWith("/super-admin") ? "/super-admin" : location.pathname.startsWith("/hr-manager") ? "/hr-manager" : "/business-admin";

  if (!tab) return <Navigate to={`${prefix}/settings/general`} replace />;

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-10 text-slate-900 dark:text-slate-100">
      {activeTab === "general" ? <GeneralSettingsTab showAlert={showAlert} /> : null}
      {activeTab === "smtp" ? <BusinessSmtpSettingsPanel showAlert={showAlert} /> : null}
      {activeTab === "punctuality-messages" ? <PunctualityMessagesTab showAlert={showAlert} /> : null}
      {activeTab === "subscription" ? <SubscriptionPage /> : null}
      {!validTabs.includes(activeTab as any) ? <Navigate to={`${prefix}/settings/general`} replace /> : null}
    </div>
  );
}
