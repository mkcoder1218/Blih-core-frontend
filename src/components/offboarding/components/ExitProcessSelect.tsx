import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import {
    getExitModeLabel,
} from "../exit.utils";

interface ExitProcessSelectProps {
  value: string;
  exits: any[];

  onChange: (
    value: string,
  ) => void;
}

function getEmployeeName(
  exitProcess: any,
): string {
  return (
    exitProcess.employee?.fullName ||
    exitProcess.employee?.email ||
    "Employee"
  );
}

export default function ExitProcessSelect({
  value,
  exits,
  onChange,
}: ExitProcessSelectProps) {
  return (
    <Select
      value={value}
      onValueChange={(nextValue) =>
        onChange(
          String(nextValue || ""),
        )
      }
    >
      <SelectTrigger className="h-11 w-full rounded-xl bg-slate-50 px-4 text-sm font-semibold">
        <SelectValue placeholder="Select an employee exit" />
      </SelectTrigger>

      <SelectContent
        align="start"
        className="max-h-80"
      >
        {exits.map(
          (exitProcess) => (
            <SelectItem
              key={exitProcess.id}
              value={exitProcess.id}
              className="py-2.5"
            >
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-xs font-bold text-slate-900">
                  {getEmployeeName(
                    exitProcess,
                  )}
                </span>

                <span className="text-[10px] text-slate-500">
                  {getExitModeLabel(
                    exitProcess.exitMode,
                  )}
                  {" · "}
                  {String(
                    exitProcess.status,
                  ).replace(/_/g, " ")}
                </span>
              </div>
            </SelectItem>
          ),
        )}
      </SelectContent>
    </Select>
  );
}