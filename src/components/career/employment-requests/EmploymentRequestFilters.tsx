import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const labelClass =
  "mb-1.5 block text-[10px] font-black uppercase tracking-wide text-slate-400";

export type EmploymentRequestFiltersValue = {
  search: string;
  status: string;
  requestKind: string;
  approvalStage: string;
  dateFrom: string;
  dateTo: string;
};

type Props = {
  scope: "mine" | "visible";
  value: EmploymentRequestFiltersValue;
  onChange: (next: EmploymentRequestFiltersValue) => void;
};

export function EmploymentRequestFilters({ scope, value, onChange }: Props) {
  const set = (key: keyof EmploymentRequestFiltersValue, next: string) =>
    onChange({ ...value, [key]: next });

  if (scope === "mine") {
    return (
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className={labelClass}>Status</label>
          <Select value={value.status} onValueChange={(next) => set("status", next)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="SCHEDULED">Scheduled</SelectItem>
              <SelectItem value="APPLIED">Applied</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className={labelClass}>Request Type</label>
          <Select
            value={value.requestKind}
            onValueChange={(next) => set("requestKind", next)}
          >
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="TITLE">Title</SelectItem>
              <SelectItem value="SALARY">Salary</SelectItem>
              <SelectItem value="COMBINED">Title + Salary</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      <div className="sm:col-span-2">
        <label className={labelClass}>Employee / Search</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            value={value.search}
            onChange={(event) => set("search", event.currentTarget.value)}
            placeholder="Employee, title or reason"
            className="pl-9"
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Request Type</label>
        <Select
          value={value.requestKind}
          onValueChange={(next) => set("requestKind", next)}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="TITLE">Title</SelectItem>
            <SelectItem value="SALARY">Salary</SelectItem>
            <SelectItem value="COMBINED">Title + Salary</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className={labelClass}>Status</label>
        <Select value={value.status} onValueChange={(next) => set("status", next)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="SCHEDULED">Scheduled</SelectItem>
            <SelectItem value="APPLIED">Applied</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className={labelClass}>Approval Stage</label>
        <Select
          value={value.approvalStage}
          onValueChange={(next) => set("approvalStage", next)}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Stages</SelectItem>
            <SelectItem value="MANAGER">Manager</SelectItem>
            <SelectItem value="HR">HR</SelectItem>
            <SelectItem value="FINANCE">Finance</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className={labelClass}>From Date</label>
        <Input
          type="date"
          value={value.dateFrom}
          onChange={(event) => set("dateFrom", event.currentTarget.value)}
        />
      </div>

      <div>
        <label className={labelClass}>To Date</label>
        <Input
          type="date"
          value={value.dateTo}
          onChange={(event) => set("dateTo", event.currentTarget.value)}
        />
      </div>
    </div>
  );
}
