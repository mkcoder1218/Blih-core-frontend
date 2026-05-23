import React, { useState } from 'react';
import { TrendingUp, Clock, Target, ArrowUpRight, ChevronDown, Award } from 'lucide-react';

export default function PerformanceOverview() {
  const [selectedQuad, setSelectedQuad] = useState('2nd Quad');

  // Top performers mock data
  const performers = {
    marketing: [
      { rank: 1, name: 'Sarah Johnson', score: '92%' },
      { rank: 2, name: 'Samantha Lee', score: '90%' },
      { rank: 3, name: 'John Smith', score: '82%' },
    ],
    design: [
      { rank: 1, name: 'Sarah Johnson', score: '92%' },
      { rank: 2, name: 'Samantha Lee', score: '90%' },
      { rank: 3, name: 'John Smith', score: '82%' },
    ],
    engineering: [
      { rank: 1, name: 'Sarah Johnson', score: '92%' },
      { rank: 2, name: 'Samantha Lee', score: '90%' },
      { rank: 3, name: 'John Smith', score: '82%' },
    ]
  };

  const departments = [
    { name: 'Engineering', count: 45, score: '4.3' },
    { name: 'Marketing', count: 28, score: '4.5' },
    { name: 'Design', count: 18, score: '4.4' },
    { name: 'Sales', count: 32, score: '4.1' },
    { name: 'Analytics', count: 15, score: '4.6' },
    { name: 'HR', count: 12, score: '4.2' },
  ];

  return (
    <div id="performance-overview-panel" className="space-y-6">
      {/* Top 3 Banners */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-100/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Most Improved</span>
            <p className="text-[15px] font-extrabold text-slate-900 mt-0.5">Engineering Team</p>
            <span className="text-[11px] font-semibold text-emerald-500 block mt-0.5">+15% this quarter</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Clock className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Reviews Due</span>
            <p className="text-[15px] font-extrabold text-slate-900 mt-0.5">12 This Week</p>
            <span className="text-[11px] font-semibold text-rose-500 block mt-0.5">3 overdue</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Target className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active OKRs</span>
            <p className="text-[15px] font-extrabold text-slate-900 mt-0.5">156 Company-wide</p>
            <span className="text-[11px] font-semibold text-blue-600 block mt-0.5">87% on track</span>
          </div>
        </div>
      </div>

      {/* Top Performing Employees Box */}
      <div className="bg-white border border-blue-100 rounded-3xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600 stroke-[2]" />
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Top Performing Employees</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-400 font-semibold">Monday, Jan 21, 2025 - Tuesday, Mar 24, 2025</span>
            <div className="relative">
              <select
                value={selectedQuad}
                onChange={(e) => setSelectedQuad(e.target.value)}
                className="appearance-none bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl py-1.5 pl-3 pr-8 text-xs font-bold text-slate-700 cursor-pointer focus:outline-none"
              >
                <option value="1st Quad">1st Quad</option>
                <option value="2nd Quad">2nd Quad</option>
                <option value="3rd Quad">3rd Quad</option>
                <option value="4th Quad">4th Quad</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5">
          {/* Digital Marketing Team */}
          <div className="space-y-3.5">
            <h4 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Digital Marketing Team</h4>
            <div className="space-y-2">
              {performers.marketing.map((p) => (
                <div key={p.rank} className="flex items-center justify-between bg-slate-50/50 p-2.5 px-3.5 rounded-xl border border-slate-100/50">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                      p.rank === 1 ? 'bg-amber-100 text-amber-700' : p.rank === 2 ? 'bg-slate-200 text-slate-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {p.rank}
                    </span>
                    <span className="text-xs font-bold text-slate-700">{p.name}</span>
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50/80 px-2 py-0.5 rounded-md">OKR: {p.score}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Design and Creative Team */}
          <div className="space-y-3.5">
            <h4 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Design and Creative Team</h4>
            <div className="space-y-2">
              {performers.design.map((p) => (
                <div key={p.rank} className="flex items-center justify-between bg-slate-50/50 p-2.5 px-3.5 rounded-xl border border-slate-100/50">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                      p.rank === 1 ? 'bg-amber-100 text-amber-700' : p.rank === 2 ? 'bg-slate-200 text-slate-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {p.rank}
                    </span>
                    <span className="text-xs font-bold text-slate-700">{p.name}</span>
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50/80 px-2 py-0.5 rounded-md">OKR: {p.score}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Engineering Team */}
          <div className="space-y-3.5">
            <h4 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Engineering Team</h4>
            <div className="space-y-2">
              {performers.engineering.map((p) => (
                <div key={p.rank} className="flex items-center justify-between bg-slate-50/50 p-2.5 px-3.5 rounded-xl border border-slate-100/50">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                      p.rank === 1 ? 'bg-amber-100 text-amber-700' : p.rank === 2 ? 'bg-slate-200 text-slate-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {p.rank}
                    </span>
                    <span className="text-xs font-bold text-slate-700">{p.name}</span>
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50/80 px-2 py-0.5 rounded-md">OKR: {p.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Trends & Distribution charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Performance & Work Hours Trend */}
        <div className="lg:col-span-3 bg-white border border-slate-100 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex justify-between items-center px-1">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">Performance & Work Hours Trend</h4>
            <span className="text-[10px] font-bold text-slate-400">Scale 1-5 Rating</span>
          </div>

          <div className="relative h-44 w-full pt-2">
            {/* Custom high fidelity SVG line chart */}
            <svg viewBox="0 0 500 150" className="w-full h-full overflow-visible">
              {/* Dotted helper lines */}
              <line x1="30" y1="20" x2="470" y2="20" stroke="#f1f5f9" strokeDasharray="3 3" />
              <line x1="30" y1="60" x2="470" y2="60" stroke="#e2e8f0" strokeDasharray="3 3" />
              <line x1="30" y1="100" x2="470" y2="100" stroke="#f1f5f9" strokeDasharray="3 3" />
              <line x1="30" y1="130" x2="470" y2="130" stroke="#f1f5f9" />

              {/* Grid vertical dots */}
              <line x1="40" y1="20" x2="40" y2="130" stroke="#f1f5f9" strokeDasharray="2 2" strokeWidth="1" />
              <line x1="110" y1="20" x2="110" y2="130" stroke="#f1f5f9" strokeDasharray="2 2" strokeWidth="1" />
              <line x1="180" y1="20" x2="180" y2="130" stroke="#e2e8f0" strokeDasharray="2 2" strokeWidth="1" />
              <line x1="250" y1="20" x2="250" y2="130" stroke="#f1f5f9" strokeDasharray="2 2" strokeWidth="1" />
              <line x1="320" y1="20" x2="320" y2="130" stroke="#f1f5f9" strokeDasharray="2 2" strokeWidth="1" />
              <line x1="390" y1="20" x2="390" y2="130" stroke="#f1f5f9" strokeDasharray="2 2" strokeWidth="1" />
              <line x1="460" y1="20" x2="460" y2="130" stroke="#f1f5f9" strokeDasharray="2 2" strokeWidth="1" />

              {/* Main rating line */}
              <path
                d="M 40 65 Q 75 58 110 50 T 180 40 T 250 80 T 320 50 T 390 55 T 460 35"
                fill="none"
                stroke="#2563eb"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Glowing Dots */}
              <circle cx="40" cy="65" r="5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" className="drop-shadow-sm" />
              <circle cx="110" cy="50" r="5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
              <circle cx="180" cy="40" r="6" fill="#1d4ed8" stroke="#ffffff" strokeWidth="2" className="drop-shadow-md" />
              <circle cx="250" cy="80" r="5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
              <circle cx="320" cy="50" r="5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
              <circle cx="390" cy="55" r="5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
              <circle cx="460" cy="35" r="5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />

              {/* Point ratings */}
              <text x="40" y="52" fill="#1e293b" fontSize="8" fontWeight="bold" textAnchor="middle">4.1</text>
              <text x="110" y="38" fill="#1e293b" fontSize="8" fontWeight="bold" textAnchor="middle">4.2</text>
              <text x="180" y="28" fill="#2563eb" fontSize="9" fontWeight="extrabold" textAnchor="middle">4.4</text>
              <text x="250" y="93" fill="#1e293b" fontSize="8" fontWeight="bold" textAnchor="middle">3.9</text>
              <text x="320" y="38" fill="#1e293b" fontSize="8" fontWeight="bold" textAnchor="middle">4.3</text>
              <text x="390" y="43" fill="#1e293b" fontSize="8" fontWeight="bold" textAnchor="middle">4.2</text>
              <text x="460" y="24" fill="#1e293b" fontSize="8" fontWeight="bold" textAnchor="middle">4.5</text>

              {/* Bottom Labels */}
              <text x="40" y="145" fill="#94a3b8" fontSize="9" fontWeight="bold" textAnchor="middle">Jan</text>
              <text x="110" y="145" fill="#94a3b8" fontSize="9" fontWeight="bold" textAnchor="middle">Feb</text>
              <text x="180" y="145" fill="#94a3b8" fontSize="9" fontWeight="bold" textAnchor="middle">Mar</text>
              <text x="250" y="145" fill="#94a3b8" fontSize="9" fontWeight="bold" textAnchor="middle">Apr</text>
              <text x="320" y="145" fill="#94a3b8" fontSize="9" fontWeight="bold" textAnchor="middle">May</text>
              <text x="390" y="145" fill="#94a3b8" fontSize="9" fontWeight="bold" textAnchor="middle">Jun</text>
              <text x="460" y="145" fill="#94a3b8" fontSize="9" fontWeight="bold" textAnchor="middle">Jul</text>
            </svg>
          </div>
        </div>

        {/* Performance Distribution Donut */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight px-1 block mb-3">Performance Distribution</h4>

          <div className="flex items-center gap-4 justify-center py-2">
            {/* Beautiful SVG Donut chart representation */}
            <div className="relative w-28 h-28 flex-shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                {/* Background base circle */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                {/* Meets Segment: 52% (start 0, length 52) */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#60a5fa" strokeWidth="4" strokeDasharray="52 48" strokeDashoffset="0" />
                {/* Exceeds Segment: 35% (start 52, length 35) */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#2563eb" strokeWidth="4.5" strokeDasharray="35 65" strokeDashoffset="-52" />
                {/* Below Segment: 10% (start 87, length 10) */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#93c5fd" strokeWidth="4" strokeDasharray="10 90" strokeDashoffset="-87" />
                {/* Needs Improvement Segment: 3% (start 97, length 3) */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#dbeafe" strokeWidth="4" strokeDasharray="3 97" strokeDashoffset="-97" />
              </svg>
              {/* Abs labels overlay */}
              <span className="absolute top-[28px] right-3 text-[9px] font-black text-blue-800 bg-white shadow-xs p-0.5 px-1 rounded-sm">35%</span>
              <span className="absolute bottom-[28px] left-3 text-[9px] font-black text-slate-800 bg-white shadow-xs p-0.5 px-1 rounded-sm">52%</span>
              <span className="absolute bottom-1 right-5 text-[9px] font-black text-slate-800 bg-white shadow-xs p-0.5 px-1 rounded-sm">10%</span>
              <span className="absolute top-5 right-6 text-[9px] font-black text-slate-800 bg-white shadow-xs p-0.5 px-1 rounded-sm">3%</span>
            </div>

            {/* Custom Label Legends */}
            <div className="space-y-1.5 text-[11px] font-semibold min-w-0">
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-2.5 h-2.5 bg-blue-600 rounded-full flex-shrink-0" />
                <span className="text-slate-500 truncate">Exceeds (4.5-5.0)</span>
                <span className="text-slate-800 font-extrabold ml-auto">35%</span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-2.5 h-2.5 bg-blue-400 rounded-full flex-shrink-0" />
                <span className="text-slate-500 truncate">Meets (3.5-4.4)</span>
                <span className="text-slate-800 font-extrabold ml-auto">52%</span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-2.5 h-2.5 bg-blue-300 rounded-full flex-shrink-0" />
                <span className="text-slate-500 truncate">Below (2.5-3.4)</span>
                <span className="text-slate-800 font-extrabold ml-auto">10%</span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-2.5 h-2.5 bg-blue-100 rounded-full flex-shrink-0" />
                <span className="text-slate-500 truncate">Needs Imp. (&lt;2.5)</span>
                <span className="text-slate-800 font-extrabold ml-auto">3%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Department Performance Overview Bar Chart Row */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-6">
        <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight block">Department Performance Overview</h4>

        {/* Crisp Custom Bar Plot layout */}
        <div className="relative pt-4 pb-2 border-b border-slate-100/60">
          <div className="grid grid-cols-6 items-end gap-5 sm:gap-8 h-40 max-w-4xl mx-auto px-4">
            {departments.map((dept) => {
              // Map score from 0-5 into percentage Height
              const rawVal = parseFloat(dept.score);
              const percentage = Math.round((rawVal / 5) * 100);

              return (
                <div key={dept.name} className="flex flex-col items-center group relative h-full justify-end">
                  {/* Floating value trigger on hover */}
                  <span className="opacity-0 group-hover:opacity-100 absolute -top-5 transition-opacity bg-slate-950 text-white text-[9px] font-black px-2 py-0.5 rounded-md pointer-events-none z-10">
                    {dept.score}
                  </span>

                  {/* Rating indicator */}
                  <span className="text-[10px] font-semibold text-slate-400 mb-1">{dept.score}</span>

                  {/* Core solid bar */}
                  <div
                    style={{ height: `${percentage}%` }}
                    className="w-full bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-xs group-hover:scale-105 duration-200 relative overflow-hidden"
                  >
                    {/* Gloss glass element */}
                    <div className="absolute inset-0 bg-gradient-to-t from-white/0 to-white/10" />
                  </div>

                  {/* Horizontal dash baseline base indicator */}
                  <span className="text-[9px] font-extrabold text-slate-400 mt-2 tracking-tight truncate w-full text-center">
                    {dept.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {departments.map((dept) => (
            <div key={dept.name} className="bg-slate-50/60 border border-slate-100 p-3.5 rounded-2xl flex flex-col justify-between hover:bg-slate-50 transition-colors">
              <div>
                <span className="text-xs font-bold text-slate-800 block">{dept.name}</span>
                <span className="text-[10px] text-slate-400 font-medium">{dept.count} employees</span>
              </div>
              <span className="text-sm font-black text-blue-600 block mt-2 text-right">{dept.score}/5.0</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
