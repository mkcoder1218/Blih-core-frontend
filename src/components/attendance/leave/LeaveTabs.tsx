import { cn } from "@/lib/utils";

export type LeaveTabId = "my" | "on-request" | "sent" | "templates";

export function LeaveTabs({
  view,
  setView,
  isHrAdmin,
  isApprover,
  canViewSentRequests,
  pendingCount,
}: {
  view: LeaveTabId;
  setView: (v: LeaveTabId) => void;
  isHrAdmin: boolean;
  isApprover: boolean;
  canViewSentRequests: boolean;
  pendingCount: number;
}) {
  return (
    <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
      <button
        onClick={() => setView("my")}
        className={cn(
          "px-4 py-2 rounded-lg text-xs font-bold transition-colors",
          view === "my" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
        )}
      >
        My Requests
      </button>

      {isApprover && (
        <button
          onClick={() => setView("on-request")}
          className={cn(
            "relative px-4 py-2 rounded-lg text-xs font-bold transition-colors",
            view === "on-request" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          On Request
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {pendingCount > 9 ? "9+" : pendingCount}
            </span>
          )}
        </button>
      )}

      {canViewSentRequests && (
          <button
            onClick={() => setView("sent")}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold transition-colors",
              view === "sent" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Leave Request Sent
          </button>
      )}

      {isHrAdmin && (
        <>
          <button
            onClick={() => setView("templates")}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold transition-colors",
              view === "templates" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Templates
          </button>
        </>
      )}
    </div>
  );
}
