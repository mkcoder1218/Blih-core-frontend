import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Copy,
  Edit3,
  Eye,
  MoreHorizontal,
  PauseCircle,
  Send,
  X,
  XCircle,
} from 'lucide-react';
import {
  useAdvanceCandidate,
  useCancelInterview,
  useCloseJob,
  useCompleteSession,
  useInterviews,
  useJobApplications,
  useJobRequests,
  usePauseJob,
  useScheduleInterview,
} from '../../hooks/useJobRequests';
import { api } from '../../api/client';
import { getOfferLetters } from '../../api/offerLetters';
import { EmptyState, LoadingSpinner, StatusBadge, UserAvatar } from '@/components/ui/blih';
import ScheduleInterviewModal from './ScheduleInterviewModal';
import OfferLetterCreateModal from '../offer-letters/OfferLetterCreateModal';
import CreateJobModal from './create-job/CreateJobModal';
import { useMe } from '../../hooks/useMe';

type WorkspaceTab = 'overview' | 'applicants' | 'interviews' | 'offers' | 'analytics';
type InterviewView = 'all' | 'mine';

interface JobRecruitmentWorkspaceProps {
  initialTab?: WorkspaceTab;
  showAlert: (message: string, type?: 'success' | 'info' | 'error') => void;
}

const stageTabs = [
  { key: 'new', label: 'New Applicants', stages: ['', 'applied', 'new'] },
  { key: 'screening', label: 'Screening', stages: ['screening', 'review', 'pending_review'] },
  { key: 'interview', label: 'Interview', stages: ['interview', 'interview_scheduled', 'scheduled'] },
  { key: 'shortlisted', label: 'Shortlisted', stages: ['shortlisted'] },
  { key: 'waitlisted', label: 'Waitlisted', stages: ['waitlisted'] },
  { key: 'offered', label: 'Offered', stages: ['offer', 'offered'] },
  { key: 'hired', label: 'Hired', stages: ['hired'] },
  { key: 'rejected', label: 'Rejected', stages: ['rejected'] },
] as const;

const tabLabels: { key: WorkspaceTab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'applicants', label: 'Applicants' },
  { key: 'interviews', label: 'Interviews' },
  { key: 'offers', label: 'Offers' },
  { key: 'analytics', label: 'Analytics' },
];

function normalizeStage(value: any) {
  return `${value ?? ''}`.toLowerCase().trim();
}

function fmtDate(value: any) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return `${value}`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtDateTime(value: any) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return `${value}`;
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getApplicationJobId(application: any) {
  return application?.jobOpeningId || application?.jobRequestId || application?.jobId || application?.JobOpening?.id || application?.jobOpening?.id;
}

function getCandidateName(application: any) {
  return application?.fullName || application?.candidateName || application?.metadata?.fullName || 'Anonymous Candidate';
}

function getCandidateEmail(application: any) {
  return application?.email || application?.candidateEmail || application?.metadata?.email || '';
}

function getCandidatePhone(application: any) {
  return application?.phone || application?.candidatePhone || application?.metadata?.phone || '';
}

function getCandidateRating(application: any) {
  const score = Number(application?.candidateScore ?? application?.score ?? application?.rating ?? application?.metadata?.score);
  if (!Number.isFinite(score)) return null;
  return score > 5 ? Math.round((score / 20) * 10) / 10 : Math.round(score * 10) / 10;
}

function getInterviewApplicationId(interview: any) {
  return interview?.jobApplicationId || interview?.JobApplication?.id || interview?.applicationId;
}

function getInterviewJobId(interview: any) {
  return interview?.jobOpeningId || interview?.JobApplication?.jobOpeningId || interview?.JobApplication?.JobOpening?.id;
}

function getOfferCandidateEmail(offer: any) {
  return `${offer?.candidateEmail || offer?.Candidate?.email || ''}`.toLowerCase();
}

function EmptyInline({ title }: { title: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
      <p className="text-xs font-bold text-slate-500">{title}</p>
    </div>
  );
}

