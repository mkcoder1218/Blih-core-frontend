import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PROJECT_STATUSES, projectStatusLabel } from "../schemas";
import { CreateProjectModal } from "./CreateProjectModal";

const ALL_STATUSES_VALUE = "all-statuses";

export function ProjectsToolbar({
  search,
  status,
  archived,
  onSearch,
  onStatus,
  onArchivedChange,
  canCreateProject = false,
}: {
  search: string;
  status: string;
  archived: boolean;
  onSearch: (value: string) => void;
  onStatus: (value: string) => void;
  onArchivedChange: (archived: boolean) => void;
  canCreateProject?: boolean;
}) {
  return (
    <Card size="sm" className="gap-0 rounded-md py-0 shadow-none ring-1 ring-border">
      <CardContent className="flex flex-col gap-2 px-2 py-2 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-2 md:flex-row md:items-center">
          <Tabs
            value={archived ? "archived" : "projects"}
            onValueChange={(value) => onArchivedChange(value === "archived")}
            className="gap-0"
          >
            <TabsList className="h-8 rounded-md p-0.5">
              <TabsTrigger value="projects" className="rounded-sm px-3 text-xs">
                Projects
              </TabsTrigger>
              <TabsTrigger value="archived" className="rounded-sm px-3 text-xs">
                Archived
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => onSearch(event.currentTarget.value)}
              placeholder={archived ? "Search archived projects" : "Search projects"}
              className="rounded-md pl-8"
            />
          </div>

          {!archived ? (
            <Select
              value={status || ALL_STATUSES_VALUE}
              onValueChange={(value) => onStatus(value === ALL_STATUSES_VALUE ? "" : String(value ?? ""))}
            >
              <SelectTrigger className="w-full rounded-md md:w-44">
                <SelectValue>{status ? projectStatusLabel(status) : "All statuses"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_STATUSES_VALUE}>All statuses</SelectItem>
                {PROJECT_STATUSES.filter((item) => item !== "ARCHIVED").map((item) => (
                  <SelectItem key={item} value={item}>
                    {projectStatusLabel(item)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </div>

        {canCreateProject ? <CreateProjectModal /> : null}
      </CardContent>
    </Card>
  );
}
