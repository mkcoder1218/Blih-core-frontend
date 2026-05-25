/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles } from 'lucide-react';

interface TopMatchCardProps {
  name?: string;
  phone?: string;
  matchScore?: number;
  experience?: string;
  salaryExpectation?: string;
  canStart?: string;
  onClick?: () => void;
  className?: string;
}

export default function TopMatchCard({
  name = 'Jessica Parker',
  phone = '+251 967 97 3799',
  matchScore = 90,
  experience = '2 Years',
  salaryExpectation = '20,000',
  canStart = 'Feb 03, 2025',
  onClick,
  className = ''
}: TopMatchCardProps) {
  return (
    <div 
      onClick={onClick}
      className={`border-2 border-[#1a56db]/50 bg-white rounded-3xl p-5 shadow-3xs flex flex-col justify-between min-h-[170px] transition-all ${
        onClick ? 'cursor-pointer hover:border-blue-600 hover:shadow-2xs' : ''
      } ${className}`}
    >
      {/* Blue Header Bar */}
      <div className="flex items-center justify-between mb-4 select-none">
        <div className="flex items-center gap-1.5 bg-[#eff6ff] text-[#1a56db] border border-[#bfdbfe]/60 px-2.5 py-1 rounded-xl">
          <span className="text-[11px] leading-none">🎯</span>
          <span className="text-[10px] font-black uppercase tracking-wider">Top Match</span>
        </div>
        <span className="bg-[#fef9c3] text-[#a16207] border border-[#fef08a] px-2.5 py-1 rounded-xl text-[10.5px] font-black flex items-center gap-1 shadow-2xs">
          <span>✨</span>
          <span>{matchScore}%</span>
        </span>
      </div>

      {/* Details Column grid */}
      <div className="grid grid-cols-2 gap-4 pb-1">
        <div className="space-y-3.5">
          <div>
            <h4 className="font-extrabold text-[15px] text-slate-800 leading-tight">{name}</h4>
            <p className="text-[10.5px] text-slate-400 font-semibold leading-none mt-1 font-sans">{phone}</p>
          </div>

          <div>
            <span className="block text-[9.5px] text-slate-400 uppercase tracking-wider font-extrabold mb-0.5">Salary Expectation</span>
            <span className="text-[12px] font-black text-slate-700 font-sans">{salaryExpectation}</span>
          </div>
        </div>

        <div className="border-l border-slate-100 pl-4 space-y-3.5">
          <div>
            <span className="block text-[9.5px] text-slate-400 uppercase tracking-wider font-extrabold mb-0.5">Experience</span>
            <span className="text-[12px] font-black text-slate-700">{experience}</span>
          </div>

          <div>
            <span className="block text-[9.5px] text-slate-400 uppercase tracking-wider font-extrabold mb-0.5">Can Start</span>
            <span className="text-[12px] font-black text-slate-700">{canStart}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
