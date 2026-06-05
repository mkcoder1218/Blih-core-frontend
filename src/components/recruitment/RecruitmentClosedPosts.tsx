import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { EmptyState, LoadingSpinner, PageHeader, StatusBadge, TabSwitcher } from '@/components/ui/blih';
import { useJobApplications, useJobRequests } from '../../hooks/useJobRequests';

interface ClosedPostsProps {
  onDraftAiSuggestion: (context: string) => void;
  showAlert: (message: string, type?: 'success' | 'info' | 'error') => void;
}

type ClosedSubTab = 'details' | 'applicants' | 'analytics';

const FUNNEL_STAGES = new Set(['interview', 'shortlisted', 'waitlisted', 'offer', 'hired']);

export default function RecruitmentClosedPosts({ onDraftAiSuggestion }: ClosedPostsProps) {
  const { data: jobRequests, isLoading: loadingJobs } = useJobRequests({ includePublished: true });
  const { data: applications, isLoading: loadingApplications } = useJobApplications();
  const [expandedJobs, setExpandedJobs] = useState<Record<string, boolean>>({});
  const [activeTabs, setActiveTabs] = useState<Record<string, ClosedSubTab>>({});

  const closedJobs = useMemo(() => {
    return (jobRequests?.rows || [])
      .filter((job) => job.postingStatus === 'closed')
      .map((job) => {
        const jobApplications = (applications || []).filter((app: any) => app.jobOpeningId === job.id);
        const hiredCount = jobApplications.filter((app: any) => app.stage === 'hired').length;
        const interviewedCount = jobApplications.filter((app: any) => FUNNEL_STAGES.has(app.stage)).length;
        const shortlistedCount = jobApplications.filter((app: any) => ['shortlisted', 'offer', 'hired'].includes(app.stage)).length;
        const rejectedCount = jobApplications.filter((app: any) => app.stage === 'rejected').length;

        return {
          ...job,
          applications: jobApplications,
          hiredCount,
          interviewedCount,
          shortlistedCount,
          rejectedCount,
          viewsCount: Number((job as any).views || 0),
        };
      });
  }, [applications, jobRequests]);

  const toggleExpand = (id: string) => {
    setExpandedJobs((prev) => ({ ...prev, [id]: !(prev[id] ?? false) }));
  };

  const handleAiInsightRequest = (title: string) => {
    onDraftAiSuggestion(
      `Synthesize recruitment diagnostics and funnel optimization insights for the closed '${title}' posting. Break down applicant volume, interview conversion, shortlist quality, and final hiring outcome.`
    );
  };

  if (loadingJobs || loadingApplications) {
    return <LoadingSpinner label="Loading closed postings..." />;
  }

  return (
    <div id="recruitment-closed-posts-view" className="space-y-6 animate-fade-in font-sans pb-12">
      <PageHeader
        eyebrow="Recruitment"
        title="Closed Job Postings"
        description="Completed recruitment processes and filled roles"
        actions={
          <>
            <span className="bg-slate-100 text-slate-700 font-extrabold text-[11px] px-3 py-1.5 rounded-lg border border-slate-200">
              {closedJobs.length} Closed Position{closedJobs.length === 1 ? '' : 's'}
            </span>
            <button
              onClick={() => handleAiInsightRequest(closedJobs[0]?.title || 'closed jobs')}
              className="bg-blue-50 hover:bg-blue-100 text-blue-600 font-black text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>AI Audit Funnel</span>
            </button>
          </>
        }
      />

      {closedJobs.length === 0 ? (
        <EmptyState
          title="No closed postings"
          description="When a posted job is closed after the position is filled, it will appear here."
        />
      ) : (
        <div className="space-y-5">
          {closedJobs.map((job, index) => {
            const isExpanded = expandedJobs[job.id] ?? index === 0;
            const activeTab = activeTabs[job.id] || 'analytics';
            const positions = job.positions || 1;

            return (
              <div key={job.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
                <div className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50/40 transition-colors">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-base font-black text-slate-900 tracking-tight">{job.title}</h4>
                      <StatusBadge label={job.hiredCount > 0 ? 'Position Filled' : 'Closed Job'} tone="slate" />
                    </div>
                    <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1 flex-wrap">
                      <span className="text-blue-600 font-extrabold">{job.department}</span>
                      <span>{job.type}</span>
                      <span>{positions} Position{positions > 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 self-stretch md:self-auto justify-between">
                    <div className="flex items-center gap-2 text-slate-500 font-semibold text-xs">
                      <span className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 font-bold block text-slate-600">
                        <strong>{job.applications.length}</strong> applicants
                      </span>
                      <span className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 font-bold block text-slate-600">
                        <strong>{job.viewsCount}</strong> views
                      </span>
                    </div>

                    <button
                      onClick={() => toggleExpand(job.id)}
                      className="text-xs font-black text-blue-600 hover:text-blue-700 bg-slate-50 hover:bg-slate-100 border border-slate-150 px-3 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <span>{isExpanded ? 'Less' : 'More'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-100 p-5 bg-slate-50/20 space-y-6 animate-fade-in">
                    <TabSwitcher
                      variant="underline"
                      tabs={[
                        { id: 'details', label: 'Job Detail' },
                        { id: 'applicants', label: `Applicants (${job.applications.length})` },
                        { id: 'analytics', label: 'Analytics' },
                      ]}
                      active={activeTab}
                      onChange={(tab) => setActiveTabs((prev) => ({ ...prev, [job.id]: tab as ClosedSubTab }))}
                    />

                    {activeTab === 'analytics' && (
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                          { label: 'Total', value: job.applications.length, className: 'text-slate-950' },
                          { label: 'Interviewed', value: job.interviewedCount, className: 'text-blue-600' },
                          { label: 'Shortlist', value: job.shortlistedCount, className: 'text-emerald-600' },
                          { label: 'Rejected', value: job.rejectedCount, className: 'text-rose-500' },
                        ].map((item) => (
                          <div key={item.label} className="bg-white rounded-2xl border border-slate-100 p-5 text-center shadow-xs">
                            <h3 className={`text-2xl font-black ${item.className}`}>{item.value}</h3>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1 block">{item.label}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeTab === 'details' && (
                      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4 text-xs text-slate-600">
                        <div>
                          <h5 className="font-black text-slate-900 uppercase text-[10px] tracking-widest mb-2">Job Overview</h5>
                          <p className="leading-relaxed font-medium">{job.overview || 'No overview provided.'}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h5 className="font-black text-slate-900 uppercase text-[10px] tracking-widest mb-2">Requirements</h5>
                            <ul className="space-y-1.5">
                              {(job.requirements || []).map((item: string) => <li key={item}>{item}</li>)}
                            </ul>
                          </div>
                          <div>
                            <h5 className="font-black text-slate-900 uppercase text-[10px] tracking-widest mb-2">Qualifications</h5>
                            <ul className="space-y-1.5">
                              {(job.qualifications || []).map((item: string) => <li key={item}>{item}</li>)}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'applicants' && (
                      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3 text-xs font-semibold">
                        {job.applications.length === 0 ? (
                          <EmptyState title="No applicants recorded" compact />
                        ) : (
                          job.applications.map((app: any) => (
                            <div key={app.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100/70 gap-3">
                              <div>
                                <span className="text-slate-800 font-bold block">{app.fullName || 'Anonymous candidate'}</span>
                                <span className="text-slate-400 text-[10px]">{app.email || app.phone || 'No contact provided'}</span>
                              </div>
                              <span className="bg-blue-50 text-blue-600 border border-blue-100 rounded px-2 py-0.5 text-[10px] font-black uppercase">
                                {app.stage || 'applied'}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
