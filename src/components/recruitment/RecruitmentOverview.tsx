/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import {
  jobApplicationFrequencyData,
  marketingManagerPostAnalytics,
  fullStackPostAnalytics,
  frequentlyPostedJobs
} from '../../mockData';
import { Sparkles, Calendar, TrendingUp, Users, ArrowUpRight } from 'lucide-react';

interface RecruitmentOverviewProps {
  onNavigateToTab: (tabId: string) => void;
}

export default function RecruitmentOverview({ onNavigateToTab }: RecruitmentOverviewProps) {
  const [selectedJob, setSelectedJob] = useState<'Marketing Manager' | 'Full-stack Developer'>('Marketing Manager');
  const [hoveredFreqPoint, setHoveredFreqPoint] = useState<number | null>(null);
  const [hoveredAnalyticPoint, setHoveredAnalyticPoint] = useState<number | null>(null);

  // Convert points to smooth SVG path
  const getCurvePath = (data: { count: number }[], height: number, width: number, maxVal: number) => {
    if (data.length === 0) return '';
    const points = data.map((item, index) => {
      const x = (index / (data.length - 1)) * (width - 40) + 20;
      // Flip Y axis
      const y = height - (item.count / maxVal) * (height - 40) - 20;
      return { x, y };
    });

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 3;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (2 * (p1.x - p0.x)) / 3;
      const cpY2 = p1.y;
      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
    return { path, points };
  };

  // 1. Job Application Frequency charts
  const freqHeight = 160;
  const freqWidth = 600;
  const freqMax = 180;
  const freqPathInfo = getCurvePath(jobApplicationFrequencyData, freqHeight, freqWidth, freqMax);

  // Secondary density curve representing layered details below
  const layerData = jobApplicationFrequencyData.map(v => ({ count: v.count * 0.4 }));
  const layerPathInfo = getCurvePath(layerData, freqHeight, freqWidth, freqMax);

  // 2. Selected Job Post Analytics (Marketing Manager or Full Stack)
  const currentPostData = selectedJob === 'Marketing Manager' ? marketingManagerPostAnalytics : fullStackPostAnalytics;
  const analyticHeight = 160;
  const analyticWidth = 600;
  const analyticMax = 180;
  const analyticPathInfo = getCurvePath(currentPostData, analyticHeight, analyticWidth, analyticMax);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div id="recruitment-overview-view" className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Requests</p>
            <h3 className="text-3xl font-extrabold text-[#111827] mt-1.5 tracking-tight">45</h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Recruitments</p>
            <h3 className="text-3xl font-extrabold text-[#111827] mt-1.5 tracking-tight">28</h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center text-sky-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Employees</p>
            <h3 className="text-3xl font-extrabold text-[#111827] mt-1.5 tracking-tight">12</h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Graph: Job Application Frequency */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
        <h4 className="text-[13px] font-bold text-slate-800 uppercase tracking-tight mb-4">
          Job Application Frequency
        </h4>

        {/* Dynamic High-Polished SVG Spline Chart */}
        <div className="relative overflow-x-auto">
          <div className="min-w-[620px] relative">
            <svg viewBox={`0 0 ${freqWidth} ${freqHeight}`} className="w-full h-auto overflow-visible select-none">
              {/* Grid Lines */}
              {[45, 90, 135, 180].map((val) => {
                const y = freqHeight - (val / freqMax) * (freqHeight - 40) - 20;
                return (
                  <g key={val}>
                    <line
                      x1="20"
                      y1={y}
                      x2={freqWidth - 20}
                      y2={y}
                      stroke="#f1f5f9"
                      strokeWidth="1"
                      strokeDasharray="4"
                    />
                    <text
                      x="0"
                      y={y + 4}
                      fill="#94a3b8"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Density Shadow Filled Area */}
              {layerPathInfo && (
                <path
                  d={`${layerPathInfo.path} L ${freqWidth - 20} ${freqHeight - 20} L 20 ${freqHeight - 20} Z`}
                  fill="url(#freqGradientBlue)"
                  className="opacity-40"
                />
              )}

              {/* Main Area under the line */}
              {freqPathInfo && (
                <path
                  d={`${freqPathInfo.path} L ${freqWidth - 20} ${freqHeight - 20} L 20 ${freqHeight - 20} Z`}
                  fill="url(#freqGradientLight)"
                  className="opacity-25"
                />
              )}

              {/* Main Line spline */}
              {freqPathInfo && (
                <path
                  d={freqPathInfo.path}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              )}

              {/* Spark Points and Hover States */}
              {freqPathInfo &&
                freqPathInfo.points.map((pt, idx) => (
                  <g key={idx}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="4"
                      className="fill-blue-600 stroke-white cursor-pointer hover:r-5.5 transition-all"
                      strokeWidth="1.5"
                      onMouseEnter={() => setHoveredFreqPoint(idx)}
                      onMouseLeave={() => setHoveredFreqPoint(null)}
                    />
                    <text
                      x={pt.x}
                      y={freqHeight - 4}
                      fill="#64748b"
                      fontSize="9"
                      fontWeight="600"
                      textAnchor="middle"
                    >
                      {months[idx]}
                    </text>
                  </g>
                ))}

              {/* Gradients declaration */}
              <defs>
                <linearGradient id="freqGradientLight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="freqGradientBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1e40af" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#1e40af" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>

            {/* Custom Tooltip */}
            {hoveredFreqPoint !== null && (
              <div
                className="absolute bg-slate-900 text-white rounded-lg p-2 text-[10px] font-bold shadow-lg pointer-events-none transition-all duration-150 border border-slate-800"
                style={{
                  left: `${(hoveredFreqPoint / (jobApplicationFrequencyData.length - 1)) * 94 + 3}%`,
                  bottom: '60px',
                  transform: 'translateX(-50%)',
                }}
              >
                <span className="block text-[#93c5fd] uppercase text-[8px] tracking-wider mb-0.5">
                  {months[hoveredFreqPoint]} applications
                </span>
                <span className="text-sm font-extrabold">{jobApplicationFrequencyData[hoveredFreqPoint].count}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Middle Grid: Frequently Posted Jobs & Analytics Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Frequently Posted Jobs Column */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
          <h4 className="text-[13px] font-bold text-slate-800 uppercase tracking-tight mb-5">
            Frequently Posted Jobs
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-4">
            {frequentlyPostedJobs.map((job) => (
              <div key={job.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col justify-between">
                <p className="text-[10px] font-bold text-slate-500 leading-tight uppercase line-clamp-2">
                  {job.title}
                </p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold text-blue-600">{job.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Analytics interactive Card selector */}
        <div className="lg:col-span-5 bg-[#f0f5ff] rounded-2xl border border-blue-100 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-xs">
                <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
              </span>
              <h4 className="text-[13px] font-extrabold text-[#1e40af] tracking-tight">
                Analytics for Jobs
              </h4>
            </div>
            <p className="text-[11px] text-slate-500 font-semibold mb-6">
              Track posting frequency trends, click rates and performance metrics over the last calendar year.
            </p>
          </div>

          <div className="space-y-1.5 focus-within:text-blue-600">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Choose job</label>
            <select
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value as any)}
              className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-4 py-3 text-xs text-slate-800 font-semibold focus:outline-none transition-all shadow-xs cursor-pointer"
            >
              <option value="Marketing Manager">Marketing Manager</option>
              <option value="Full-stack Developer">Full-stack Developer</option>
            </select>
          </div>
        </div>
      </div>

      {/* Selected Job Spline Statistics */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
        <h4 className="text-[13px] font-bold text-slate-800 uppercase tracking-tight mb-4">
          {selectedJob} Post Analytics
        </h4>

        {/* Second SVG Spline Chart */}
        <div className="relative overflow-x-auto">
          <div className="min-w-[620px] relative">
            <svg viewBox={`0 0 ${analyticWidth} ${analyticHeight}`} className="w-full h-auto overflow-visible select-none animate-fade-in">
              {/* Grid Lines */}
              {[45, 90, 135, 180].map((val) => {
                const y = analyticHeight - (val / analyticMax) * (analyticHeight - 40) - 20;
                return (
                  <g key={val}>
                    <line
                      x1="20"
                      y1={y}
                      x2={analyticWidth - 20}
                      y2={y}
                      stroke="#f1f5f9"
                      strokeWidth="1"
                      strokeDasharray="4"
                    />
                    <text
                      x="0"
                      y={y + 4}
                      fill="#94a3b8"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Main Line spline */}
              {analyticPathInfo && (
                <path
                  d={analyticPathInfo.path}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              )}

              {/* Spark Points */}
              {analyticPathInfo &&
                analyticPathInfo.points.map((pt, idx) => (
                  <g key={idx}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="4.5"
                      className="fill-blue-500 stroke-white cursor-pointer hover:r-6.5 transition-all"
                      strokeWidth="1.5"
                      onMouseEnter={() => setHoveredAnalyticPoint(idx)}
                      onMouseLeave={() => setHoveredAnalyticPoint(null)}
                    />
                    <text
                      x={pt.x}
                      y={analyticHeight - 4}
                      fill="#64748b"
                      fontSize="9"
                      fontWeight="600"
                      textAnchor="middle"
                    >
                      {months[idx]}
                    </text>
                  </g>
                ))}
            </svg>

            {/* Custom Tooltip */}
            {hoveredAnalyticPoint !== null && (
              <div
                className="absolute bg-slate-900 text-white rounded-lg p-2 text-[10px] font-bold shadow-md pointer-events-none transition-all duration-150"
                style={{
                  left: `${(hoveredAnalyticPoint / (currentPostData.length - 1)) * 94 + 3}%`,
                  bottom: '60px',
                  transform: 'translateX(-50%)',
                }}
              >
                <span className="block text-slate-400 text-[8px] uppercase tracking-wider">
                  Post analytics {months[hoveredAnalyticPoint]}
                </span>
                <span className="text-sm font-extrabold">{currentPostData[hoveredAnalyticPoint].count} Posts</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row of 3 mini high-contrast demographic metric widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Salary Expectations Mini Bar Chart */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between">
          <h5 className="text-[12px] font-bold text-slate-800 uppercase tracking-tight mb-4">
            Salary Expectations
          </h5>
          <div className="h-32 flex items-end justify-between gap-3 px-2">
            {[
              { val: 30, pct: '30%', label: '<10k', color: 'bg-blue-400' },
              { val: 60, pct: '45%', label: '10-15k', color: 'bg-blue-600' },
              { val: 50, pct: '40%', label: '15-20k', color: 'bg-lime-400' },
              { val: 18, pct: '15%', label: '>20k', color: 'bg-yellow-400' },
            ].map((sal, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <span className="text-[9px] font-bold text-slate-500">{sal.pct}</span>
                <div
                  className={`w-full rounded-md ${sal.color} transition-all duration-500 hover:opacity-90`}
                  style={{ height: `${sal.val}%` }}
                />
                <span className="text-[9px] text-slate-400 font-bold tracking-tight uppercase leading-none mt-1">
                  {sal.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Gender Distribution Pie Arc Chart */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between">
          <h5 className="text-[12px] font-bold text-slate-800 uppercase tracking-tight mb-3">
            Gender Distribution
          </h5>
          <div className="flex flex-col items-center justify-center py-2">
            {/* Custom SVG Arc representation */}
            <div className="relative w-24 h-24 mb-3 flex items-center justify-center">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#60a5fa" strokeWidth="3" />
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="3.2"
                  strokeDasharray="46 100"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-xs font-extrabold text-slate-800">46%</span>
                <span className="text-[8px] font-bold text-slate-400 block uppercase leading-tight">Male</span>
              </div>
            </div>
            {/* Legend buttons */}
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#2563eb]" />
                <span className="text-[10px] text-slate-500 font-semibold">Male: 46%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#60a5fa]" />
                <span className="text-[10px] text-slate-500 font-semibold">Female: 54%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Experience Distribution columns */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between">
          <h5 className="text-[12px] font-bold text-slate-800 uppercase tracking-tight mb-4">
            Experience Distribution
          </h5>
          <div className="h-32 flex items-end justify-between gap-3 px-2">
            {[
              { val: 15, tag: '12%', label: '0-2', color: 'bg-lime-400' },
              { val: 55, tag: '35%', label: '3-5', color: 'bg-blue-600' },
              { val: 70, tag: '45%', label: '5-10', color: 'bg-yellow-400' },
              { val: 30, tag: '20%', label: '10+', color: 'bg-[#60a5fa]' },
            ].map((exp, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <span className="text-[9px] font-bold text-slate-500">{exp.tag}</span>
                <div
                  className={`w-full rounded-md ${exp.color} transition-all duration-500`}
                  style={{ height: `${exp.val}%` }}
                />
                <span className="text-[9px] text-slate-400 font-bold tracking-tight uppercase leading-none mt-1">
                  {exp.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
