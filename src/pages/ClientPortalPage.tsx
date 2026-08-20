import { useQuery } from "@tanstack/react-query";
import { BriefcaseBusiness, CalendarDays, CheckCircle2, LogOut, Milestone, UserRound } from "lucide-react";
import { useMe } from "../hooks/useMe";
import { listClientPortalProjects } from "../api/clientPortal";
import { clearAuthTokens } from "../api/storage";
import { notifyAuthChanged } from "../api/authState";

function statusLabel(status: string) {
  return status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ClientPortalPage() {
  const me = useMe();
  const projects = useQuery({ queryKey: ["client-portal-projects"], queryFn: listClientPortalProjects });
  const portalUser = (me.data as any)?.data?.portalUser;
  const business = me.data?.data?.business;

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
              <BriefcaseBusiness className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-blue-600">Blih Client Portal</p>
              <h1 className="text-base font-black text-slate-950">{business?.name || "Project Workspace"}</h1>
            </div>
          </div>
          <button
            onClick={() => {
              clearAuthTokens();
              notifyAuthChanged();
              window.location.assign("/");
            }}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="mb-6 flex flex-col gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-blue-700">Welcome, {portalUser?.fullName || me.data?.data?.user?.fullName}</p>
            <p className="text-sm text-slate-600">A focused view of the projects linked to your client account.</p>
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <UserRound className="h-4 w-4 text-blue-600" />
            {portalUser?.email || me.data?.data?.user?.email}
          </div>
        </div>

        {projects.isLoading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500">Loading your projects...</div>
        ) : projects.isError ? (
          <div className="rounded-lg border border-rose-100 bg-rose-50 p-4 text-sm font-bold text-rose-700">Could not load your portal projects.</div>
        ) : !projects.data?.length ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
            <h2 className="text-lg font-black text-slate-950">No linked projects yet</h2>
            <p className="mt-1 text-sm text-slate-500">Projects shared by the Blih team will appear here.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {projects.data.map((project) => (
              <article key={project.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-black text-slate-950">{project.title}</h2>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">{statusLabel(project.status)}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{project.description || "Project details and progress summary."}</p>
                  </div>
                  <div className="w-full max-w-xs">
                    <div className="mb-2 flex items-center justify-between text-xs font-black text-slate-500">
                      <span>Completion</span>
                      <span>{project.progressPercent || 0}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-blue-600" style={{ width: `${Math.min(100, Math.max(0, project.progressPercent || 0))}%` }} />
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-400"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Tasks</div>
                    <p className="mt-2 text-xl font-black">{project.taskProgress.completedTasks}/{project.taskProgress.totalTasks}</p>
                  </div>
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-400"><Milestone className="h-4 w-4 text-blue-600" /> Milestones</div>
                    <p className="mt-2 text-xl font-black">{project.milestones.length}</p>
                  </div>
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-400"><CalendarDays className="h-4 w-4 text-amber-600" /> Timeline</div>
                    <p className="mt-2 text-sm font-bold text-slate-700">{project.startDate || "Not set"} to {project.endDate || "Not set"}</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  <section>
                    <h3 className="mb-2 text-sm font-black text-slate-900">Task Progress</h3>
                    <div className="space-y-2">
                      {project.tasks.length ? project.tasks.map((task) => (
                        <div key={task.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm">
                          <span className="font-semibold text-slate-700">{task.title}</span>
                          <span className="text-xs font-black text-slate-500">{statusLabel(task.status)}</span>
                        </div>
                      )) : <p className="text-sm text-slate-500">No shared task progress yet.</p>}
                    </div>
                  </section>
                  <section>
                    <h3 className="mb-2 text-sm font-black text-slate-900">Milestones & Updates</h3>
                    <div className="space-y-2">
                      {project.milestones.length ? project.milestones.map((milestone) => (
                        <div key={milestone.id} className="rounded-lg border border-slate-100 px-3 py-2 text-sm">
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-semibold text-slate-700">{milestone.name}</span>
                            <span className="text-xs font-black text-slate-500">{statusLabel(milestone.status)}</span>
                          </div>
                          {milestone.dueDate && <p className="mt-1 text-xs font-semibold text-slate-400">Due {milestone.dueDate}</p>}
                        </div>
                      )) : <p className="text-sm text-slate-500">No milestones shared yet.</p>}
                    </div>
                  </section>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
