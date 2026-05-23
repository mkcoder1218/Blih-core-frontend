/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Sparkles,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  UserPlus2,
  FolderOpen,
  Briefcase
} from 'lucide-react';

interface OffersProps {
  onDraftAiSuggestion: (context: string) => void;
  showAlert: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export default function RecruitmentOffers({
  onDraftAiSuggestion,
  showAlert
}: OffersProps) {
  // Tabs for sub-state
  const [activeSegment, setActiveSegment] = useState<'Offers' | 'Accepted' | 'Rejected'>('Offers');
  
  // Database of candidates
  const [candidates, setCandidates] = useState([
    {
      id: 'cand-1',
      name: 'Alex Johnson',
      phone: '+251 967 97 3799',
      role: 'Senior Backend Engineer',
      dept: 'TECHNICAL DEPT.',
      salary: '20,000',
      status: 'pending',
      onboarding: '-',
      startDate: 'Feb 24, 2025'
    },
    {
      id: 'cand-2',
      name: 'Alex Johnson',
      phone: '+251 967 97 3799',
      role: 'Senior Backend Engineer',
      dept: 'TECHNICAL DEPT.',
      salary: '20,000',
      status: 'pending',
      onboarding: '-',
      startDate: 'Feb 24, 2025'
    },
    {
      id: 'cand-3',
      name: 'Danel Tesema',
      phone: '+251 967 97 3799',
      role: 'Senior Graphics Designer',
      dept: 'CREATIVE DEPT.',
      salary: '18,000',
      status: 'pending',
      onboarding: '-',
      startDate: 'Feb 24, 2025'
    },
    {
      id: 'cand-4',
      name: 'Danel Tesema',
      phone: '+251 967 97 3799',
      role: 'Senior Graphics Designer',
      dept: 'CREATIVE DEPT.',
      salary: '18,000',
      status: 'pending',
      onboarding: '-',
      startDate: 'Feb 24, 2025'
    },
    {
      id: 'cand-5',
      name: 'Danel Tesema',
      phone: '+251 967 97 3799',
      role: 'Senior Graphics Designer',
      dept: 'CREATIVE DEPT.',
      salary: '18,000',
      status: 'accepted',
      onboarding: '-',
      startDate: 'Feb 24, 2025'
    },
    {
      id: 'cand-6',
      name: 'Alex Johnson',
      phone: '+251 967 97 3799',
      role: 'Senior Backend Engineer',
      dept: 'TECHNICAL DEPT.',
      salary: '20,000',
      status: 'accepted',
      onboarding: '-',
      startDate: 'Feb 24, 2025'
    },
    {
      id: 'cand-7',
      name: 'Alex Johnson',
      phone: '+251 967 97 3799',
      role: 'Senior Backend Engineer',
      dept: 'TECHNICAL DEPT.',
      salary: '20,000',
      status: 'accepted',
      onboarding: '-',
      startDate: 'Feb 24, 2025'
    },
    {
      id: 'cand-8',
      name: 'Danel Tesema',
      phone: '+251 967 97 3799',
      role: 'Senior Graphics Designer',
      dept: 'CREATIVE DEPT.',
      salary: '18,000',
      status: 'accepted',
      onboarding: '-',
      startDate: 'Feb 24, 2025'
    },
    {
      id: 'cand-9',
      name: 'Alex Johnson',
      phone: '+251 967 97 3799',
      role: 'Senior Backend Engineer',
      dept: 'TECHNICAL DEPT.',
      salary: '20,000',
      status: 'rejected',
      onboarding: '-',
      startDate: 'Feb 24, 2025'
    },
    {
      id: 'cand-10',
      name: 'Danel Tesema',
      phone: '+251 967 97 3799',
      role: 'Senior Graphics Designer',
      dept: 'TECHNICAL DEPT.',
      salary: '20,000',
      status: 'rejected',
      onboarding: '-',
      startDate: 'Feb 24, 2025'
    },
    {
      id: 'cand-11',
      name: 'Alex Johnson',
      phone: '+251 967 97 3799',
      role: 'Senior Backend Engineer',
      dept: 'TECHNICAL DEPT.',
      salary: '20,005',
      status: 'rejected',
      onboarding: '-',
      startDate: 'Feb 24, 2025'
    },
    {
      id: 'cand-12',
      name: 'Danel Tesema',
      phone: '+251 967 97 3799',
      role: 'Senior Graphics Designer',
      dept: 'TECHNICAL DEPT.',
      salary: '20,000',
      status: 'rejected',
      onboarding: '-',
      startDate: 'Feb 24, 2025'
    }
  ]);

  // Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newCandidate, setNewCandidate] = useState({
    name: '',
    role: 'Senior Fullstack Engineer',
    dept: 'TECHNICAL DEPT.',
    salary: '22,000',
    status: 'pending'
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCandidate.name) {
      showAlert('Enter candidate name', 'error');
      return;
    }
    const created = {
      id: `cand-${Date.now()}`,
      name: newCandidate.name,
      phone: '+251 965 21 8295',
      role: newCandidate.role,
      dept: newCandidate.dept,
      salary: newCandidate.salary,
      status: newCandidate.status,
      onboarding: '-',
      startDate: 'Mar 15, 2025'
    };
    setCandidates(prev => [created, ...prev]);
    setAddModalOpen(false);
    setNewCandidate({ name: '', role: 'Senior Fullstack Engineer', dept: 'TECHNICAL DEPT.', salary: '22,000', status: 'pending' });
    showAlert(`Offer registered successfully for ${created.name}`, 'success');
  };

  const handleAcceptCandidate = (id: string, name: string) => {
    setCandidates(prev =>
      prev.map(c => (c.id === id ? { ...c, status: 'accepted' } : c))
    );
    showAlert(`Approved signature workflow for ${name}!`, 'success');
  };

  const handleStartOnboarding = (name: string) => {
    showAlert(`Onboarding initialized for ${name}! Transferred to checklists.`, 'success');
  };

  // Filter candidates according to segmented tabs
  const filteredCandidates = candidates.filter(cand => {
    if (activeSegment === 'Offers') return cand.status === 'pending';
    if (activeSegment === 'Accepted') return cand.status === 'accepted';
    if (activeSegment === 'Rejected') return cand.status === 'rejected';
    return true;
  });

  const pendingCount = candidates.filter(c => c.status === 'pending').length;
  const acceptedCount = candidates.filter(c => c.status === 'accepted').length;
  const rejectedCount = candidates.filter(c => c.status === 'rejected').length;

  return (
    <div id="offers-management-view" className="space-y-6 animate-fade-in font-sans pb-12">
      
      {/* Description and Title Header Container matching image layout */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-2xl border border-slate-100 shadow-xs gap-4">
        <div>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Offer Management</h3>
          <p className="text-xs text-slate-400 font-semibold mt-1">Manage candidate offers, salary approvals, contract status, and onboarding progress</p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-4.5 py-2.5 rounded-xl cursor-pointer shadow-md shadow-blue-100 transition-all flex items-center gap-1.5"
        >
          <PlusCircle className="w-4 h-4 stroke-[2.5]" />
          <span>Add Candidate</span>
        </button>
      </div>

      {/* Top Cards grid for Counters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Pending */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Offers</span>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{pendingCount}</h3>
          </div>
          <div className="w-11 h-11 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500">
            <Clock className="w-5.5 h-5.5" />
          </div>
        </div>

        {/* Accepted */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Accepted Offers</span>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{acceptedCount}</h3>
          </div>
          <div className="w-11 h-11 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-650">
            <CheckCircle2 className="w-5.5 h-5.5" />
          </div>
        </div>

        {/* Rejected */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rejected Offers</span>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{rejectedCount}</h3>
          </div>
          <div className="w-11 h-11 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500">
            <Briefcase className="w-5.5 h-5.5" />
          </div>
        </div>

      </div>

      {/* Tab bar navigation with custom styling */}
      <div className="bg-white rounded-2xl border border-slate-105 p-1 flex shadow-2xs">
        {[
          { label: 'Offers', val: 'Offers' as const, count: pendingCount },
          { label: 'Accepted', val: 'Accepted' as const, count: acceptedCount },
          { label: 'Rejected(2)', val: 'Rejected' as const, count: rejectedCount }
        ].map((item) => {
          const isActive = activeSegment === item.val;
          return (
            <button
              key={item.label}
              onClick={() => setActiveSegment(item.val)}
              className={`flex-1 py-3 text-xs font-black rounded-xl transition-all cursor-pointer text-center ${
                isActive
                  ? 'bg-slate-100/80 text-slate-950 font-black shadow-3xs'
                  : 'text-slate-450 hover:text-slate-700'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Subtab Segment section description */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4 shadow-3xs">
        <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
          <div className={`w-2.5 h-2.5 rounded-full ${
            activeSegment === 'Offers' ? 'bg-amber-400' : activeSegment === 'Accepted' ? 'bg-emerald-500' : 'bg-rose-500'
          }`} />
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
            {activeSegment === 'Offers' ? 'Pending offers' : activeSegment === 'Accepted' ? 'Accepted offers' : 'Rejected Offers'}
          </h4>
        </div>

        {/* Table structure matching Screenshot 8/9/10 */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-blue-600 font-extrabold uppercase tracking-wide text-[10px]">
                <th className="py-3 px-4 font-black">Candidate Name</th>
                <th className="py-3 px-4 font-black">Job Position</th>
                <th className="py-3 px-4 font-black">Salary</th>
                <th className="py-3 px-4 font-black">Offer Stats</th>
                <th className="py-3 px-4 font-black">Onboarding</th>
                <th className="py-3 px-4 font-black">Start Date</th>
                <th className="py-3 px-4 text-right font-black">Action</th>
              </tr>
            </thead>
            <tbody className="font-semibold text-slate-700 divide-y divide-slate-50">
              {filteredCandidates.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 text-[12.5px]">{c.name}</div>
                    <div className="text-[10px] text-slate-400 font-bold mt-0.5">{c.phone}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-850">{c.role}</div>
                    <div className="text-[9.5px] text-blue-600 font-extrabold tracking-wide uppercase mt-0.5">{c.dept}</div>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">
                    {c.salary}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      c.status === 'pending'
                        ? 'bg-amber-100 text-amber-700'
                        : c.status === 'accepted'
                        ? 'bg-emerald-100 text-emerald-700 font-black'
                        : 'bg-rose-105 text-rose-700'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">
                    {c.onboarding}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-medium">
                    {c.startDate}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {c.status === 'pending' ? (
                      <button
                        onClick={() => handleAcceptCandidate(c.id, c.name)}
                        className="bg-slate-50 hover:bg-slate-100 text-[10px] font-black text-slate-700 border border-slate-205 px-2.5 py-1 rounded-lg cursor-pointer transition-colors"
                      >
                        Sign Offer
                      </button>
                    ) : c.status === 'accepted' ? (
                      <button
                        onClick={() => handleStartOnboarding(c.name)}
                        className="bg-emerald-50 hover:bg-emerald-100 text-[10px] font-black text-emerald-700 border border-emerald-105 px-2.5 py-1 rounded-lg cursor-pointer transition-colors"
                      >
                        + onboarding
                      </button>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                </tr>
              ))}

              {filteredCandidates.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400 font-bold">
                    No records found in this category.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD CANDIDATE MODAL */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <form 
            onSubmit={handleCreateSubmit}
            className="bg-white rounded-3xl w-full max-w-md overflow-hidden border border-slate-105 shadow-2xl animate-scale-up"
          >
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h4 className="text-sm font-black text-slate-900 tracking-tight">Add Offer Candidate</h4>
              <button 
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-white border border-slate-150 flex items-center justify-center text-slate-450 hover:text-slate-800"
              >
                X
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs font-semibold">
              <div className="space-y-1.5">
                <label className="text-slate-550 uppercase tracking-wider block font-bold">Candidate Name</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Rachel Green"
                  value={newCandidate.name}
                  onChange={(e) => setNewCandidate(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-205 focus:border-blue-600 focus:outline-none font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-550 uppercase tracking-wider block font-bold">Role Title</label>
                  <input 
                    type="text"
                    required
                    value={newCandidate.role}
                    onChange={(e) => setNewCandidate(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-205 focus:border-blue-600 focus:outline-none font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-550 uppercase tracking-wider block font-bold">Salary Offered</label>
                  <input 
                    type="text"
                    required
                    value={newCandidate.salary}
                    onChange={(e) => setNewCandidate(prev => ({ ...prev, salary: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-205 focus:border-blue-600 focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-550 uppercase tracking-wider block font-bold">Department Selection</label>
                <select 
                  value={newCandidate.dept}
                  onChange={(e) => setNewCandidate(prev => ({ ...prev, dept: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-205 focus:border-blue-600 focus:outline-none font-bold text-slate-800"
                >
                  <option value="TECHNICAL DEPT.">TECHNICAL DEPT.</option>
                  <option value="CREATIVE DEPT.">CREATIVE DEPT.</option>
                  <option value="DIGITAL MARKETING DEPT.">DIGITAL MARKETING DEPT.</option>
                </select>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3.5">
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="px-4 py-2 bg-white border border-slate-205 hover:bg-slate-50 text-slate-600 text-xs font-black rounded-xl cursor-pointer font-sans"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl cursor-pointer font-sans shadow-xs"
              >
                Register Offer
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
}
