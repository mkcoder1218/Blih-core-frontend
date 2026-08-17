import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { Bot } from "lucide-react";
import BusinessSmtpSettingsPanel from "../businesses/BusinessSmtpSettingsPanel";
import SubscriptionPage from "../../pages/SubscriptionPage";
import AttendanceSettingsTab from "./AttendanceSettingsTab";
import GeneralSettingsTab from "./GeneralSettingsTab";
import PunctualityMessagesTab from "./PunctualityMessagesTab";
import ProbationSettingsTab from "./ProbationSettingsTab";
import TelegramTaskSyncSettingsTab from "./TelegramTaskSyncSettingsTab";

type Props = {
  showAlert: (msg: string, type?: "success" | "info" | "error") => void;
};

const validTabs = ["general", "attendance", "probation", "smtp", "telegram", "punctuality-messages", "subscription"] as const;

export default function BusinessSettingsView({ showAlert }: Props) {
  const { tab } = useParams<{ tab?: string }>();
  const location = useLocation();
  const activeTab = tab || "general";
  const prefix = location.pathname.startsWith("/super-admin")
    ? "/super-admin"
    : location.pathname.startsWith("/hr-manager")
      ? "/hr-manager"
      : "/business-admin";
  const canConfigureTelegram = prefix === "/business-admin";
  const isValidTab = validTabs.includes(activeTab as (typeof validTabs)[number]) && (activeTab !== "telegram" || canConfigureTelegram);

  if (!tab) return <Navigate to={`${prefix}/settings/general`} replace />;
  if (!isValidTab) return <Navigate to={`${prefix}/settings/general`} replace />;

  return (
    <div className="w-full max-w-none space-y-5 pb-10 text-slate-900 dark:text-slate-100">
      {canConfigureTelegram ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 px-1">
            <div className="rounded-xl bg-slate-950 p-2 text-white dark:bg-white dark:text-slate-950">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">Telegram Task Sync</p>
              <p className="text-xs text-slate-500">Route project tasks and checkout summaries to department Telegram groups.</p>
            </div>
          </div>
          <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-900">
            <Link
              to={`${prefix}/settings/general`}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${activeTab === "general" ? "bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
            >
              General
            </Link>
            <Link
              to={`${prefix}/settings/telegram`}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${activeTab === "telegram" ? "bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
            >
              Telegram Task Sync
            </Link>
          </div>
        </div>
      ) : null}

      {activeTab === "general" ? <GeneralSettingsTab showAlert={showAlert} /> : null}
      {activeTab === "attendance" ? <AttendanceSettingsTab showAlert={showAlert} /> : null}
      {activeTab === "probation" ? <ProbationSettingsTab showAlert={showAlert} /> : null}
      {activeTab === "smtp" ? <BusinessSmtpSettingsPanel showAlert={showAlert} /> : null}
      {activeTab === "telegram" && canConfigureTelegram ? <TelegramTaskSyncSettingsTab showAlert={showAlert} /> : null}
      {activeTab === "punctuality-messages" ? <PunctualityMessagesTab showAlert={showAlert} /> : null}
      {activeTab === "subscription" ? <SubscriptionPage /> : null}
    </div>
  );
}
