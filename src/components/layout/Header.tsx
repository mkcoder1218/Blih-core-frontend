import { useEffect, useRef, useState } from 'react';
import { Bell, Grid, Sparkles, Loader2, Menu } from 'lucide-react';
import { MainModule, RecruitmentTab } from '../../types';
import {
  type AppNotification,
  useNotifications,
  useUnreadCount,
  useMarkNotificationRead,
  useMarkAllRead,
  timeAgo,
} from '../../hooks/useNotifications';
import { useInterviewNotifications } from '../../hooks/useSocket';
import { useQueryClient } from '@tanstack/react-query';

interface HeaderProps {
  currentModule: MainModule;
  currentRecruitmentTab: RecruitmentTab;
  isDetailedView: boolean;
  onOpenAiHelper: (suggestType: string) => void;
  /** Mobile: callback to open the sidebar drawer */
  onMobileMenuOpen?: () => void;
  onOpenNotification?: (notification: AppNotification) => void;
}

export default function Header({
  currentModule,
  currentRecruitmentTab,
  isDetailedView,
  onOpenAiHelper,
  onMobileMenuOpen,
  onOpenNotification,
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const { data: notifications, isLoading } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadCount();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllRead();

  // Refresh notifications when a WebSocket interview event fires
  useInterviewNotifications(() => {
    qc.invalidateQueries({ queryKey: ['notifications'] });
    qc.invalidateQueries({ queryKey: ['notifications-unread-count'] });
  });

  // Close popover on outside click
  useEffect(() => {
    if (!showNotifications) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNotifications]);

  const getBreadcrumbTitle = () => {
    if (!isDetailedView) return { main: 'HR Dashboard', sub: 'Overview' };
    let mainText = 'Recruitment & Hiring';
    if (currentModule === 'onboarding') mainText = 'Onboarding & Probation';
    if (currentModule === 'profiles')   mainText = 'People Profiles';
    if (currentModule === 'attendance') mainText = 'Attendance & Leave';
    if (currentModule === 'performance') mainText = 'Performance';
    if (currentModule === 'talent')     mainText = 'Talent Management';
    if (currentModule === 'exit')       mainText = 'Exit & Off boarding';
    if (currentModule === 'finance')    mainText = 'Workforce Finance';
    if (currentModule === 'projects')   mainText = 'Projects';
    if (currentModule === 'subscription-settings') mainText = 'Subscription & Settings';
    return { main: mainText, sub: 'HR Dashboard' };
  };

  const { main, sub } = getBreadcrumbTitle();
  const hasUnread = unreadCount > 0;

  const handleNotificationClick = (notification: AppNotification) => {
    if (notification.status === 'unread') markRead.mutate(notification.id);
    onOpenNotification?.(notification);
    setShowNotifications(false);
  };

  return (
    <header className="h-[68px] bg-white border-b border-slate-100 px-4 sm:px-6 lg:px-8 flex items-center justify-between flex-shrink-0 relative z-30">
      {/* Left: hamburger (mobile) + breadcrumb */}
      <div className="flex items-center gap-3">
        {/* Hamburger — only visible on mobile/tablet */}
        <button
          onClick={onMobileMenuOpen}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer flex-shrink-0"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5 text-slate-700" />
        </button>

        {/* Breadcrumb */}
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight leading-none">{main}</h2>
          <span className="text-[11px] font-semibold text-blue-600 tracking-tight mt-1 block">{sub}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Snap AI */}
        <button
          onClick={() => onOpenAiHelper('general')}
          className="bg-[#f2f6ff] hover:bg-[#e6eeff] active:bg-[#d8e5ff] text-blue-700 border border-blue-100 rounded-full px-3 sm:px-3.5 py-1.5 flex items-center gap-1.5 text-xs font-semibold cursor-pointer select-none transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
          <span className="hidden sm:inline">Snap AI</span>
        </button>

        {/* Notification Bell */}
        <div className="relative" ref={popoverRef}>
          <button
            onClick={() => setShowNotifications(v => !v)}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer relative"
          >
            <Bell className="w-5 h-5 text-slate-700" />
            {hasUnread && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
            )}
          </button>

          {/* Popover */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">
              {/* Header */}
              <div className="px-5 py-3.5 flex items-center justify-between border-b border-slate-100">
                <span className="text-[13px] font-black text-slate-900">Notifications</span>
                <button
                  onClick={() => markAll.mutate()}
                  disabled={markAll.isPending || !hasUnread}
                  className="text-[11px] text-blue-600 font-bold hover:underline disabled:opacity-40 disabled:no-underline transition-opacity"
                >
                  Mark all as read
                </button>
              </div>

              {/* List */}
              <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-50">
                {isLoading && (
                  <div className="flex items-center justify-center py-10 gap-2 text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-xs font-semibold">Loading…</span>
                  </div>
                )}

                {!isLoading && (!notifications || notifications.length === 0) && (
                  <div className="py-10 text-center">
                    <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-400">No notifications yet</p>
                  </div>
                )}

                {(notifications || []).map(n => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`px-5 py-4 cursor-pointer transition-colors hover:bg-slate-50 ${
                      n.status === 'unread' ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {n.status === 'unread' && (
                        <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                      )}
                      <div className={n.status === 'unread' ? '' : 'pl-4'}>
                        <p className="text-[12px] font-black text-slate-900 leading-snug">{n.title}</p>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-snug">{n.message}</p>
                        <p className="text-[10px] text-blue-500 font-bold mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* App switcher */}
        <button className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer">
          <Grid className="w-5 h-5 text-slate-700" />
        </button>
      </div>
    </header>
  );
}
