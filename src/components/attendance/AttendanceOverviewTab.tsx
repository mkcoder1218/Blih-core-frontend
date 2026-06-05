/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Calendar, Clock, CheckSquare, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { StatCard, StatCardGrid, SectionCard } from '@/components/ui/blih';

export default function AttendanceOverviewTab() {
  return (
    <motion.div
      key="overview"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6"
    >
      {/* Top row of three large key indicators */}
      <StatCardGrid cols={3}>
        <StatCard label="Pending Requests" value={12} icon={<Clock className="w-5 h-5" />} tone="amber" />
        <StatCard label="Total Check-ins Today" value={28} icon={<CheckSquare className="w-5 h-5" />} tone="blue" />
        <StatCard label="Present" value={45} icon={<TrendingUp className="w-5 h-5" />} tone="emerald" />
      </StatCardGrid>

      {/* Work Hours Performance Card Container */}
      <SectionCard title="Work Hours Performance">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">

          {/* Daily Card */}
          <div className="bg-slate-50 border border-slate-100/50 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between h-[150px]">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-800">Daily</span>
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <span className="text-3xl font-black text-blue-600 tracking-tight block">8.5h</span>
              <span className="text-[10px] text-slate-400 block font-medium mt-0.5">Target: 8h</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-slate-500">
                <span>Performance</span>
                <span className="text-blue-600">106%</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#1a56db] h-full rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
          </div>

          {/* Monthly Card */}
          <div className="bg-slate-50 border border-slate-100/50 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between h-[150px]">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-800">Monthly</span>
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <span className="text-3xl font-black text-blue-600 tracking-tight block">168h</span>
              <span className="text-[10px] text-slate-400 block font-medium mt-0.5">Target: 160h</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-slate-500">
                <span>Performance</span>
                <span className="text-blue-600">105%</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#1a56db] h-full rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
          </div>

          {/* Annually Card */}
          <div className="bg-slate-50 border border-slate-100/50 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between h-[150px]">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-800">Annually</span>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <span className="text-3xl font-black text-blue-600 tracking-tight block">2016h</span>
              <span className="text-[10px] text-slate-400 block font-medium mt-0.5">Target: 1920h</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-slate-500">
                <span>Performance</span>
                <span className="text-blue-600">105%</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#1a56db] h-full rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
          </div>

        </div>
      </SectionCard>

      {/* Bezier Activity & Presence Chart */}
      <SectionCard title="Activity and Presence">
        <div className="relative pt-2 h-[260px] w-full">
          <svg className="w-full h-full" viewBox="0 0 1000 240" preserveAspectRatio="none">
            {/* Grid Lines */}
            <line x1="50" y1="20" x2="980" y2="20" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />
            <line x1="50" y1="65" x2="980" y2="65" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />
            <line x1="50" y1="110" x2="980" y2="110" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />
            <line x1="50" y1="155" x2="980" y2="155" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />
            <line x1="50" y1="200" x2="980" y2="200" stroke="#cbd5e1" strokeWidth="1" />

            {/* Y Axis labels */}
            <text x="35" y="24" className="text-[10px] font-medium fill-slate-400" textAnchor="end">180</text>
            <text x="35" y="69" className="text-[10px] font-medium fill-slate-400" textAnchor="end">135</text>
            <text x="35" y="114" className="text-[10px] font-medium fill-slate-400" textAnchor="end">90</text>
            <text x="35" y="159" className="text-[10px] font-medium fill-slate-400" textAnchor="end">45</text>
            <text x="35" y="204" className="text-[10px] font-medium fill-slate-400" textAnchor="end">0</text>

            {/* Chart Line Path */}
            <path
              d="M 50,130 C 100,125 120,115 160,112 C 200,110 240,90 280,95 C 320,100 360,155 400,145 C 440,135 480,105 520,100 C 560,95 600,115 640,112 C 680,110 720,70 760,85 C 800,100 840,120 880,105 C 920,90 950,110 980,125"
              fill="none"
              stroke="#1a56db"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Dots */}
            <circle cx="50" cy="130" r="4.5" fill="#1a56db" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx="160" cy="112" r="4.5" fill="#1a56db" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx="280" cy="95" r="4.5" fill="#1a56db" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx="400" cy="145" r="4.5" fill="#1a56db" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx="520" cy="100" r="4.5" fill="#1a56db" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx="640" cy="112" r="4.5" fill="#1a56db" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx="760" cy="85" r="4.5" fill="#1a56db" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx="880" cy="105" r="4.5" fill="#1a56db" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx="980" cy="125" r="4.5" fill="#1a56db" stroke="#ffffff" strokeWidth="1.5" />

            {/* X Axis labels */}
            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((mon, index) => {
              const xCoord = 50 + (index * 84.5);
              return (
                <g key={mon}>
                  <line x1={xCoord} y1="200" x2={xCoord} y2="204" stroke="#cbd5e1" strokeWidth="1" />
                  <text x={xCoord} y="222" className="text-[10.5px] font-bold fill-slate-400" textAnchor="middle">{mon}</text>
                </g>
              );
            })}
          </svg>
        </div>
      </SectionCard>
    </motion.div>
  );
}
