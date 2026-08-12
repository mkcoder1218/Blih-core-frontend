import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PROJECT_STATUSES } from "../schemas";
import { CreateProjectModal } from "./CreateProjectModal";

const ALL = "__all__";

export function ProjectsToolbar({
  search,
  status,
  onSearch,
  onStatus,
  canCreateProject = false,
}: {
  search: string;
  status: string;
  onSearch: (value: string) => void;
  onStatus: (value: string) => void;
  canCreateProject?: boolean;
}) {
  return (
    <Card size="sm" className="gap-0 rounded-md py-0 shadow-none ring-1 ring-border">
      <CardContent className="flex flex-col gap-2 px-2 py-2 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-2 md:flex-row">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => onSearch(event.currentTarget.value)}
              placeholder="Search projects"
              className="rounded-md pl-8"
            />
          </div>

          <Select
            value={status || ALL}
            onValueChange={(value) => onStatus(value === ALL ? "" : String(value ?? ""))}
          >
            <SelectTrigger className="w-full rounded-md md:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              {PROJECT_STATUSES.map((item) => (
                <SelectItem key={item} value={item}>
                  {item.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {canCreateProject ? <CreateProjectModal /> : null}
      </CardContent>
    </Card>
  );
}
