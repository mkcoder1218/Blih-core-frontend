import { useParams } from "react-router-dom";
import ProjectDetailsPage from "./ProjectDetailsPage";
import ProjectsPage from "./ProjectsPage";
import type { ProjectsTab } from "../types";

export default function ProjectsRoutePage({ tab }: { tab?: ProjectsTab }) {
  const { projectId } = useParams();
  if (projectId) return <ProjectDetailsPage projectId={projectId} />;
  return <ProjectsPage currentTab={tab || "overview"} />;
}
