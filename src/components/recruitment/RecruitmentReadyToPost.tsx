/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { JobRequest } from '../../types';
import { Sparkles, Eye, Edit3, Send, CheckCircle } from 'lucide-react';
import { EmptyState } from '@/components/ui/blih';

interface RecruitmentReadyToPostProps {
  jobs: JobRequest[];
  onPostSuccess: (jobTitle: string, jobId: string) => void;
  onEditClick: (job: JobRequest) => void;
}

export default function RecruitmentReadyToPost({ jobs, onPostSuccess, onEditClick }: RecruitmentReadyToPostProps) {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(jobs[0]?.id || null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const activeJob = jobs.find(j => j.id === selectedJobId) || jobs[0];

  // Normalize to arrays defensively — API may return strings or null
  const toArr = (v: any): string[] => {
    if (Array.isArray(v)) return v;
    if (typeof v === 'string' && v.trim()) return v.split(/[,\n]+/).map(s => s.trim()).filter(Boolean);
    return [];
  };
  const requirements = toArr(activeJob?.requirements);
  const qualifications = toArr(activeJob?.qualifications);

  const handlePublish = () => {
    if (activeJob) {
      onPostSuccess(activeJob.title, activeJob.id);
    }
  };

  if (!activeJob) {
    return (
      <EmptyState
        icon={<CheckCircle />}
        title="No jobs ready to post"
        description="Fully approved vacancy requests will appear here for final publishing."
      />
    );
  }

  return (
    <div id="ready-to-post-view" className="space-y-6">
      {/* Title & Selector if multiple */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h4 className="text-[14px] font-bold text-slate-900 tracking-tight">Jobs Ready to Post</h4>
          <p className="text-[11px] text-slate-400 font-medium">Review and publish approved job postings</p>
        </div>
        
        {jobs.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {jobs.map(j => (
              <button
                key={j.id}
                onClick={() => setSelectedJobId(j.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border ${
                  activeJob.id === j.id 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100' 
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                }`}
              >
                {j.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {isPreviewMode ? (
        /* Preview visual card mode */
        <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-xl max-w-3xl mx-auto space-y-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl" />
          <div className="flex justify-between items-start relative z-10">
            <div>
              <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest bg-blue-900/40 px-2.5 py-1 rounded-full">
                Live Preview
              </span>
              <h3 className="text-2xl font-black mt-3 tracking-tight">{activeJob.title}</h3>
              <p className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-wider">
                {activeJob.department} &bull; {activeJob.type}
              </p>
            </div>
            <button
              onClick={() => setIsPreviewMode(false)}
              className="text-slate-400 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 transition-all cursor-pointer"
            >
              Back to Details
            </button>
          </div>

          <div className="space-y-4 text-xs text-slate-300 leading-relaxed border-t border-white/10 pt-5 relative z-10">
            <div>
              <h5 className="font-bold text-white text-sm mb-1">Role Description</h5>
              <p>{activeJob.overview}</p>
            </div>
            {requirements.length > 0 && (
              <div>
                <h5 className="font-bold text-white text-sm mb-1">Key Requirements</h5>
                <ul className="list-disc pl-5 space-y-1">
                  {requirements.map((req, i) => (
                    <li key={i}>{req}</li>
                  ))}
                </ul>
              </div>
            )}
            {qualifications.length > 0 && (
              <div>
                <h5 className="font-bold text-white text-sm mb-1">Preferred Qualifications</h5>
                <ul className="list-disc pl-5 space-y-1">
                  {qualifications.map((qual, i) => (
                    <li key={i}>{qual}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Detailed card layout (Matches Screenshot) */
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-400">
          {/* Header Card row */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-50 pb-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">{activeJob.title}</h3>
                <span className="bg-slate-100 text-[10px] text-slate-600 font-bold px-2 py-0.5 rounded">Senior</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-500 font-semibold">
                <span className="text-[#1a56db] bg-blue-50 px-2 py-0.5 rounded font-extrabold uppercase text-[10px] tracking-wider">
                  {activeJob.department}
                </span>
                <span>&bull;</span>
                <span>{activeJob.type}</span>
                <span>&bull;</span>
                <span>{activeJob.positions} Position</span>
              </div>
            </div>

            <button
              onClick={handlePublish}
              className="bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-semibold rounded-xl text-xs px-4.5 py-3 flex items-center gap-2 shadow-xs hover:shadow-md transition-all self-start sm:self-auto cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Post Job</span>
            </button>
          </div>

          {/* Job Request Details Panel */}
          <div className="bg-slate-50/70 rounded-2xl border border-slate-100 p-5">
            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 font-sans">
              Job Request Details
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <span className="block text-[9px] text-slate-400 uppercase tracking-wider font-bold mb-1">Priority</span>
                <span className="text-[10px] bg-white text-blue-600 font-bold uppercase tracking-widest px-2.5 py-0.5 border border-blue-100 rounded-lg shadow-sm">
                  {activeJob.priority}
                </span>
              </div>
              <div>
                <span className="block text-[9px] text-slate-400 uppercase tracking-wider font-bold mb-1">Due Date</span>
                <span className="text-[11px] text-slate-700 font-bold">{activeJob.dueDate}</span>
              </div>
              <div>
                <span className="block text-[9px] text-slate-400 uppercase tracking-wider font-bold mb-1">Expected Date</span>
                <span className="text-[11px] text-slate-700 font-bold">{activeJob.expectedDate}</span>
              </div>
              <div>
                <span className="block text-[9px] text-slate-400 uppercase tracking-wider font-bold mb-1">Date Requested</span>
                <span className="text-[11px] text-slate-700 font-bold">{activeJob.requestedDate}</span>
              </div>
            </div>

            {/* Requested By Profile banner */}
            <div className="mt-5 border-t border-slate-150 pt-4 flex items-center gap-3">
              <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Requested By</span>
              <div className="flex items-center gap-2.5 bg-white border border-slate-100 rounded-xl py-1.5 px-3 shadow-sm">
                <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                  {activeJob.requestedBy?.avatar}
                </div>
                <div>
                  <h6 className="text-[11px] font-bold text-slate-900 leading-none">{activeJob.requestedBy?.name}</h6>
                  <span className="text-[9px] text-[#2563eb] font-extrabold uppercase mt-0.5 tracking-wider block">
                    {activeJob.requestedBy?.dept}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Double Column content: Overview, Requirements, Qualifications */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-[12px] text-slate-600 pt-2 font-medium">
            {/* Left Column */}
            <div className="space-y-6">
              <div>
                <h5 className="font-extrabold text-slate-900 uppercase text-[10px] tracking-widest mb-3 border-b border-slate-50 pb-1 w-fit">
                  Job Overview
                </h5>
                <p className="leading-relaxed font-medium bg-slate-50/40 p-3 rounded-xl border border-slate-100/50 text-slate-600">
                  {activeJob.overview}
                </p>
              </div>

              <div>
                <h5 className="font-extrabold text-slate-900 uppercase text-[10px] tracking-widest mb-3 border-b border-slate-50 pb-1 w-fit">
                  Requirements
                </h5>
                <ul className="space-y-2.5">
                  {requirements.map((req, index) => (
                    <li key={index} className="flex items-start gap-2.5 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                      <span className="text-[11px]">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div>
                <h5 className="font-extrabold text-slate-900 uppercase text-[10px] tracking-widest mb-3 border-b border-slate-50 pb-1 w-fit">
                  Qualifications
                </h5>
                <ul className="space-y-2.5">
                  {qualifications.map((qual, index) => (
                    <li key={index} className="flex items-start gap-2.5 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                      <span className="text-[11px]">{qual}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h5 className="font-extrabold text-slate-900 uppercase text-[10px] tracking-widest mb-3 border-b border-slate-50 pb-1 w-fit">
                  Importance of this Hire
                </h5>
                <p className="leading-relaxed text-slate-500 italic bg-slate-50/40 p-3 rounded-xl border border-slate-100/50 font-medium text-[11px]">
                  {activeJob.importance}
                </p>
              </div>
            </div>
          </div>

          {/* Action Footer options */}
          <div className="flex gap-3 pt-4 border-t border-slate-50">
            <button
              onClick={() => setIsPreviewMode(true)}
              className="flex-1 bg-white border border-slate-200 hover:border-blue-500 hover:bg-slate-50 text-blue-600 font-bold rounded-xl text-[11px] py-3 flex items-center justify-center gap-2 cursor-pointer transition-all select-none"
            >
              <Eye className="w-4 h-4" />
              <span>Preview</span>
            </button>
            <button
              onClick={() => onEditClick(activeJob)}
              className="flex-1 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-[11px] py-3 flex items-center justify-center gap-2 cursor-pointer transition-all select-none"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Job</span>
            </button>
          </div>
        </div>
      )}

      {/* Placeholder at the bottom */}
      {jobs.length > 1 && (
        <div className="border border-slate-100 bg-slate-50/40 rounded-2xl p-4 text-center">
          <span className="text-[9px] text-slate-400 font-black block uppercase tracking-widest">
            {jobs.length - 1} other approved {jobs.length - 1 === 1 ? 'job' : 'jobs'} waiting in queue
          </span>
        </div>
      )}
    </div>
  );
}
