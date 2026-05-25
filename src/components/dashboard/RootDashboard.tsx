/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { mockRecentActivities, mockPendingActions } from '../../mockData';
import { MainModule } from '../../types';
import { ChevronRight, ArrowUpRight, ArrowDownRight, Activity, ClipboardList, Briefcase, FileCheck, CircleUser, Layers } from 'lucide-react';

interface RootDashboardProps {
  onNavigateToModule: (module: MainModule) => void;
}

export default function RootDashboard({ onNavigateToModule }: RootDashboardProps) {
  const metrics = [
    {
      title: 'Pending Requests',
      value: '12',
      change: null,
      color: 'border-blue-500/20',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Active Recruitments',
      value: '28',
      change: '-3%',
      isNegative: true,
      color: 'border-rose-500/20',
      iconColor: 'text-rose-600',
    },
    {
      title: 'Total Employees',
      value: '45',
      change: '70%',
      isNegative: false,
      color: 'border-emerald-500/20',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'Monthly Payroll',
      value: '12',
      change: null,
      color: 'border-violet-500/20',
      iconColor: 'text-violet-600',
    },
    {
      title: 'Avg Performance',
      value: '2.3d',
      change: null,
      color: 'border-amber-500/20',
      iconColor: 'text-amber-600',
    },
    {
      title: 'Leave Requests',
      value: '45',
      change: null,
      color: 'border-sky-500/20',
      iconColor: 'text-sky-600',
    },
  ];

  return (
    <div id="root-dashboard-view" className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {metrics.map((metric, i) => (
          <div
            key={i}
            className={`bg-white rounded-2xl border ${metric.color} p-5 shadow-xs transition-all hover:shadow-md hover:translate-y-[-1px]`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-bold text-slate-500 tracking-tight uppercase">
                  {metric.title}
                </p>
                <h3 className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
                  {metric.value}
                </h3>
              </div>
              {metric.change !== null && (
                <span
                  className={`inline-flex items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-bold leading-none ${
                    metric.isNegative
                      ? 'bg-rose-50 text-rose-600'
                      : 'bg-emerald-50 text-emerald-600'
                  }`}
                >
                  {metric.isNegative ? (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  )}
                  {metric.change}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Activities and Actions Half-Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Activities Panel */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <Activity className="w-4.5 h-4.5" />
                </div>
                <h4 className="text-[14px] font-bold text-slate-950 tracking-tight">Recent Activities</h4>
              </div>
            </div>

            <div className="space-y-4">
              {mockRecentActivities.map((act) => {
                const isCompleted = act.status === 'completed';
                const isActive = act.status === 'active';
                const isPending = act.status === 'pending';
                const isScheduled = act.status === 'scheduled';

                let statusBadge = (
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {act.status}
                  </span>
                );

                if (isActive) {
                  statusBadge = (
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-600">
                      active
                    </span>
                  );
                } else if (isPending) {
                  statusBadge = (
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-600">
                      pending
                    </span>
                  );
                } else if (isScheduled) {
                  statusBadge = (
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-600">
                      scheduled
                    </span>
                  );
                }

                return (
                  <div
                    key={act.id}
                    onClick={() => onNavigateToModule(act.module)}
                    className="flex items-start justify-between p-3.5 hover:bg-slate-50/50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-slate-100/70"
                  >
                    <div className="space-y-0.5 pr-2">
                      <h5 className="text-[12px] font-bold text-slate-800">{act.title}</h5>
                      <p className="text-[11px] text-slate-500 leading-tight">{act.description}</p>
                      <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-wider">{act.timeLabel}</p>
                    </div>
                    <div className="flex-shrink-0">{statusBadge}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Pending Actions Panel */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                  <ClipboardList className="w-4.5 h-4.5" />
                </div>
                <h4 className="text-[14px] font-bold text-slate-950 tracking-tight">Pending Actions</h4>
              </div>
            </div>

            <div className="space-y-3">
              {mockPendingActions.map((action) => (
                <div
                  key={action.id}
                  onClick={() => onNavigateToModule(action.module)}
                  className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl transition-all cursor-pointer border border-transparent hover:border-slate-200"
                >
                  <div className="space-y-0.5 pr-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{action.title}</span>
                    <p className="text-[11px] text-slate-600 font-medium leading-tight">{action.subtitle}</p>
                  </div>
                  <span className="w-7 h-7 bg-blue-600 text-[11px] font-extrabold text-white rounded-full flex items-center justify-center shadow-xs">
                    {action.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
