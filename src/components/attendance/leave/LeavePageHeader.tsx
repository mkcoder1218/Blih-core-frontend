import { LayoutTemplate, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LeavePageHeaderProps {
  canManageTemplates: boolean;
  canCreateRequest: boolean;
  isRefreshing: boolean;
  onCreateRequest: () => void;
  onManageTemplates: () => void;
  onRefresh: () => void;
}

export function LeavePageHeader({
  canManageTemplates,
  canCreateRequest,
  isRefreshing,
  onCreateRequest,
  onManageTemplates,
  onRefresh,
}: LeavePageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-black tracking-tight text-slate-950">Leave Requests</h1>
          <span className="hidden rounded-md bg-blue-50 px-2 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-blue-700 sm:inline-flex">
            2-stage approval
          </span>
        </div>
        <p className="mt-1 text-sm font-medium text-slate-500">
          Submit requests and follow each approval stage.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="h-10 rounded-lg border-slate-200 bg-white px-3 text-slate-600 shadow-none"
          aria-label="Refresh leave requests"
        >
          <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          <span className="ml-2 hidden text-xs font-bold sm:inline">Refresh</span>
        </Button>

        {canManageTemplates && (
          <Button
            type="button"
            variant="outline"
            onClick={onManageTemplates}
            className="h-10 rounded-lg border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-none hover:bg-slate-50"
          >
            <LayoutTemplate className="mr-2 h-4 w-4" />
            Templates
          </Button>
        )}

        {canCreateRequest && (
          <Button
            type="button"
            onClick={onCreateRequest}
            className="h-10 rounded-lg bg-blue-600 px-4 text-xs font-bold text-white shadow-none hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            New request
          </Button>
        )}
      </div>
    </div>
  );
}
