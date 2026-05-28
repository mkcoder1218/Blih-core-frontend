import { Calendar, User as UserIcon } from 'lucide-react';
import { useDepartments } from '../../../hooks/useDepartments';
import { usePositions } from '../../../hooks/usePositions';
import { useUsers } from '../../../hooks/useUsers';
import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import type { User, Department, Position } from '../../../api/types';
import { CreateDepartmentModal, CreatePositionModal } from '../../people/OrgModals';

interface RequestFormStepProps {
  data: any;
  updateData: (update: any) => void;
}

export default function RequestFormStep({ data, updateData }: RequestFormStepProps) {
  const { data: departments, isLoading: deptsLoading } = useDepartments();
  const { data: positions, isLoading: posLoading } = usePositions();
  const { data: hiringManagersData, isLoading: managersLoading } = useUsers({ permission: 'job:post' });
  const { data: allEmployeesData, isLoading: employeesLoading } = useUsers();
  const queryClient = useQueryClient();
  const { showAlert } = useOutletContext<{ showAlert: (msg: string, type?: 'success' | 'info' | 'error') => void }>();

  const [isCreateDeptOpen, setIsCreateDeptOpen] = useState(false);
  const [isCreatePosOpen, setIsCreatePosOpen] = useState(false);

  const hiringManagers = hiringManagersData?.rows || [];
  const allEmployees = allEmployeesData?.rows || [];
  const selectedDeptId = departments?.departments?.find((d: Department) => d.name === data.department)?.id;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in-up">
      <CreateDepartmentModal
        isOpen={isCreateDeptOpen}
        onClose={() => setIsCreateDeptOpen(false)}
        showAlert={showAlert}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['departments'] });
        }}
      />
      <CreatePositionModal
        isOpen={isCreatePosOpen}
        onClose={() => setIsCreatePosOpen(false)}
        showAlert={showAlert}
        initialDeptId={selectedDeptId}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['positions'] });
        }}
      />
      {/* Left Column: Form Fields */}
      <div className="lg:col-span-8 space-y-6">
        {/* BASICS */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
          <div className="mb-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Basics</span>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Request Basics</h3>
            <p className="text-[11px] text-slate-400 font-medium">Capture the role, owning department, and requester information.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 ml-1">Job Title</label>
              <input
                type="text"
                placeholder="Senior Product Designer"
                className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-500 rounded-xl px-4 py-3 text-xs text-slate-800 font-semibold focus:outline-none transition-all"
                value={data.jobTitle}
                onChange={(e) => updateData({ jobTitle: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <label className="text-[11px] font-bold text-slate-600">Department</label>
                <button 
                  type="button"
                  onClick={() => setIsCreateDeptOpen(true)}
                  className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                >
                  Add department
                </button>
              </div>
              <select 
                className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-500 rounded-xl px-4 py-3 text-xs text-slate-800 font-semibold focus:outline-none transition-all cursor-pointer"
                value={data.department}
                onChange={(e) => updateData({ department: e.target.value })}
              >
                <option value="">Select department</option>
                {deptsLoading ? (
                  <option disabled>Loading...</option>
                ) : (
                  departments?.departments?.map((dept: Department) => (
                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                  ))
                )}
              </select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <label className="text-[11px] font-bold text-slate-600">Position</label>
                <button 
                  type="button"
                  onClick={() => setIsCreatePosOpen(true)}
                  className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                >
                  Add position
                </button>
              </div>
              <select 
                className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-500 rounded-xl px-4 py-3 text-xs text-slate-800 font-semibold focus:outline-none transition-all cursor-pointer"
                value={data.position}
                onChange={(e) => updateData({ position: e.target.value })}
              >
                <option value="">Select position</option>
                {posLoading ? (
                  <option disabled>Loading...</option>
                ) : (
                  positions?.positions?.map((pos: Position) => (
                    <option key={pos.id} value={pos.title}>{pos.title}</option>
                  ))
                )}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 ml-1">Hiring Manager</label>
              <select 
                className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-500 rounded-xl px-4 py-3 text-xs text-slate-800 font-semibold focus:outline-none transition-all cursor-pointer"
                value={data.hiringManager}
                onChange={(e) => updateData({ hiringManager: e.target.value })}
              >
                <option value="">Select hiring manager</option>
                {managersLoading ? (
                  <option disabled>Loading...</option>
                ) : (
                  hiringManagers.map((manager: User) => (
                    <option key={manager.id} value={manager.fullName}>{manager.fullName}</option>
                  ))
                )}
              </select>
            </div>
          </div>
        </div>

        {/* JUSTIFICATION */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
          <div className="mb-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Justification</span>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Why This Role</h3>
            <p className="text-[11px] text-slate-400 font-medium">Clarify whether this is a new role or backfill and explain the business case.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 ml-1">New / Replacement</label>
              <select 
                className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-500 rounded-xl px-4 py-3 text-xs text-slate-800 font-semibold focus:outline-none transition-all cursor-pointer"
                value={data.type}
                onChange={(e) => updateData({ type: e.target.value })}
              >
                <option value="New Role">New Role</option>
                <option value="Replacement">Replacement</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 ml-1">Replace For</label>
              <select 
                className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-500 rounded-xl px-4 py-3 text-xs text-slate-800 font-semibold focus:outline-none transition-all disabled:opacity-50"
                value={data.replaceFor}
                disabled={data.type === 'New Role'}
                onChange={(e) => updateData({ replaceFor: e.target.value })}
              >
                <option value="Not applicable">Not applicable</option>
                {employeesLoading ? (
                   <option disabled>Loading...</option>
                ) : (
                  allEmployees.map((user: User) => (
                    <option key={user.id} value={user.fullName}>{user.fullName}</option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-600 ml-1">Business Justification</label>
            <textarea
              placeholder="Explain the hiring need, team gap, expected impact, and why this role is needed now."
              className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-500 rounded-xl px-4 py-3 text-xs text-slate-800 font-semibold focus:outline-none transition-all min-h-[120px] resize-none"
              value={data.businessJustification}
              onChange={(e) => updateData({ businessJustification: e.target.value })}
            />
            <p className="text-[10px] text-slate-400 px-1 font-medium italic">Briefly explain why this role is needed now.</p>
          </div>
        </div>
      </div>

      {/* Right Column: Terms and Summary */}
      <div className="lg:col-span-4 space-y-6">
        {/* TERMS */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
          <div className="mb-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Terms</span>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Hiring Terms</h3>
            <p className="text-[11px] text-slate-400 font-medium">Define employment setup, urgency, and expected fill date.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600">Employment Type</label>
              <select 
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none"
                value={data.employmentType}
                onChange={(e) => updateData({ employmentType: e.target.value })}
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600">Work Mode</label>
              <select 
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none"
                value={data.workMode}
                onChange={(e) => updateData({ workMode: e.target.value })}
              >
                <option value="On-site">On-site</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600">Urgency</label>
              <select 
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none"
                value={data.urgency}
                onChange={(e) => updateData({ urgency: e.target.value })}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600">Priority</label>
              <select 
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none"
                value={data.priority}
                onChange={(e) => updateData({ priority: e.target.value })}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600">Needed By Date</label>
              <div className="relative">
                <input
                  type="date"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none"
                  value={data.neededByDate}
                  onChange={(e) => updateData({ neededByDate: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* LIVE SUMMARY */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
          <div className="mb-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Summary</span>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Request Snapshot</h3>
          </div>

          <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 flex flex-col gap-4">
             <div className="space-y-1">
                <h4 className="text-[13px] font-extrabold text-slate-900">{data.jobTitle || 'Untitled role request'}</h4>
                <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-bold text-slate-400">
                        {data.department || 'Not set'}
                    </span>
                    <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-bold text-slate-600">
                        {data.type}
                    </span>
                    <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-bold text-blue-600">
                        {data.priority} Priority
                    </span>
                </div>
             </div>

             <div className="space-y-2 border-t border-slate-100 pt-4">
                {[
                    { label: 'Department', value: data.department || 'Not set' },
                    { label: 'Position', value: data.position || 'Not set' },
                    { label: 'Employment type', value: data.employmentType },
                    { label: 'Work mode', value: data.workMode },
                    { label: 'Priority', value: data.priority },
                    { label: 'Needed by', value: data.neededByDate || 'Select a date' },
                    { label: 'Replacement for', value: data.replaceFor },
                ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between group">
                        <span className="text-[10px] font-bold text-slate-400">{item.label}</span>
                        <span className="text-[10px] font-extrabold text-slate-800">{item.value}</span>
                    </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
