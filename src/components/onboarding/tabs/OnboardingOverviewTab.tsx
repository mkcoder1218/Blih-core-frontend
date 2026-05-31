import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { UserPlus, CheckCircle, Clock, Calendar, TrendingUp, CheckSquare } from 'lucide-react';

const lineChartData = [
  { name: 'Jan', count: 125 }, { name: 'Feb', count: 140 }, { name: 'Mar', count: 155 },
  { name: 'Apr', count: 95 },  { name: 'May', count: 148 }, { name: 'Jun', count: 142 },
  { name: 'Jul', count: 175 }, { name: 'Aug', count: 114 }, { name: 'Sep', count: 146 },
  { name: 'Oct', count: 152 }, { name: 'Nov', count: 141 }, { name: 'Dec', count: 105 },
];

export default function OnboardingOverviewTab() {
  return (
    <div id="tab-overview-pane" className="space-y-6 animate-fade-in font-sans pb-12">
      {/* Top Summary row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: 'Active Onboarding', value: 12, icon: <UserPlus className="w-5 h-5" /> },
          { label: 'Completed This Month', value: 28, icon: <CheckCircle className="w-5 h-5" /> },
          { label: 'On Probation', value: 45, icon: <Clock className="w-5 h-5" /> },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-center">
            <div>
              <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">{label}</p>
              <h3 className="text-3xl font-black text-slate-900 mt-2 tracking-tight">{value}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">{icon}</div>
          </div>
        ))}
      </div>

      {/* Work Hours Performance */}
      <div className="space-y-3">
        <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Work Hours Performance</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { label: 'Daily', value: '8.5h', target: '8h', pct: '108%', icon: <Clock className="w-4 h-4" /> },
            { label: 'Monthly', value: '168h', target: '160h', pct: '105%', icon: <Calendar className="w-4 h-4" /> },
            { label: 'Annually', value: '2016h', target: '1920h', pct: '105%', icon: <TrendingUp className="w-4 h-4" /> },
          ].map(({ label, value, target, pct, icon }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">{label}</span>
                  <h3 className="text-2xl font-black text-blue-600 mt-1">{value}</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Target: {target}</p>
                </div>
                <div className="text-blue-600 bg-blue-50/70 p-1.5 rounded-lg">{icon}</div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1.5">
                  <span>Performance</span>
                  <span className="text-blue-600">{pct}</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Job Application Frequency Chart */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Job Application Frequency</h4>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-normal">Monthly metric registry</span>
        </div>
        <div className="h-[210px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 180]} ticks={[0, 45, 90, 135, 180]} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(value) => [`${value} Apps`, 'Applications']} />
              <Line type="monotone" dataKey="count" stroke="#1d4ed8" strokeWidth={2.5} dot={{ fill: '#1d4ed8', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: 'Total Checklists', value: 3, icon: <CheckSquare className="w-5 h-5" /> },
          { label: 'Total Items', value: 37, icon: <CheckSquare className="w-5 h-5" /> },
          { label: 'Times Used', value: 28, icon: <Calendar className="w-5 h-5" /> },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-center">
            <div>
              <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">{label}</span>
              <h4 className="text-2xl font-black text-slate-900 mt-2">{value}</h4>
            </div>
            <div className="text-blue-500">{icon}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
