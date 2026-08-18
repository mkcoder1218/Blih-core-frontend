import { useParams } from "react-router-dom";
import { useMe } from "../../../hooks/useMe";
import ProjectDetailsPage from "./ProjectDetailsPage";
import ProjectsPage from "./ProjectsPage";
import type { ProjectsTab } from "../types";

export default function ProjectsRoutePage({ tab }: { tab?: ProjectsTab }) {
  const { projectId } = useParams();
  const me = useMe();
  const isIntern = me.data?.data?.user?.employmentType === "intern";

  if (projectId) return <ProjectDetailsPage projectId={projectId} />;

  const requestedTab = tab || "overview";
  const resolvedTab: ProjectsTab =
    isIntern && (requestedTab === "overview" || requestedTab === "all")
      ? "mine"
      : requestedTab;

  return <ProjectsPage currentTab={resolvedTab} />;
}
