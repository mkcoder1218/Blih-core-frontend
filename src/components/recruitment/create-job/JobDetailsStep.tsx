import { useUsers } from '../../../hooks/useUsers';
import type { User } from '../../../api/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface JobDetailsStepProps {
  data: any;
  updateData: (update: any) => void;
}

export default function JobDetailsStep({ data, updateData }: JobDetailsStepProps) {
  const { data: hiringManagersData, isLoading: managersLoading } = useUsers({ permission: 'job:post' });
  const { data: allEmployeesData, isLoading: employeesLoading } = useUsers();
  const hiringManagers = hiringManagersData?.rows || [];
  const allEmployees = allEmployeesData?.rows || [];
  const managerOptions = hiringManagers.length > 0 ? hiringManagers : allEmployees;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in-up">
      {/* Left Column: Form Fields */}
      <div className="lg:col-span-8 space-y-6">
        {/* ROLE OVERVIEW */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
          <div className="mb-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Overview</span>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Role Overview</h3>
            <p className="text-[11px] text-slate-400 font-medium">Define how the role appears to candidates.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 ml-1">Job Title</label>
              <input
                type="text"
                placeholder="Senior Product Designer"
                className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-500 rounded-xl px-4 py-3 text-xs text-slate-800 font-semibold focus:outline-none transition-all"
                value={data.jobTitle}
                onChange={(e) => updateData({ jobTitle: e.currentTarget.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 ml-1">Number of Openings</label>
              <input
                type="number"
                className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-500 rounded-xl px-4 py-3 text-xs text-slate-800 font-semibold focus:outline-none transition-all"
                value={data.openings}
                onChange={(e) => updateData({ openings: parseInt(e.currentTarget.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 ml-1">City</label>
              <input
                type="text"
                placeholder="addis ababa"
                className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-500 rounded-xl px-4 py-3 text-xs text-slate-800 font-semibold focus:outline-none transition-all"
                value={data.city}
                onChange={(e) => updateData({ city: e.currentTarget.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 ml-1">Country</label>
              <input
                type="text"
                placeholder="Ethiopia"
                className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-500 rounded-xl px-4 py-3 text-xs text-slate-800 font-semibold focus:outline-none transition-all"
                value={data.country}
                onChange={(e) => updateData({ country: e.currentTarget.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 ml-1">Work Location Type</label>
              <select 
                className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-500 rounded-xl px-4 py-3 text-xs text-slate-800 font-semibold focus:outline-none transition-all cursor-pointer"
                value={data.locationType}
                onChange={(e) => updateData({ locationType: e.currentTarget.value })}
              >
                <option value="On-site">On-site</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 ml-1">Employment Type</label>
              <select 
                className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-500 rounded-xl px-4 py-3 text-xs text-slate-800 font-semibold focus:outline-none transition-all cursor-pointer"
                value={data.employmentType}
                onChange={(e) => updateData({ employmentType: e.currentTarget.value })}
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 ml-1">Contract Type</label>
              <select 
                className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-500 rounded-xl px-4 py-3 text-xs text-slate-800 font-semibold focus:outline-none transition-all cursor-pointer"
                value={data.contractType}
                onChange={(e) => updateData({ contractType: e.currentTarget.value })}
              >
                <option value="Permanent">Permanent</option>
                <option value="Fixed-term">Fixed-term</option>
                <option value="Freelance">Freelance</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 ml-1">Experience Level</label>
              <select 
                className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-500 rounded-xl px-4 py-3 text-xs text-slate-800 font-semibold focus:outline-none transition-all cursor-pointer"
                value={data.experienceLevel}
                onChange={(e) => updateData({ experienceLevel: e.currentTarget.value })}
              >
                <option value="Junior Level">Junior Level</option>
                <option value="Mid Level">Mid Level</option>
                <option value="Senior Level">Senior Level</option>
                <option value="Lead Level">Lead Level</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 ml-1">Hiring Manager</label>
              <Select
                value={data.hiringManager}
                onValueChange={(value) => updateData({ hiringManager: value })}
                disabled={managersLoading || employeesLoading || managerOptions.length === 0}
              >
                <SelectTrigger className="w-full h-11 bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-500 rounded-xl px-4 py-3 text-xs text-slate-800 font-semibold transition-all cursor-pointer">
                  <SelectValue placeholder={managersLoading || employeesLoading ? 'Loading managers...' : 'Select hiring manager'} />
                </SelectTrigger>
                <SelectContent>
                  {managerOptions.length > 0 ? (
                    managerOptions.map((manager: User) => (
                      <SelectItem key={manager.id} value={manager.fullName}>
                        {manager.fullName}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-xs font-semibold text-slate-400">
                      No hiring managers found
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 ml-1">Application Deadline</label>
              <input
                type="date"
                className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-500 rounded-xl px-4 py-3 text-xs text-slate-800 font-semibold focus:outline-none transition-all"
                value={data.deadline}
                onChange={(e) => updateData({ deadline: e.currentTarget.value })}
              />
            </div>
          </div>
        </div>

        {/* ABOUT THE ROLE */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
          <div className="mb-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Overview</span>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">About The Role</h3>
            <p className="text-[11px] text-slate-400 font-medium">Write the opening summary and your value proposition.</p>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 ml-1">Job Description</label>
              <textarea
                placeholder="Describe the role, responsibilities, and what makes this opportunity exciting..."
                className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-500 rounded-xl px-4 py-3 text-xs text-slate-800 font-semibold focus:outline-none transition-all min-h-[120px] resize-none"
                value={data.description}
                onChange={(e) => updateData({ description: e.currentTarget.value })}
              />
              <p className="text-[10px] text-slate-400 px-1 font-medium italic">Keep it clear, candidate-facing, and easy to scan.</p>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 ml-1">Summary (Why Join Us)</label>
              <textarea
                placeholder="Share the team culture, growth opportunities, or mission that makes this role compelling."
                className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-500 rounded-xl px-4 py-3 text-xs text-slate-800 font-semibold focus:outline-none transition-all min-h-[100px] resize-none"
                value={data.summary}
                onChange={(e) => updateData({ summary: e.currentTarget.value })}
              />
            </div>
          </div>
        </div>

        {/* REQUIREMENTS */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
          <div className="mb-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Requirements</span>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Responsibilities & Skills</h3>
            <p className="text-[11px] text-slate-400 font-medium">Use one item per line for lists.</p>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 ml-1">Key Responsibilities</label>
              <textarea
                className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-500 rounded-xl px-4 py-3 text-xs text-slate-800 font-semibold focus:outline-none transition-all min-h-[100px] resize-none"
                value={data.responsibilities}
                onChange={(e) => updateData({ responsibilities: e.currentTarget.value })}
              />
              <p className="text-[9px] text-slate-400 px-1 font-medium italic uppercase tracking-wider">Add one responsibility per line.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-600 ml-1">Required Skills</label>
                <textarea
                  className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-500 rounded-xl px-4 py-3 text-xs text-slate-800 font-semibold focus:outline-none transition-all min-h-[100px] resize-none"
                  value={data.requiredSkills}
                  onChange={(e) => updateData({ requiredSkills: e.currentTarget.value })}
                />
                <p className="text-[9px] text-slate-400 px-1 font-medium italic uppercase tracking-wider">Add one skill per line.</p>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-600 ml-1">Preferred Skills</label>
                <textarea
                  className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-500 rounded-xl px-4 py-3 text-xs text-slate-800 font-semibold focus:outline-none transition-all min-h-[100px] resize-none"
                  value={data.preferredSkills}
                  onChange={(e) => updateData({ preferredSkills: e.currentTarget.value })}
                />
                <p className="text-[9px] text-slate-400 px-1 font-medium italic uppercase tracking-wider">Add one skill per line.</p>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-600 ml-1">Tools</label>
                <textarea
                  className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-500 rounded-xl px-4 py-3 text-xs text-slate-800 font-semibold focus:outline-none transition-all min-h-[100px] resize-none"
                  value={data.tools}
                  onChange={(e) => updateData({ tools: e.currentTarget.value })}
                />
                <p className="text-[9px] text-slate-400 px-1 font-medium italic uppercase tracking-wider">Add one tool per line.</p>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-600 ml-1">Benefits</label>
                <textarea
                  className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-500 rounded-xl px-4 py-3 text-xs text-slate-800 font-semibold focus:outline-none transition-all min-h-[100px] resize-none"
                  value={data.benefits}
                  onChange={(e) => updateData({ benefits: e.currentTarget.value })}
                />
                <p className="text-[9px] text-slate-400 px-1 font-medium italic uppercase tracking-wider">Add one benefit per line.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Compensation and Summary */}
      <div className="lg:col-span-4 space-y-6">
        {/* COMPENSATION */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
          <div className="mb-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Compensation</span>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Salary & Benefits</h3>
            <p className="text-[11px] text-slate-400 font-medium">Choose how salary should appear on the job post.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-600">Salary Type</label>
            <select 
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none"
              value={data.salaryType}
              onChange={(e) => updateData({ salaryType: e.currentTarget.value })}
            >
              <option value="Not Specified">Not Specified</option>
              <option value="Range">Range</option>
              <option value="Fixed">Fixed</option>
            </select>
          </div>
        </div>

        {/* LIVE SUMMARY */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
          <div className="mb-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Summary</span>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Job Post Snapshot</h3>
          </div>

          <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 flex flex-col gap-4">
             <div className="space-y-1">
                <h4 className="text-[13px] font-extrabold text-slate-900">{data.jobTitle || 'Untitled role request'}</h4>
                <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-bold text-slate-500 uppercase">
                        {data.city || 'not set'}
                    </span>
                    <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-bold text-slate-600">
                        {data.locationType}
                    </span>
                    <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-bold text-slate-600">
                        {data.employmentType}
                    </span>
                </div>
             </div>

             <div className="space-y-2 border-t border-slate-100 pt-4">
                {[
                    { label: 'Openings', value: data.openings },
                    { label: 'Hiring manager', value: data.hiringManager || 'Not set' },
                    { label: 'Contract type', value: data.contractType },
                    { label: 'Experience level', value: data.experienceLevel },
                    { label: 'Responsibilities', value: data.responsibilities ? 'Custom set' : 'Not set' },
                    { label: 'Required skills', value: data.requiredSkills ? 'Custom set' : 'Not set' },
                    { label: 'Preferred skills', value: data.preferredSkills ? 'Custom set' : 'Not set' },
                    { label: 'Tools', value: data.tools ? 'Custom set' : 'Not set' },
                    { label: 'Salary', value: data.salaryType },
                    { label: 'Benefits', value: data.benefits ? 'Custom set' : 'Not set' },
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
