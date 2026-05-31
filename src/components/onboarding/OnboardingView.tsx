/**
 * OnboardingView — tab router for the Onboarding & Probation module.
 * All tab implementations live in ./tabs/ — this file only handles
 * layout, tab switching, and the "Assign Checklist" modal.
 */
import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import OnboardingOverviewTab  from './tabs/OnboardingOverviewTab';
import OnboardingContractTab  from './tabs/OnboardingContractTab';
import OnboardingProgressTab  from './tabs/OnboardingProgressTab';
import OnboardingProbationTab from './tabs/OnboardingProbationTab';

interface OnboardingViewProps {
  currentTab: 'overview' | 'contract' | 'progress' | 'probation' | 'checklists';
  onDraftAiSuggestion: (context: string) => void;
  showAlert: (message: string, type?: 'success' | 'info' | 'error') => void;
}

interface Process {
  id: string;
  employee: string;
  dept: string;
  role: string;
  tasks: { label: string; done: boolean }[];
}

export default function OnboardingView({ currentTab, onDraftAiSuggestion, showAlert }: OnboardingViewProps) {
  // Manual checklist processes (used by ProgressTab)
  const [processes, setProcesses] = useState<Process[]>([]);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignCandidate, setAssignCandidate] = useState({ name: '', role: '', dept: 'Technical Dept.' });

  // Checklist templates (used by Checklists tab)
  const [templates, setTemplates] = useState([
    { id: 'tpl-1', title: 'Software Engineer Onboarding',  dept: 'Technical Dept.',  itemsCount: 12, timesUsed: 8, created: 'Dec 15, 2024', lastUsed: 'Dec 15, 2024', checklist: ['Create employee profile in system', 'Send offer letter via email', 'Provide login credentials', 'Schedule company policy review', 'Set up development environment'] },
    { id: 'tpl-2', title: 'Marketing Team Onboarding',     dept: 'Marketing Dept.',  itemsCount: 12, timesUsed: 8, created: 'Dec 15, 2024', lastUsed: 'Dec 15, 2024', checklist: ['Create employee profile in system', 'Send offer letter via email', 'Provide login credentials', 'Schedule company policy review', 'Set up development environment'] },
    { id: 'tpl-3', title: 'General Employee Onboarding',   dept: 'HR Department',    itemsCount: 12, timesUsed: 8, created: 'Dec 15, 2024', lastUsed: 'Dec 15, 2024', checklist: ['Create employee profile in system', 'Send offer letter via email', 'Provide login credentials', 'Schedule company policy review', 'Set up development environment'] },
  ]);
  const [newTemplate, setNewTemplate] = useState({ title: '', dept: 'Technical Dept.', items: '' });
  const [tplFormOpen, setTplFormOpen] = useState(false);

  const toggleTaskStatus = (processId: string, taskIndex: number) => {
    setProcesses(prev => prev.map(p => {
      if (p.id !== processId) return p;
      const updatedTasks = [...p.tasks];
      updatedTasks[taskIndex] = { ...updatedTasks[taskIndex], done: !updatedTasks[taskIndex].done };
      const completedCount = updatedTasks.filter(t => t.done).length;
      showAlert(`Updated checkpoint for ${p.employee} (${completedCount}/${updatedTasks.length} tasks)`, 'info');
      return { ...p, tasks: updatedTasks };
    }));
  };

  const handleAssignChecklistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignCandidate.name || !assignCandidate.role) return;
    const newProcess: Process = {
      id: `proc-${Date.now()}`,
      employee: assignCandidate.name,
      dept: assignCandidate.dept,
      role: assignCandidate.role,
      tasks: [
        { label: 'Profile Created',          done: true  },
        { label: 'Assets Assigned',          done: false },
        { label: 'System Access',            done: false },
        { label: 'Policies Signed',          done: false },
        { label: 'Access and Credential',    done: false },
      ],
    };
    setProcesses(prev => [newProcess, ...prev]);
    setAssignModalOpen(false);
    showAlert(`Successfully started onboarding process for ${assignCandidate.name}!`, 'success');
    setAssignCandidate({ name: '', role: '', dept: 'Technical Dept.' });
  };

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplate.title) return;
    const parsedItems = newTemplate.items
      ? newTemplate.items.split('\n').filter(i => i.trim() !== '')
      : ['Create employee profile', 'Coordinate direct-deposit setups', 'Compliance brief'];
    const newTpl = {
      id: `tpl-${Date.now()}`,
      title: newTemplate.title,
      dept: newTemplate.dept,
      itemsCount: parsedItems.length,
      timesUsed: 0,
      created: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      lastUsed: 'Never',
      checklist: parsedItems.slice(0, 5),
    };
    setTemplates(prev => [...prev, newTpl]);
    setNewTemplate({ title: '', dept: 'Technical Dept.', items: '' });
    setTplFormOpen(false);
    showAlert(`Successfully created new checklist: ${newTpl.title}!`, 'success');
  };

  const deleteTemplate = (id: string, name: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    showAlert(`Deleted template: ${name}`, 'info');
  };

  const duplicateTemplate = (template: typeof templates[0]) => {
    setTemplates(prev => [...prev, { ...template, id: `tpl-${Date.now()}`, title: `${template.title} (Copy)`, timesUsed: 0 }]);
    showAlert(`Duplicated: ${template.title}`, 'success');
  };

  return (
    <div id="onboarding-module-container" className="space-y-6">

      {currentTab === 'overview' && (
        <OnboardingOverviewTab />
      )}

      {currentTab === 'contract' && (
        <OnboardingContractTab onDraftAiSuggestion={onDraftAiSuggestion} showAlert={showAlert} />
      )}

      {currentTab === 'progress' && (
        <OnboardingProgressTab
          processes={processes}
          toggleTaskStatus={toggleTaskStatus}
          setAssignModalOpen={setAssignModalOpen}
          showAlert={showAlert}
        />
      )}

      {currentTab === 'probation' && (
        <OnboardingProbationTab onDraftAiSuggestion={onDraftAiSuggestion} showAlert={showAlert} />
      )}

      {currentTab === 'checklists' && (
        <div id="tab-checklists-pane" className="space-y-6 animate-fade-in font-sans pb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Checklist Templates</h3>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Reusable onboarding checklists for different roles and departments.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onDraftAiSuggestion('Generate a comprehensive onboarding checklist template for a senior technical role.')}
                className="bg-blue-50 hover:bg-blue-100 text-blue-600 font-black text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
              >
                AI Generate
              </button>
              <button
                onClick={() => setTplFormOpen(v => !v)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" /> New Template
              </button>
            </div>
          </div>

          {tplFormOpen && (
            <form onSubmit={handleCreateTemplate} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4 shadow-xs">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Create New Template</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Template Title *</label>
                  <input type="text" required value={newTemplate.title} onChange={e => setNewTemplate(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Engineering Onboarding" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-xs focus:outline-none focus:bg-white focus:border-blue-500 font-bold" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Department</label>
                  <select value={newTemplate.dept} onChange={e => setNewTemplate(p => ({ ...p, dept: e.target.value }))} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-xs focus:outline-none focus:bg-white focus:border-blue-500 font-bold">
                    {['Technical Dept.', 'Marketing Dept.', 'HR Department', 'Finance Dept.', 'Product Dept.'].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Checklist Items (one per line)</label>
                <textarea rows={4} value={newTemplate.items} onChange={e => setNewTemplate(p => ({ ...p, items: e.target.value }))} placeholder="Create employee profile&#10;Send offer letter&#10;Provide login credentials" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-xs focus:outline-none focus:bg-white focus:border-blue-500 font-medium resize-none" />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setTplFormOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs">Create Template</button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {templates.map(tpl => (
              <div key={tpl.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 leading-tight">{tpl.title}</h4>
                    <span className="text-[9.5px] text-blue-600 font-extrabold uppercase bg-blue-50 px-2 py-0.5 rounded-md mt-1 inline-block">{tpl.dept}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => duplicateTemplate(tpl)} title="Duplicate" className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors text-[10px] font-bold">Copy</button>
                    <button onClick={() => deleteTemplate(tpl.id, tpl.title)} title="Delete" className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors text-[10px] font-bold">Del</button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {tpl.checklist.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px] text-slate-600 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                  {tpl.itemsCount > tpl.checklist.length && (
                    <p className="text-[10px] text-slate-400 font-bold pl-3.5">+{tpl.itemsCount - tpl.checklist.length} more items</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-semibold">
                  <span>Used {tpl.timesUsed}× · Created {tpl.created}</span>
                  <button onClick={() => showAlert(`Instantiated onboarding trackers utilizing ${tpl.title}`, 'success')} className="bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] px-3 py-1.5 rounded-lg transition-colors">Use</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assign Checklist Modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setAssignModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md mx-4 p-6 space-y-5 z-10">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">Assign Onboarding Checklist</h3>
              <button onClick={() => setAssignModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAssignChecklistSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Employee Name *</label>
                <input type="text" required value={assignCandidate.name} onChange={e => setAssignCandidate(p => ({ ...p, name: e.target.value }))} placeholder="Full Name" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:bg-white focus:border-blue-500 font-bold" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Role / Position *</label>
                <input type="text" required value={assignCandidate.role} onChange={e => setAssignCandidate(p => ({ ...p, role: e.target.value }))} placeholder="e.g. Full Stack Developer" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:bg-white focus:border-blue-500 font-bold" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Department</label>
                <select value={assignCandidate.dept} onChange={e => setAssignCandidate(p => ({ ...p, dept: e.target.value }))} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:bg-white focus:border-blue-500 font-bold">
                  {['Technical Dept.', 'Marketing Dept.', 'HR Department', 'Finance Dept.', 'Product Dept.'].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setAssignModalOpen(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-bold transition-colors">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-xs font-black transition-colors shadow-xs">Assign Checklist</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
