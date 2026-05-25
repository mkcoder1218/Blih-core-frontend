/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Bell, Grid, Sparkles, Brain, X, Send, Loader2 } from 'lucide-react';
import { MainModule, RecruitmentTab } from '../../types';

interface HeaderProps {
  currentModule: MainModule;
  currentRecruitmentTab: RecruitmentTab;
  isDetailedView: boolean;
  onOpenAiHelper: (suggestType: string) => void;
}

export default function Header({
  currentModule,
  currentRecruitmentTab,
  isDetailedView,
  onOpenAiHelper,
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);

  const getBreadcrumbTitle = () => {
    if (!isDetailedView) {
      return {
        main: 'HR Dashboard',
        sub: 'Overview',
      };
    }

    let mainText = 'Recruitment & Hiring';
    if (currentModule === 'onboarding') mainText = 'Onboarding & Probation';
    if (currentModule === 'profiles') mainText = 'People Profiles';
    if (currentModule === 'attendance') mainText = 'Attendance & Leave';
    if (currentModule === 'performance') mainText = 'Performance';
    if (currentModule === 'talent') mainText = 'Career Management';
    if (currentModule === 'exit') mainText = 'Exit & Off boarding';
    if (currentModule === 'finance') mainText = 'Workforce Finance';

    return {
      main: mainText,
      sub: 'HR Dashboard',
    };
  };

  const { main, sub } = getBreadcrumbTitle();

  return (
    <header className="h-[68px] bg-white border-b border-slate-100 px-6 sm:px-8 flex items-center justify-between flex-shrink-0 relative z-30">
      {/* Page Context Breadcrumbs */}
      <div>
        <h2 className="text-sm font-bold text-slate-900 tracking-tight leading-none">
          {main}
        </h2>
        <span className="text-[11px] font-semibold text-blue-600 tracking-tight mt-1 block">
          {sub}
        </span>
      </div>

      {/* Actions: Snap AI, Notification Bell, App Switcher Grid */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Snap AI Smart trigger */}
        <button
          onClick={() => onOpenAiHelper('general')}
          className="bg-[#f2f6ff] hover:bg-[#e6eeff] active:bg-[#d8e5ff] text-blue-700 hover:text-blue-800 border border-blue-100 rounded-full px-3.5 py-1.5 flex items-center gap-1.5 text-xs font-semibold cursor-pointer select-none transition-all shadow-xs hover:shadow-xs hover:shadow-blue-100"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
          <span>Snap AI</span>
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer relative"
          >
            <Bell className="w-5 h-5 text-slate-700" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white" />
          </button>

          {/* Quick Notifications Popover */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-100 py-2 text-slate-800 z-50">
              <div className="px-4 py-2 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                <span className="text-xs font-bold text-slate-800">Notifications</span>
                <span className="text-[10px] text-blue-600 font-semibold hover:underline cursor-pointer">Mark all as read</span>
              </div>
              <div className="max-h-60 overflow-y-auto">
                <div className="px-4 py-3 hover:bg-slate-50/70 border-b border-slate-50 transition-colors cursor-pointer">
                  <p className="text-xs font-semibold text-slate-900">New job posting approved!</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Marketing Manager has been approved by the board.</p>
                  <p className="text-[9px] text-blue-500 font-medium mt-1">2 mins ago</p>
                </div>
                <div className="px-4 py-3 hover:bg-slate-50/70 border-b border-slate-50 transition-colors cursor-pointer">
                  <p className="text-xs font-semibold text-slate-900">Leave Approval Pending</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Aytenew Yihunie requested 5 days annual leave.</p>
                  <p className="text-[9px] text-blue-500 font-medium mt-1">1 hour ago</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 9-Dot System switcher Menu */}
        <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer">
          <Grid className="w-5 h-5 text-slate-700" />
        </button>
      </div>
    </header>
  );
}