export default function JobRecruitmentWorkspace({ initialTab = 'overview', showAlert }: JobRecruitmentWorkspaceProps) {
  const { data: jobRequests, isLoading: loadingJobs } = useJobRequests({ includePublished: true });
  const { data: applications = [], isLoading: loadingApplications } = useJobApplications();
  const { data: interviews = [], isLoading: loadingInterviews } = useInterviews();
  const { data: me } = useMe();
  const offersQuery = useQuery({
    queryKey: ['offer-letters', 'workspace'],
    queryFn: async () => {
      const res = await getOfferLetters({ limit: 500, offset: 0 });
      const payload: any = res.data;
      return payload?.data?.rows ?? payload?.data?.data ?? payload?.data ?? [];
    },
  });

  const advanceMutation = useAdvanceCandidate();
  const scheduleMutation = useScheduleInterview();
  const closeJob = useCloseJob();
  const pauseJob = usePauseJob();
  const cancelInterview = useCancelInterview();
  const completeInterview = useCompleteSession();

  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(initialTab);
  const [activeStage, setActiveStage] = useState('new');
  const [interviewView, setInterviewView] = useState<InterviewView>('all');
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [selectedInterview, setSelectedInterview] = useState<any>(null);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [scheduleTarget, setScheduleTarget] = useState<any>(null);
  const [offerTarget, setOfferTarget] = useState<any>(null);
  const [jobFormMode, setJobFormMode] = useState<'edit' | 'duplicate' | null>(null);

  const jobs = useMemo(() => {
    const rows = jobRequests?.rows ?? [];
    return rows
      .filter((job: any) => job.isPosted || ['open', 'active', 'published', 'approved'].includes(normalizeStage(job.postingStatus || job.status)))
      .map((job: any) => {
        const jobApplications = applications.filter((application: any) => getApplicationJobId(application) === job.id);
        const jobInterviews = interviews.filter((interview: any) => getInterviewJobId(interview) === job.id || jobApplications.some((application: any) => application.id === getInterviewApplicationId(interview)));
        const offerRows = (offersQuery.data ?? []).filter((offer: any) => {
          const email = getOfferCandidateEmail(offer);
          return jobApplications.some((application: any) => email && email === getCandidateEmail(application).toLowerCase());
        });
        return {
          ...job,
          applications: jobApplications,
          interviews: jobInterviews,
          offers: offerRows,
          viewsCount: job.views ?? job.viewCount ?? 0,
        };
      });
  }, [applications, interviews, jobRequests?.rows, offersQuery.data]);

  const selectedJob = jobs.find((job: any) => job.id === selectedJobId) ?? null;
  const shownJob = selectedJob ?? (initialTab === 'overview' ? null : jobs[0] ?? null);
  const jobApps = shownJob?.applications ?? [];
  const jobInterviews = shownJob?.interviews ?? [];
  const jobOffers = shownJob?.offers ?? [];
  const businessSlug = me?.data?.business?.slug || shownJob?.business?.slug || shownJob?.Business?.slug || shownJob?.businessSlug;

  const offerByEmail = useMemo(() => {
    const map = new Map<string, any>();
    jobOffers.forEach((offer: any) => {
      const email = getOfferCandidateEmail(offer);
      if (email) map.set(email, offer);
    });
    return map;
  }, [jobOffers]);

  const stageCounts = stageTabs.map((stage) => ({
    ...stage,
    count: jobApps.filter((application: any) => stage.stages.includes(normalizeStage(application.stage) as never)).length,
  }));

  const selectedStage = stageTabs.find((stage) => stage.key === activeStage) ?? stageTabs[0];
  const stagedApplicants = jobApps.filter((application: any) => selectedStage.stages.includes(normalizeStage(application.stage) as never));

  const openWorkspace = (jobId: string, tab: WorkspaceTab = initialTab) => {
    setSelectedJobId(jobId);
    setActiveTab(tab);
  };

  const moveCandidate = (application: any, stage: string) => {
    advanceMutation.mutate({ id: application.id, stage }, {
      onSuccess: () => showAlert(`${getCandidateName(application)} moved to ${stage.replace(/_/g, ' ')}`, 'success'),
      onError: (error: any) => showAlert(error?.message || 'Failed to update candidate stage', 'error'),
    });
  };

  const scheduleInterview = (data: any) => {
    scheduleMutation.mutate(data, {
      onSuccess: () => { setScheduleTarget(null); showAlert('Interview invitation sent', 'success'); },
      onError: (error: any) => showAlert(error?.message || 'Failed to schedule interview', 'error'),
    });
  };

  const closeSelectedJob = () => {
    if (!shownJob) return;
    closeJob.mutate(shownJob.id, {
      onSuccess: () => { showAlert(`"${shownJob.title}" closed`, 'success'); setSelectedJobId(null); },
      onError: (error: any) => showAlert(error?.response?.data?.message || 'Failed to close job', 'error'),
    });
  };

  const pauseSelectedJob = () => {
    if (!shownJob) return;
    pauseJob.mutate(shownJob.id, {
      onSuccess: () => { showAlert(`"${shownJob.title}" paused`, 'success'); setSelectedJobId(null); },
      onError: (error: any) => showAlert(error?.response?.data?.message || 'Failed to pause job', 'error'),
    });
  };

  const submitJobForm = async (data: any) => {
    try {
      await api.post('/api/v1/hr/recruitment/job-openings', {
        title: data.jobTitle,
        employmentType: data.employmentType,
        headcount: data.openings,
        description: data.description,
        priority: (data.priority || 'Medium').toString().toLowerCase(),
        metadata: {
          department: data.department,
          position: data.position,
          priority: data.priority,
          neededByDate: data.neededByDate,
          urgency: data.urgency,
          hiringManager: data.hiringManager,
          applicationFields: data.applicantFields,
          customFields: data.customFields,
          requirements: data.requiredSkills || [],
          qualifications: data.preferredSkills || [],
          importance: data.businessJustification || 'Standard business requirement.',
          sourceJobId: shownJob?.id,
          sourceAction: jobFormMode,
        },
      });
      showAlert(jobFormMode === 'duplicate' ? 'Duplicated job request created' : 'Updated job request created for approval', 'success');
      setJobFormMode(null);
    } catch (error: any) {
      showAlert(error?.response?.data?.message || 'Failed to save job request', 'error');
    }
  };

  if (loadingJobs || loadingApplications || loadingInterviews) {
    return <LoadingSpinner label="Loading recruitment workspace..." />;
  }

  if (!shownJob) {
    return (
      <div className="space-y-4">
        <JobList jobs={jobs} onOpen={(jobId) => openWorkspace(jobId, initialTab)} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {selectedJobId ? (
        <button
          type="button"
          onClick={() => setSelectedJobId(null)}
          className="text-xs font-bold text-blue-600 hover:text-blue-700"
        >
          Back to active jobs
        </button>
      ) : null}

      <JobWorkspaceHeader
        job={shownJob}
        applicants={jobApps.length}
        interviews={jobInterviews.length}
        offers={jobOffers.length}
        onEdit={() => setJobFormMode('edit')}
        onDuplicate={() => setJobFormMode('duplicate')}
        onPause={pauseSelectedJob}
        onClose={closeSelectedJob}
        publicUrl={businessSlug ? `${window.location.origin}/careers/${encodeURIComponent(businessSlug)}/apply/${encodeURIComponent(shownJob.id)}` : undefined}
      />

      <JobWorkspaceTabs
        activeTab={activeTab}
        onChange={setActiveTab}
        counts={{ applicants: jobApps.length, interviews: jobInterviews.length, offers: jobOffers.length }}
      />

      {activeTab === 'overview' ? <OverviewTab job={shownJob} /> : null}
      {activeTab === 'applicants' ? (
        <ApplicantsTab
          applications={stagedApplicants}
          stageCounts={stageCounts}
          activeStage={activeStage}
          onStageChange={setActiveStage}
          interviews={jobInterviews}
          offerByEmail={offerByEmail}
          onOpenCandidate={setSelectedCandidate}
          onMoveStage={moveCandidate}
          onSchedule={setScheduleTarget}
          onOffer={setOfferTarget}
        />
      ) : null}
      {activeTab === 'interviews' ? (
        <InterviewsTab
          interviews={jobInterviews}
          view={interviewView}
          onViewChange={setInterviewView}
          onViewFeedback={setSelectedInterview}
          onCancel={(interview) => cancelInterview.mutate(interview.id, { onSuccess: () => showAlert('Interview cancelled', 'success') })}
          onComplete={(interview) => completeInterview.mutate({ id: interview.id, score: interview.candidateScore ?? 80 }, { onSuccess: () => showAlert('Interview completed', 'success') })}
        />
      ) : null}
      {activeTab === 'offers' ? <OffersTab offers={jobOffers} onCreate={() => setOfferTarget(jobApps[0] ?? {})} onView={setSelectedOffer} /> : null}
      {activeTab === 'analytics' ? <AnalyticsTab job={shownJob} applications={jobApps} interviews={jobInterviews} offers={jobOffers} /> : null}

      <CandidateDetailDrawer
        candidate={selectedCandidate}
        interviews={jobInterviews.filter((interview: any) => getInterviewApplicationId(interview) === selectedCandidate?.id)}
        offer={selectedCandidate ? offerByEmail.get(getCandidateEmail(selectedCandidate).toLowerCase()) : null}
        onClose={() => setSelectedCandidate(null)}
        onMoveStage={moveCandidate}
        onSchedule={setScheduleTarget}
        onOffer={setOfferTarget}
      />

      <InterviewFeedbackDrawer interview={selectedInterview} onClose={() => setSelectedInterview(null)} />
      <OfferDetailDrawer offer={selectedOffer} onClose={() => setSelectedOffer(null)} />

      <ScheduleInterviewModal
        isOpen={!!scheduleTarget}
        onClose={() => setScheduleTarget(null)}
        candidateName={getCandidateName(scheduleTarget)}
        jobTitle={shownJob.title}
        jobApplicationId={scheduleTarget?.id || ''}
        onSchedule={scheduleInterview}
        isLoading={scheduleMutation.isPending}
      />

      <OfferLetterCreateModal
        isOpen={!!offerTarget}
        onClose={() => setOfferTarget(null)}
        showAlert={showAlert}
        onSuccess={() => { setOfferTarget(null); offersQuery.refetch(); }}
        initialData={{
          candidateName: getCandidateName(offerTarget),
          candidateEmail: getCandidateEmail(offerTarget),
          candidatePhone: getCandidatePhone(offerTarget),
          positionName: shownJob.title,
          employmentType: shownJob.type,
        }}
      />

      <CreateJobModal
        isOpen={!!jobFormMode}
        onClose={() => setJobFormMode(null)}
        onCreate={submitJobForm}
        initialData={jobFormMode ? mapJobToFormData(shownJob, jobFormMode) : undefined}
      />
    </div>
  );
}

function mapJobToFormData(job: any, mode: 'edit' | 'duplicate') {
  const metadata = job.metadata || {};
  return {
    jobTitle: mode === 'duplicate' ? `${job.title || ''} Copy`.trim() : job.title || '',
    department: job.department || metadata.department || '',
    position: metadata.position || job.position || '',
    type: metadata.type || 'New Role',
    replaceFor: metadata.replaceFor || 'Not applicable',
    businessJustification: job.businessJustification || metadata.importance || '',
    employmentType: job.employmentType || job.type || 'Full-time',
    workMode: metadata.workMode || 'On-site',
    urgency: metadata.urgency || 'Medium',
    priority: job.priority || metadata.priority || 'Medium',
    neededByDate: job.neededByDate || job.dueDate || metadata.neededByDate || '',
    openings: job.headcount || job.positions || 1,
    city: metadata.city || '',
    country: metadata.country || '',
    locationType: metadata.locationType || 'On-site',
    contractType: metadata.contractType || 'Permanent',
    experienceLevel: metadata.experienceLevel || 'Mid Level',
    hiringManager: job.hiringManager || metadata.hiringManager || '',
    deadline: job.deadline || job.dueDate || '',
    description: job.description || '',
    summary: job.summary || '',
    responsibilities: job.responsibilities || metadata.responsibilities || '',
    requiredSkills: Array.isArray(job.requiredSkills || metadata.requirements) ? (job.requiredSkills || metadata.requirements).join('\n') : job.requiredSkills || metadata.requirements || '',
    preferredSkills: Array.isArray(job.preferredSkills || metadata.qualifications) ? (job.preferredSkills || metadata.qualifications).join('\n') : job.preferredSkills || metadata.qualifications || '',
    tools: metadata.tools || '',
    benefits: metadata.benefits || '',
    salaryType: metadata.salaryType || 'Not Specified',
    applicantFields: job.applicationFields || metadata.applicationFields || {
      firstName: { included: true, required: true },
      lastName: { included: true, required: true },
      email: { included: true, required: true },
      phone: { included: true, required: true },
      resumeUrl: { included: false, required: false },
      currentCompany: { included: false, required: false },
      yearsExperience: { included: false, required: false },
      linkedinUrl: { included: false, required: false },
      portfolioUrl: { included: false, required: false },
      githubUrl: { included: false, required: false },
      expectedSalary: { included: false, required: false },
      coverLetter: { included: false, required: false },
    },
    customFields: metadata.customFields || [],
  };
}

function JobList({ jobs, onOpen }: { jobs: any[]; onOpen: (jobId: string) => void }) {
  if (!jobs.length) {
    return <EmptyState title="No active postings" description="Published jobs will appear here." compact />;
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3">
        <h3 className="text-sm font-black text-slate-950">Active Jobs</h3>
        <p className="text-xs font-medium text-slate-500">Open a job to manage applicants, interviews, offers, and analytics.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3 font-black">Job title</th>
              <th className="px-4 py-3 font-black">Department</th>
              <th className="px-4 py-3 font-black">Status</th>
              <th className="px-4 py-3 font-black">Published</th>
              <th className="px-4 py-3 font-black">Due date</th>
              <th className="px-4 py-3 font-black">Applicants</th>
              <th className="px-4 py-3 font-black">Interviews</th>
              <th className="px-4 py-3 font-black">Offers</th>
              <th className="px-4 py-3 font-black">Views</th>
              <th className="px-4 py-3 text-right font-black">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {jobs.map((job) => {
              const hired = job.applications.filter((application: any) => normalizeStage(application.stage) === 'hired').length;
              const progress = job.applications.length ? Math.round((hired / job.applications.length) * 100) : 0;
              return (
                <tr key={job.id} className="hover:bg-blue-50/40">
                  <td className="px-4 py-3 font-black text-slate-950">{job.title}</td>
                  <td className="px-4 py-3 font-bold text-slate-600">{job.department || '—'}</td>
                  <td className="px-4 py-3"><StatusBadge label={job.isPosted ? 'Active' : job.status || 'Draft'} tone={job.isPosted ? 'blue' : 'slate'} /></td>
                  <td className="px-4 py-3 font-semibold text-slate-500">{fmtDate(job.publishedAt || job.createdAt)}</td>
                  <td className="px-4 py-3 font-semibold text-slate-500">{fmtDate(job.deadline || job.dueDate || job.neededByDate)}</td>
                  <td className="px-4 py-3 font-bold text-slate-700">{job.applications.length}</td>
                  <td className="px-4 py-3 font-bold text-slate-700">{job.interviews.length}</td>
                  <td className="px-4 py-3 font-bold text-slate-700">{job.offers.length}</td>
                  <td className="px-4 py-3 font-bold text-slate-700">{job.viewsCount}</td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => onOpen(job.id)} className="rounded-lg bg-blue-600 px-3 py-2 text-[11px] font-bold text-white hover:bg-blue-700">
                      Open Workspace ({progress}%)
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function JobWorkspaceHeader({ job, applicants, interviews, offers, onEdit, onDuplicate, onPause, onClose, publicUrl }: any) {
  const [menuOpen, setMenuOpen] = useState(false);
  const meta = [
    ['Department', job.department || '—'],
    ['Employment type', job.type || job.employmentType || '—'],
    ['Positions', job.positions || job.headcount || '—'],
    ['Published', fmtDate(job.publishedAt || job.createdAt)],
    ['Due date', fmtDate(job.deadline || job.dueDate || job.neededByDate)],
    ['Applicants', applicants],
    ['Interviews', interviews],
    ['Offers', offers],
    ['Views', job.viewsCount || 0],
  ];

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-black text-slate-950">{job.title}</h2>
            <StatusBadge label={job.isPosted ? 'Active' : job.status || 'Draft'} tone={job.isPosted ? 'blue' : 'slate'} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-2 text-xs sm:grid-cols-3 lg:grid-cols-5">
            {meta.map(([label, value]) => (
              <div key={label}>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
                <p className="mt-0.5 font-bold text-slate-800">{value}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative flex flex-wrap gap-2">
          <ActionButton icon={Edit3} label="Edit Job" onClick={onEdit} />
          <ActionButton icon={Eye} label="View Public Post" disabled={!publicUrl} title={!publicUrl ? 'Business slug is unavailable for this job.' : undefined} onClick={() => window.open(publicUrl, '_blank')} />
          <ActionButton icon={Copy} label="Duplicate Job" onClick={onDuplicate} />
          <ActionButton icon={PauseCircle} label="Pause Job" onClick={onPause} />
          <ActionButton icon={XCircle} label="Close Job" onClick={onClose} danger />
          <ActionButton icon={MoreHorizontal} label="More Actions" onClick={() => setMenuOpen((open) => !open)} />
          {menuOpen ? (
            <div className="absolute right-0 top-11 z-20 w-56 rounded-xl border border-slate-200 bg-white p-2 text-xs shadow-xl">
              <button type="button" onClick={() => { setMenuOpen(false); onEdit(); }} className="block w-full rounded-lg px-3 py-2 text-left font-bold text-slate-600 hover:bg-slate-50">Edit job</button>
              <button type="button" onClick={() => { setMenuOpen(false); onDuplicate(); }} className="block w-full rounded-lg px-3 py-2 text-left font-bold text-slate-600 hover:bg-slate-50">Duplicate job</button>
              <button type="button" onClick={() => { setMenuOpen(false); onPause(); }} className="block w-full rounded-lg px-3 py-2 text-left font-bold text-slate-600 hover:bg-slate-50">Pause job</button>
              <button type="button" onClick={() => { setMenuOpen(false); onClose(); }} className="block w-full rounded-lg px-3 py-2 text-left font-bold text-rose-600 hover:bg-rose-50">Close job</button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function ActionButton({ icon: Icon, label, onClick, danger, disabled, title }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-45 ${danger ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function JobWorkspaceTabs({ activeTab, onChange, counts }: { activeTab: WorkspaceTab; onChange: (tab: WorkspaceTab) => void; counts: Record<string, number> }) {
  return (
    <div className="flex gap-2 overflow-x-auto">
      {tabLabels.map((tab) => {
        const count = tab.key === 'applicants' ? counts.applicants : tab.key === 'interviews' ? counts.interviews : tab.key === 'offers' ? counts.offers : null;
        const active = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border px-3 text-xs font-black ${active ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-500 hover:text-slate-800'}`}
          >
            {tab.label}
            {count !== null ? <span className={`rounded-full px-2 py-0.5 text-[10px] ${active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

function OverviewTab({ job }: { job: any }) {
  const left = [
    ['Job Overview', job.description || job.summary],
    ['Responsibilities', job.responsibilities || job.metadata?.responsibilities],
    ['Requirements', job.requiredSkills || job.requirements || job.metadata?.requirements],
    ['Qualifications', job.preferredSkills || job.qualifications || job.metadata?.qualifications],
    ['Business Justification', job.businessJustification || job.metadata?.importance],
  ];
  const right = [
    ['Status', job.isPosted ? 'Active' : job.status || 'Draft'],
    ['Department', job.department],
    ['Employment Type', job.type || job.employmentType],
    ['Priority', job.priority],
    ['Number of Positions', job.positions || job.headcount],
    ['Published Date', fmtDate(job.publishedAt || job.createdAt)],
    ['Due Date', fmtDate(job.deadline || job.dueDate || job.neededByDate)],
    ['Expected Hiring Date', fmtDate(job.expectedHiringDate || job.neededByDate)],
    ['Hiring Manager', job.hiringManager || job.metadata?.hiringManager],
    ['Requested By', job.requestedBy?.name],
    ['Approval Status', job.approvalStageLabel || job.status],
  ];

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="space-y-4">
          {left.map(([label, value]) => (
            <div key={label}>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">{label}</h4>
              {Array.isArray(value) ? (
                value.length ? <ul className="mt-2 list-disc space-y-1 pl-5 text-sm font-medium text-slate-700">{value.map((item: any, index: number) => <li key={`${item}-${index}`}>{item}</li>)}</ul> : <p className="mt-2 text-xs font-semibold text-slate-400">No {label.toLowerCase()} provided.</p>
              ) : (
                <p className="mt-2 text-sm font-medium leading-6 text-slate-700">{value || `No ${label.toLowerCase()} provided.`}</p>
              )}
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h4 className="text-sm font-black text-slate-950">Job Summary</h4>
        <div className="mt-3 divide-y divide-slate-100">
          {right.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-4 py-2">
              <span className="text-xs font-bold text-slate-500">{label}</span>
              <span className="text-right text-xs font-black text-slate-800">{value || '—'}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ApplicantsTab({ applications, stageCounts, activeStage, onStageChange, interviews, offerByEmail, onOpenCandidate, onMoveStage, onSchedule, onOffer }: any) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-3">
        <div className="flex gap-2 overflow-x-auto">
          {stageCounts.map((stage: any) => (
            <button
              key={stage.key}
              type="button"
              onClick={() => onStageChange(stage.key)}
              className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border px-3 text-xs font-black ${activeStage === stage.key ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-500 hover:text-slate-800'}`}
            >
              {stage.label}
              <span className={`rounded-full px-2 py-0.5 text-[10px] ${activeStage === stage.key ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{stage.count}</span>
            </button>
          ))}
        </div>
      </div>
      {applications.length ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3 font-black">Candidate</th>
                <th className="px-4 py-3 font-black">Phone or Email</th>
                <th className="px-4 py-3 font-black">Current Stage</th>
                <th className="px-4 py-3 font-black">Date Applied</th>
                <th className="px-4 py-3 font-black">Experience</th>
                <th className="px-4 py-3 font-black">Salary Expectation</th>
                <th className="px-4 py-3 font-black">Available Start</th>
                <th className="px-4 py-3 font-black">Rating</th>
                <th className="px-4 py-3 font-black">Interview</th>
                <th className="px-4 py-3 font-black">Offer</th>
                <th className="px-4 py-3 text-right font-black">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {applications.map((application: any) => {
                const interview = interviews.find((item: any) => getInterviewApplicationId(item) === application.id);
                const offer = offerByEmail.get(getCandidateEmail(application).toLowerCase());
                const rating = getCandidateRating(application);
                return (
                  <tr key={application.id} className="hover:bg-blue-50/40">
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => onOpenCandidate(application)} className="flex items-center gap-2 text-left">
                        <UserAvatar name={getCandidateName(application)} size="sm" />
                        <span>
                          <span className="block font-black text-slate-950">{getCandidateName(application)}</span>
                          {rating && rating >= 4.5 ? <span className="mt-0.5 inline-flex rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-black text-emerald-700">Top Match</span> : null}
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-600">{getCandidatePhone(application) || getCandidateEmail(application) || '—'}</td>
                    <td className="px-4 py-3"><StatusPill label={normalizeStage(application.stage) || 'applied'} /></td>
                    <td className="px-4 py-3 font-semibold text-slate-500">{fmtDate(application.createdAt || application.appliedAt)}</td>
                    <td className="px-4 py-3 font-semibold text-slate-600">{application.experience || application.metadata?.experience || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-slate-600">{application.expectedSalary || application.salaryExpectation || application.metadata?.expectedSalary || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-slate-600">{fmtDate(application.availableStartDate || application.metadata?.availableStartDate)}</td>
                    <td className="px-4 py-3 font-black text-slate-800">{rating ? `${rating.toFixed(1)} / 5` : '—'}</td>
                    <td className="px-4 py-3 font-semibold text-slate-600">{interview?.status ? <StatusPill label={interview.status} /> : '—'}</td>
                    <td className="px-4 py-3 font-semibold text-slate-600">{offer?.status ? <StatusPill label={offer.status} /> : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => onOpenCandidate(application)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 font-bold text-slate-600">View</button>
                        <button type="button" onClick={() => onSchedule(application)} className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 font-bold text-blue-700">Schedule</button>
                        <button type="button" onClick={() => onMoveStage(application, 'shortlisted')} className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 font-bold text-emerald-700">Shortlist</button>
                        <button type="button" onClick={() => onMoveStage(application, 'waitlisted')} className="rounded-lg border border-slate-200 px-2.5 py-1.5 font-bold text-slate-600">Waitlist</button>
                        <button type="button" onClick={() => onMoveStage(application, 'rejected')} className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 font-bold text-rose-700">Reject</button>
                        <button type="button" onClick={() => onOffer(application)} className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 font-bold text-amber-700">Offer</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-4"><EmptyInline title="No candidates in this stage." /></div>
      )}
    </section>
  );
}

function InterviewsTab({ interviews, view, onViewChange, onViewFeedback, onCancel, onComplete }: any) {
  const rows = view === 'mine' ? interviews.filter((interview: any) => interview.assignedToMe || interview.isMine) : interviews;
  const summaries = [
    ['Scheduled', interviews.filter((item: any) => normalizeStage(item.status) === 'scheduled').length],
    ['Awaiting Candidate', interviews.filter((item: any) => normalizeStage(item.status) === 'pending_acceptance').length],
    ['Confirmed', interviews.filter((item: any) => normalizeStage(item.status) === 'accepted').length],
    ['Completed', interviews.filter((item: any) => normalizeStage(item.status) === 'completed').length],
    ['Cancelled', interviews.filter((item: any) => normalizeStage(item.status) === 'cancelled').length],
  ];

  return (
    <section className="space-y-3">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {summaries.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
            <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
          </div>
        ))}
      </div>
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-3">
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
            {(['all', 'mine'] as InterviewView[]).map((item) => (
              <button key={item} type="button" onClick={() => onViewChange(item)} className={`rounded-md px-3 py-1.5 text-xs font-black ${view === item ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}>
                {item === 'all' ? 'All Interviews' : 'Assigned to Me'}
              </button>
            ))}
          </div>
        </div>
        {rows.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-black">Candidate</th>
                  <th className="px-4 py-3 font-black">Interview Type</th>
                  <th className="px-4 py-3 font-black">Interviewer</th>
                  <th className="px-4 py-3 font-black">Date and Time</th>
                  <th className="px-4 py-3 font-black">Duration</th>
                  <th className="px-4 py-3 font-black">Session</th>
                  <th className="px-4 py-3 font-black">Status</th>
                  <th className="px-4 py-3 font-black">Rating</th>
                  <th className="px-4 py-3 text-right font-black">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((interview: any) => (
                  <tr key={interview.id} className="hover:bg-blue-50/40">
                    <td className="px-4 py-3 font-black text-slate-950">{getCandidateName(interview.JobApplication || interview)}</td>
                    <td className="px-4 py-3 font-semibold text-slate-600">{interview.type || interview.interviewType || 'Interview'}</td>
                    <td className="px-4 py-3 font-semibold text-slate-600">{interview.interviewer?.fullName || interview.interviewerName || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-slate-600">{fmtDateTime(interview.interviewAt)}</td>
                    <td className="px-4 py-3 font-semibold text-slate-600">{interview.duration || 60} min</td>
                    <td className="px-4 py-3 font-semibold text-slate-600">{interview.sessionNumber || 1}/{interview.totalSessions || 1}</td>
                    <td className="px-4 py-3"><StatusPill label={interview.status || 'scheduled'} /></td>
                    <td className="px-4 py-3 font-black text-slate-800">{interview.candidateScore ? `${Math.round((interview.candidateScore / 20) * 10) / 10} / 5` : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => onViewFeedback(interview)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 font-bold text-slate-600">View Feedback</button>
                        <button type="button" disabled={normalizeStage(interview.status) === 'completed'} onClick={() => onComplete(interview)} className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 font-bold text-emerald-700 disabled:cursor-not-allowed disabled:opacity-45">Complete</button>
                        <button type="button" disabled={['cancelled', 'completed'].includes(normalizeStage(interview.status))} onClick={() => onCancel(interview)} className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 font-bold text-rose-700 disabled:cursor-not-allowed disabled:opacity-45">Cancel</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="p-4"><EmptyInline title="No interviews match this view." /></div>}
      </section>
    </section>
  );
}

function OffersTab({ offers, onCreate, onView }: { offers: any[]; onCreate: () => void; onView: (offer: any) => void }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div>
          <h3 className="text-sm font-black text-slate-950">Offers</h3>
          <p className="text-xs font-medium text-slate-500">Offer status stays visible in the applicants table.</p>
        </div>
        <button type="button" onClick={onCreate} className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-3 text-xs font-bold text-white">
          <Send className="h-4 w-4" />
          Create Offer
        </button>
      </div>
      {offers.length ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3 font-black">Candidate</th>
                <th className="px-4 py-3 font-black">Offer Date</th>
                <th className="px-4 py-3 font-black">Proposed Salary</th>
                <th className="px-4 py-3 font-black">Employment Type</th>
                <th className="px-4 py-3 font-black">Response Deadline</th>
                <th className="px-4 py-3 font-black">Offer Status</th>
                <th className="px-4 py-3 font-black">Sent By</th>
                <th className="px-4 py-3 text-right font-black">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {offers.map((offer: any) => (
                <tr key={offer.id} className="hover:bg-blue-50/40">
                  <td className="px-4 py-3 font-black text-slate-950">{offer.candidateName || 'Candidate'}</td>
                  <td className="px-4 py-3 font-semibold text-slate-600">{fmtDate(offer.createdAt || offer.sentAt)}</td>
                  <td className="px-4 py-3 font-semibold text-slate-600">{offer.salary || '—'}</td>
                  <td className="px-4 py-3 font-semibold text-slate-600">{offer.employmentType || '—'}</td>
                  <td className="px-4 py-3 font-semibold text-slate-600">{fmtDate(offer.responseDeadline || offer.expiresAt)}</td>
                  <td className="px-4 py-3"><StatusPill label={offer.status || 'Draft'} /></td>
                  <td className="px-4 py-3 font-semibold text-slate-600">{offer.sentBy?.fullName || offer.senderName || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => onView(offer)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 font-bold text-slate-600">View Offer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <div className="p-4"><EmptyInline title="No offers have been created for this job." /></div>}
    </section>
  );
}

function AnalyticsTab({ job, applications, interviews, offers }: any) {
  const hires = applications.filter((application: any) => normalizeStage(application.stage) === 'hired').length;
  const shortlisted = applications.filter((application: any) => ['shortlisted', 'waitlisted'].includes(normalizeStage(application.stage))).length;
  const metrics = [
    ['Job Views', job.viewsCount || 0],
    ['Applications', applications.length],
    ['Interviews', interviews.length],
    ['Shortlisted', shortlisted],
    ['Offers', offers.length],
    ['Hires', hires],
    ['View-to-Application', job.viewsCount ? `${Math.round((applications.length / job.viewsCount) * 100)}%` : '—'],
    ['Application-to-Interview', applications.length ? `${Math.round((interviews.length / applications.length) * 100)}%` : '—'],
    ['Interview-to-Offer', interviews.length ? `${Math.round((offers.length / interviews.length) * 100)}%` : '—'],
    ['Time to Fill', hires ? 'Filled' : 'Open'],
  ];

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {metrics.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
            <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
          </div>
        ))}
      </div>
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-black text-slate-950">Candidate Pipeline by Stage</h3>
        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-4">
          {stageTabs.map((stage) => {
            const count = applications.filter((application: any) => stage.stages.includes(normalizeStage(application.stage) as never)).length;
            return (
              <div key={stage.key} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-bold text-slate-500">{stage.label}</p>
                <p className="mt-1 text-xl font-black text-slate-950">{count}</p>
              </div>
            );
          })}
        </div>
      </section>
    </section>
  );
}

function CandidateDetailDrawer({ candidate, interviews, offer, onClose, onMoveStage, onSchedule, onOffer }: any) {
  if (!candidate) return null;
  const timeline = [
    { label: 'Applied', date: candidate.createdAt || candidate.appliedAt },
    ...interviews.map((interview: any) => ({ label: `Interview ${interview.status || 'scheduled'}`, date: interview.interviewAt })),
    offer ? { label: `Offer ${offer.status}`, date: offer.sentAt || offer.createdAt } : null,
  ].filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/30">
      <aside className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white px-5 py-4">
          <div>
            <h3 className="text-lg font-black text-slate-950">{getCandidateName(candidate)}</h3>
            <p className="text-xs font-semibold text-slate-500">{getCandidateEmail(candidate) || getCandidatePhone(candidate) || 'No contact provided'}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4 p-5">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => onSchedule(candidate)} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white">Schedule Interview</button>
            <button type="button" onClick={() => onMoveStage(candidate, 'shortlisted')} className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">Shortlist</button>
            <button type="button" onClick={() => onMoveStage(candidate, 'rejected')} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">Reject</button>
            <button type="button" onClick={() => onOffer(candidate)} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">Send Offer</button>
          </div>
          <DetailGrid rows={[
            ['Current Stage', normalizeStage(candidate.stage) || 'applied'],
            ['Experience', candidate.experience || candidate.metadata?.experience || '—'],
            ['Salary Expectation', candidate.expectedSalary || candidate.salaryExpectation || candidate.metadata?.expectedSalary || '—'],
            ['Available Start Date', fmtDate(candidate.availableStartDate || candidate.metadata?.availableStartDate)],
            ['Rating', getCandidateRating(candidate) ? `${getCandidateRating(candidate)?.toFixed(1)} / 5` : '—'],
            ['Offer Status', offer?.status || '—'],
          ]} />
          <DrawerSection title="Application Answers" value={candidate.answers || candidate.metadata?.answers || candidate.metadata} />
          <DrawerSection title="Interview History" value={interviews.length ? interviews.map((interview: any) => `${fmtDateTime(interview.interviewAt)} - ${interview.status || 'scheduled'}`).join('\n') : ''} />
          <DrawerSection title="Offer History" value={offer ? `${offer.status || 'Draft'} - ${fmtDate(offer.createdAt || offer.sentAt)}` : ''} />
          <DrawerSection title="Activity Timeline" value={timeline.map((item: any) => `${item.label}: ${fmtDateTime(item.date)}`).join('\n')} />
        </div>
      </aside>
    </div>
  );
}

function DetailGrid({ rows }: { rows: Array<[string, any]> }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
          <p className="mt-1 text-xs font-bold text-slate-800">{value || '—'}</p>
        </div>
      ))}
    </div>
  );
}

function DrawerSection({ title, value }: { title: string; value: any }) {
  const display = typeof value === 'string' ? value : value ? JSON.stringify(value, null, 2) : '';
  return (
    <section className="rounded-xl border border-slate-200 p-4">
      <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">{title}</h4>
      {display ? <pre className="mt-2 whitespace-pre-wrap text-xs font-medium leading-5 text-slate-700">{display}</pre> : <p className="mt-2 text-xs font-semibold text-slate-400">No {title.toLowerCase()} recorded.</p>}
    </section>
  );
}

function InterviewFeedbackDrawer({ interview, onClose }: { interview: any; onClose: () => void }) {
  if (!interview) return null;
  const candidate = interview.JobApplication || interview;
  const score = interview.candidateScore ? `${Math.round((interview.candidateScore / 20) * 10) / 10} / 5` : '—';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/30">
      <aside className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white px-5 py-4">
          <div>
            <h3 className="text-lg font-black text-slate-950">Interview Feedback</h3>
            <p className="text-xs font-semibold text-slate-500">{getCandidateName(candidate)} · {fmtDateTime(interview.interviewAt)}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4 p-5">
          <DetailGrid rows={[
            ['Interview Type', interview.type || interview.interviewType || 'Interview'],
            ['Duration', `${interview.duration || 60} min`],
            ['Session', `${interview.sessionNumber || 1}/${interview.totalSessions || 1}`],
            ['Status', interview.status || 'scheduled'],
            ['Rating', score],
            ['Recommendation', interview.recommendation || interview.feedback?.recommendation || '—'],
          ]} />
          <DrawerSection title="Skills Evaluation" value={interview.skillRatings || interview.feedback?.skillRatings || interview.skills} />
          <DrawerSection title="Interview Questions" value={interview.questions || interview.feedback?.questions} />
          <DrawerSection title="Candidate Responses or Notes" value={interview.notes || interview.feedback?.notes || interview.additionalNotes} />
          <DrawerSection title="Private Interview Notes" value={interview.privateNotes || interview.feedback?.privateNotes} />
        </div>
      </aside>
    </div>
  );
}

function OfferDetailDrawer({ offer, onClose }: { offer: any; onClose: () => void }) {
  if (!offer) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/30">
      <aside className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white px-5 py-4">
          <div>
            <h3 className="text-lg font-black text-slate-950">Offer Details</h3>
            <p className="text-xs font-semibold text-slate-500">{offer.candidateName || 'Candidate'} · {offer.candidateEmail || 'No email'}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4 p-5">
          <DetailGrid rows={[
            ['Offer Status', offer.status || 'Draft'],
            ['Offer Date', fmtDate(offer.createdAt || offer.sentAt)],
            ['Proposed Salary', offer.salary || '—'],
            ['Employment Type', offer.employmentType || '—'],
            ['Response Deadline', fmtDate(offer.responseDeadline || offer.expiresAt)],
            ['Sent By', offer.sentBy?.fullName || offer.senderName || '—'],
          ]} />
          {offer.renderedHtml ? (
            <section className="rounded-xl border border-slate-200 p-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">Rendered Offer</h4>
              <div className="mt-3 max-h-[520px] overflow-y-auto rounded-lg bg-slate-50 p-4 text-sm text-slate-700" dangerouslySetInnerHTML={{ __html: offer.renderedHtml }} />
            </section>
          ) : (
            <DrawerSection title="Offer Payload" value={offer} />
          )}
        </div>
      </aside>
    </div>
  );
}

function StatusPill({ label }: { label: string }) {
  const normalized = normalizeStage(label);
  const tone = normalized.includes('reject') || normalized.includes('cancel')
    ? 'bg-rose-50 text-rose-700 border-rose-100'
    : normalized.includes('hire') || normalized.includes('accept') || normalized.includes('complete')
      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
      : normalized.includes('offer') || normalized.includes('pending')
        ? 'bg-amber-50 text-amber-700 border-amber-100'
        : 'bg-blue-50 text-blue-700 border-blue-100';
  return <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-black capitalize ${tone}`}>{normalized.replace(/_/g, ' ') || 'applied'}</span>;
}
