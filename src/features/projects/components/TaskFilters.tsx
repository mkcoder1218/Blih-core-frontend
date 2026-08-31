import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TASK_STATUSES } from "../schemas";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const ALL_STATUSES = "All statuses";
const ALL_PRIORITIES = "All priorities";

export function TaskFilters({
  search,
  status,
  priority,
  due,
  onSearch,
  onStatus,
  onPriority,
  onDue,
}: {
  search: string;
  status: string;
  priority: string;
  due: string;
  onSearch: (value: string) => void;
  onStatus: (value: string) => void;
  onPriority: (value: string) => void;
  onDue: (value: string) => void;
}) {
  return (
    <Card size="sm" className="gap-0 rounded-md py-0 shadow-none ring-1 ring-border">
      <CardContent className="flex flex-col gap-2 px-2 py-2 lg:flex-row">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => onSearch(event.currentTarget.value)}
            placeholder="Search tasks"
            className="rounded-md pl-8"
          />
        </div>

        <Select
          value={status || ALL_STATUSES}
          onValueChange={(value) => onStatus(value === ALL_STATUSES ? "" : String(value ?? ""))}
        >
          <SelectTrigger className="w-full rounded-md lg:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STATUSES}>All statuses</SelectItem>
            {TASK_STATUSES.map((item) => (
              <SelectItem key={item} value={item}>
                {item.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={priority || ALL_PRIORITIES}
          onValueChange={(value) => onPriority(value === ALL_PRIORITIES ? "" : String(value ?? ""))}
        >
          <SelectTrigger className="w-full rounded-md lg:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_PRIORITIES}>All priorities</SelectItem>
            {PRIORITIES.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={due}
          onChange={(event) => onDue(event.currentTarget.value)}
          className="w-full rounded-md lg:w-40"
        />
      </CardContent>
    </Card>
  );
}
