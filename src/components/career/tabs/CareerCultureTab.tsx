/**
 * Career Management — Culture Tab
 * Modular component extracted from CareerManagementView.tsx
 */
import { Bookmark, UserCheck, Building, Calendar, ExternalLink } from 'lucide-react';
import { PageHeader, SectionCard } from '@/components/ui/blih';
import { Button } from '@/components/ui/button';

interface CareerCultureTabProps {
  showAlert: (title: string, type?: 'success' | 'info' | 'error') => void;
}

const POLICIES = [
  { id: 'pol-1', title: 'Company Values & Mission',        icon: Bookmark,  desc: 'Our core values guide everything we do, from hiring to daily operations.',              updated: '2024-01-15' },
  { id: 'pol-2', title: 'Code of Conduct',                  icon: UserCheck, desc: 'Professional standards and behavioral expectations for all employees.',                  updated: '2024-02-01' },
  { id: 'pol-3', title: 'Diversity & Inclusion Policy',     icon: Building,  desc: 'Our commitment to creating an inclusive workplace for everyone.',                       updated: '2024-01-20' },
  { id: 'pol-4', title: 'Work-Life Balance Guidelines',     icon: Calendar,  desc: 'Policies supporting employee wellbeing and flexible work arrangements.',                updated: '2024-02-10' },
];

const INITIATIVES = [
  { id: 'ini-1', title: 'Innovation Fridays',  status: 'active', desc: 'Dedicated time every Friday afternoon for employees to work on passion projects.', timeline: 'Ongoing — Started Jan 2024', assignedTo: 'Engineering & Product Teams', participants: 45, avatars: ['JS','SJ','MB','ER'], extra: 41 },
  { id: 'ini-2', title: 'Wellness Wednesdays', status: 'active', desc: 'Weekly wellness activities including yoga, meditation, and health workshops.', timeline: 'Ongoing — Started Feb 2024', assignedTo: 'All Departments', participants: 120, avatars: ['SL','DL','LM','TA'], extra: 116 },
  { id: 'ini-3', title: 'Mentorship Circles',  status: 'active', desc: 'Monthly peer mentorship groups pairing senior staff with newer team members.', timeline: 'Ongoing — Started Mar 2024', assignedTo: 'All Departments', participants: 60, avatars: ['SJ','ER','MB','DL'], extra: 56 },
  { id: 'ini-4', title: 'Learning Thursdays',  status: 'active', desc: 'Weekly 90-min knowledge-sharing sessions open to all staff.', timeline: 'Ongoing — Started Jan 2024', assignedTo: 'All Departments', participants: 98, avatars: ['JS','LM','TA','SL'], extra: 94 },
];

const METRICS = [
  { label: 'Employee Satisfaction', value: '92%' },
  { label: 'Program Participants',  value: '465' },
  { label: 'Active Initiatives',    value: '6'   },
  { label: 'Culture Score',         value: '8.4' },
];

export default function CareerCultureTab({ showAlert }: CareerCultureTabProps) {
  return (
    <div className="space-y-6">
      <PageHeader title="Culture & Policies" description="Company values, active initiatives, and culture impact metrics." />

      {/* Policy Documents */}
      <SectionCard title="Company Culture & Values" icon={<Bookmark />} accent="blue">
        <p className="text-xs text-slate-500 mb-5 leading-relaxed">
          Our culture is built on innovation, collaboration, and continuous learning — where every employee can thrive.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {POLICIES.map(pol => {
            const Icon = pol.icon;
            return (
              <div key={pol.id} className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex items-start justify-between">
                <div className="space-y-2 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-900">{pol.title}</h3>
                  </div>
                  <p className="text-xs text-slate-500">{pol.desc}</p>
                  <p className="text-[9px] text-slate-400 font-mono">Updated: {pol.updated}</p>
                </div>
                <Button variant="outline" size="sm" className="gap-1.5 whitespace-nowrap flex-shrink-0" onClick={() => showAlert(`Opening Policy Documentation: ${pol.title}`, 'success')}>
                  <span>Read Policy</span>
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* Active Initiatives */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900 tracking-tight">Active Culture Initiatives</h2>
        <span className="bg-blue-600 text-white font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase">
          {INITIATIVES.length} Programs
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {INITIATIVES.map(ini => (
          <div key={ini.id} className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900">{ini.title}</h3>
                <span className="bg-blue-50 text-blue-600 text-[10px] uppercase font-bold px-2 py-0.5 border border-blue-100 rounded-md">{ini.status}</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{ini.desc}</p>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-[11px] font-medium text-slate-500 space-y-2">
                <p className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Timeline: <b className="text-slate-800">{ini.timeline}</b></span>
                </p>
                <p className="flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span>Assigned To: <b className="text-slate-800">{ini.assignedTo}</b></span>
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-5 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-bold">Participants ({ini.participants})</span>
                <div className="flex -space-x-1.5">
                  {ini.avatars.map((a, i) => (
                    <div key={i} className="w-6 h-6 rounded-full bg-slate-200 border border-white flex items-center justify-center text-[9px] font-bold text-slate-600">{a}</div>
                  ))}
                  <div className="w-6 h-6 rounded-full bg-blue-600 border border-white flex items-center justify-center text-[9px] font-bold text-white">+{ini.extra}</div>
                </div>
              </div>
              <button onClick={() => showAlert(`Opening ${ini.title} details.`, 'info')} className="flex items-center gap-1 hover:underline text-xs text-slate-600 font-semibold">
                <span>Full Details</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Culture Metrics */}
      <SectionCard title="Culture Impact Metrics" icon={<UserCheck />} accent="blue">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {METRICS.map(m => (
            <div key={m.label} className="bg-slate-50 border border-slate-100 rounded-xl p-5 text-center">
              <p className="text-3xl font-black text-blue-600">{m.value}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">{m.label}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
