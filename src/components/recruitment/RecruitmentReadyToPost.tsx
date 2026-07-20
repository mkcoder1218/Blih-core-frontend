/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataTable, EmptyState, StatusBadge } from '@/components/ui/blih';
import { CheckCircle, Edit3, Eye, EyeOff, Send, X } from 'lucide-react';
import { useState } from 'react';
import { JobRequest } from '../../types';

interface RecruitmentReadyToPostProps {
  jobs: JobRequest[];
  onPostSuccess: (jobTitle: string, jobId: string) => void;
  onEditClick: (job: JobRequest) => void;
}

// Normalize requirements/qualifications which may arrive as string or array
function toArr(v: unknown): string[] {
  if (Array.isArray(v)) return v as string[];
  if (typeof v === 'string' && v.trim()) return v.split(/[,\n]+/).map((s) => s.trim()).filter(Boolean);
  return [];
}

const TABLE_COLS = ['Position', 'Department', 'Type', 'Priority', 'Positions', 'Requested By', 'Actions'];

export default function RecruitmentReadyToPost({ jobs, onPostSuccess, onEditClick }: RecruitmentReadyToPostProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
    setPreviewId(null);
  };

  const togglePreview = (id: string) => {
    setPreviewId((prev) => (prev === id ? null : id));
    setExpandedId(id);
  };

  if (!jobs.length) {
    return (
      <EmptyState
        icon={<CheckCircle />}
        title="No jobs ready to post"
        description="Fully approved vacancy requests will appear here for final publishing."
      />
    );
  }

  return (
    <div id="ready-to-post-view" className="space-y-4">
      <DataTable
        title="Ready to Post"
        subtitle={`${jobs.length} approved ${jobs.length === 1 ? 'job' : 'jobs'} awaiting publishing`}
        columns={TABLE_COLS}
        rows={jobs}
        renderRow={(job) => {
          const isExpanded = expandedId === job.id;
          const isPreviewing = previewId === job.id;
          const requirements = toArr(job.requirements);
          const qualifications = toArr(job.qualifications);

          return (
            <>
              {/* Main row */}
              <tr
                key={job.id}
                className={`border-b border-slate-100 transition-colors cursor-pointer ${
                  isExpanded ? 'bg-blue-50/40' : 'hover:bg-slate-50/60'
                }`}
                onClick={() => toggleExpand(job.id)}
              >
                {/* Position */}
                <td className="px-4 py-3">
                  <p className="text-xs font-black text-slate-900 leading-tight">{job.title}</p>
                  <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{job.positions} position{Number(job.positions) !== 1 ? 's' : ''}</p>
                </td>

                {/* Department */}
                <td className="px-4 py-3">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {job.department}
                  </span>
                </td>

                {/* Type */}
                <td className="px-4 py-3 text-xs font-semibold text-slate-600">{job.type}</td>

                {/* Priority */}
                <td className="px-4 py-3">
                  <StatusBadge
                    label={job.priority || 'Normal'}
                    tone={job.priority === 'High' ? 'rose' : job.priority === 'Low' ? 'slate' : 'amber'}
                  />
                </td>

                {/* Positions count */}
                <td className="px-4 py-3 text-xs font-bold text-slate-700">{job.positions}</td>

                {/* Requested By */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                      {job.requestedBy?.avatar || job.requestedBy?.name?.charAt(0) || '?'}
                    </div>
                    <span className="text-xs font-semibold text-slate-700 truncate max-w-[120px]">
                      {job.requestedBy?.name || '—'}
                    </span>
                  </div>
                </td>

                {/* Actions */}
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      title="Preview posting"
                      onClick={() => togglePreview(job.id)}
                      className={`inline-flex h-7 items-center gap-1 rounded-lg border px-2 text-[11px] font-bold transition-colors ${
                        isPreviewing
                          ? 'border-blue-200 bg-blue-50 text-blue-600'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {isPreviewing ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      Preview
                    </button>
                    <button
                      type="button"
                      title="Edit job"
                      onClick={() => onEditClick(job)}
                      className="inline-flex h-7 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-bold text-slate-600 transition-colors hover:bg-slate-50"
                    >
                      <Edit3 className="h-3 w-3" />
                      Edit
                    </button>
                    <button
                      type="button"
                      title="Post job"
                      onClick={() => onPostSuccess(job.title, job.id)}
                      className="inline-flex h-7 items-center gap-1 rounded-lg bg-blue-600 px-2 text-[11px] font-bold text-white transition-colors hover:bg-blue-700"
                    >
                      <Send className="h-3 w-3" />
                      Post
                    </button>
                  </div>
                </td>
              </tr>

              {/* Expanded detail panel */}
              {isExpanded && (
                <tr key={`${job.id}-detail`}>
                  <td colSpan={TABLE_COLS.length} className="bg-slate-50/70 px-5 py-4 border-b border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        {isPreviewing ? 'Candidate-facing preview' : 'Job details'}
                      </p>
                      <button
                        type="button"
                        onClick={() => toggleExpand(job.id)}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {isPreviewing ? (
                      /* Dark preview card */
                      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl space-y-5 relative overflow-hidden max-w-3xl">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl" />
                        <div className="relative z-10">
                          <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest bg-blue-900/40 px-2.5 py-1 rounded-full">
                            Live Preview
                          </span>
                          <h3 className="text-xl font-black mt-3 tracking-tight">{job.title}</h3>
                          <p className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-wider">
                            {job.department} &bull; {job.type}
                          </p>
                        </div>
                        <div className="space-y-4 text-xs text-slate-300 leading-relaxed border-t border-white/10 pt-4 relative z-10">
                          {job.overview && (
                            <div>
                              <h5 className="font-bold text-white text-sm mb-1">Role Description</h5>
                              <p>{job.overview}</p>
                            </div>
                          )}
                          {requirements.length > 0 && (
                            <div>
                              <h5 className="font-bold text-white text-sm mb-1">Key Requirements</h5>
                              <ul className="list-disc pl-5 space-y-1">
                                {requirements.map((req, i) => <li key={i}>{req}</li>)}
                              </ul>
                            </div>
                          )}
                          {qualifications.length > 0 && (
                            <div>
                              <h5 className="font-bold text-white text-sm mb-1">Preferred Qualifications</h5>
                              <ul className="list-disc pl-5 space-y-1">
                                {qualifications.map((qual, i) => <li key={i}>{qual}</li>)}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Detail info grid */
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                        {/* Left: meta + overview */}
                        <div className="space-y-4">
                          <div className="grid grid-cols-3 gap-3">
                            {[
                              { label: 'Priority', value: job.priority || '—' },
                              { label: 'Due Date', value: job.dueDate || '—' },
                              { label: 'Date Requested', value: job.requestedDate || '—' },
                            ].map(({ label, value }) => (
                              <div key={label} className="bg-white rounded-xl border border-slate-100 px-3 py-2">
                                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                                <p className="mt-1 text-xs font-bold text-slate-800 truncate">{value}</p>
                              </div>
                            ))}
                          </div>
                          {job.overview && (
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Overview</p>
                              <p className="text-xs font-medium leading-relaxed text-slate-600 bg-white rounded-xl border border-slate-100 p-3">
                                {job.overview}
                              </p>
                            </div>
                          )}
                          {requirements.length > 0 && (
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Requirements</p>
                              <ul className="space-y-1.5">
                                {requirements.map((req, i) => (
                                  <li key={i} className="flex items-start gap-2 text-xs font-medium text-slate-600">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                                    {req}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* Right: qualifications + importance */}
                        <div className="space-y-4">
                          {qualifications.length > 0 && (
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Qualifications</p>
                              <ul className="space-y-1.5">
                                {qualifications.map((qual, i) => (
                                  <li key={i} className="flex items-start gap-2 text-xs font-medium text-slate-600">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                                    {qual}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {job.importance && (
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Importance of this Hire</p>
                              <p className="text-xs font-medium italic leading-relaxed text-slate-500 bg-white rounded-xl border border-slate-100 p-3">
                                {job.importance}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </>
          );
        }}
      />
    </div>
  );
}
