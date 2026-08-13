import { useEffect, useRef, useState } from "react";
import { Bell, FlaskConical, Loader2, Menu, Moon, Sun } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import type { MainModule, RecruitmentTab } from "../../types";
import {
  type AppNotification,
  timeAgo,
  useMarkAllRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadCount,
} from "../../hooks/useNotifications";
import { useInterviewNotifications } from "../../hooks/useSocket";
import { useTesterSession } from "../../hooks/useTesterControl";
import { useTheme } from "../../contexts/ThemeContext";
import HeaderWorkStatus from "./HeaderWorkStatus";

interface HeaderProps {
  currentModule: MainModule;
  currentRecruitmentTab: RecruitmentTab;
  isDetailedView: boolean;
  onOpenAiHelper: (suggestType: string) => void;
  onMobileMenuOpen?: () => void;
  onOpenNotification?: (notification: AppNotification) => void;
  onShowAlert?: (message: string, type?: "success" | "info" | "error") => void;
}

export default function Header({
  currentModule,
  currentRecruitmentTab: _currentRecruitmentTab,
  isDetailedView,
  onOpenAiHelper: _onOpenAiHelper,
  onMobileMenuOpen,
  onOpenNotification,
  onShowAlert,
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const location = useLocation();
  const testerSession = useTesterSession();
  const { theme, toggleTheme } = useTheme();

  const isTestAccount = Boolean(testerSession.data?.isTestAccount);
  const isMasterTester = Boolean(testerSession.data?.isMasterTester);
  const { data: notifications, isLoading } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadCount();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllRead();

  useInterviewNotifications(() => {
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
  });

  useEffect(() => {
    if (!showNotifications) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showNotifications]);

  const getBreadcrumbTitle = () => {
    if (location.pathname === "/tester-control") {
      return {
        main: "Tester Control Center",
        sub: isMasterTester ? "Master Tester" : "Test Account",
      };
    }

    if (!isDetailedView) return { main: "HR Dashboard", sub: "Overview" };

    if (location.pathname.includes("/settings") || location.pathname.endsWith("/subscription")) {
      return { main: "Subscription & Settings", sub: "HR Dashboard" };
    }

    let mainText = "Recruitment & Hiring";
    if (currentModule === "onboarding") mainText = "Onboarding & Probation";
    if (currentModule === "profiles") mainText = "People Profiles";
    if (currentModule === "attendance") mainText = "Attendance & Leave";
    if (currentModule === "performance") mainText = "Performance";
    if (currentModule === "talent") mainText = "Talent Management";
    if (currentModule === "exit") mainText = "Exit & Offboarding";
    if (currentModule === "finance") mainText = "Workforce Finance";
    if (currentModule === "brain") mainText = "Brain & E-Policies";
    if (currentModule === "projects") mainText = "Projects";
    if (currentModule === "subscription-settings") mainText = "Subscription & Settings";

    return { main: mainText, sub: "HR Dashboard" };
  };

  const { main, sub } = getBreadcrumbTitle();
  const hasUnreadNotifications = unreadCount > 0;

  const handleNotificationClick = (notification: AppNotification) => {
    if (notification.status === "unread") markRead.mutate(notification.id);
    onOpenNotification?.(notification);
    setShowNotifications(false);
  };

  return (
    <header className="relative z-30 shrink-0 border-b border-border bg-background text-foreground">
      <div className="flex h-[68px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            onClick={onMobileMenuOpen}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold leading-none tracking-tight text-foreground">{main}</h2>
            <span className="mt-1 block truncate text-[11px] font-medium tracking-tight text-primary">{sub}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {isTestAccount ? (
            <div className="hidden items-center gap-1.5 rounded-full border border-amber-300/40 bg-amber-500/10 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-300 sm:flex">
              <FlaskConical className="h-3.5 w-3.5" />
              {isMasterTester ? "Master Tester" : "Test Account"}
            </div>
          ) : null}

          <div className="hidden lg:block">
            <HeaderWorkStatus
              onSuccess={(message) => onShowAlert?.(message, "success")}
              onError={(message) => onShowAlert?.(message, "error")}
            />
          </div>

          <div className="relative" ref={popoverRef}>
            <button
              type="button"
              onClick={() => setShowNotifications((current) => !current)}
              className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Notifications"
              aria-expanded={showNotifications}
            >
              <Bell className="h-5 w-5" />
              {hasUnreadNotifications ? (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border border-background bg-red-500" />
              ) : null}
            </button>

            {showNotifications ? (
              <div className="fixed left-4 right-4 top-[76px] z-50 overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-80">
                <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
                  <span className="text-[13px] font-semibold">Notifications</span>
                  <button
                    type="button"
                    onClick={() => markAll.mutate()}
                    disabled={markAll.isPending || !hasUnreadNotifications}
                    className="text-[11px] font-medium text-primary transition-opacity hover:underline disabled:opacity-40 disabled:no-underline"
                  >
                    Mark all as read
                  </button>
                </div>

                <div className="max-h-[min(360px,calc(100vh-120px))] divide-y divide-border overflow-y-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-xs font-medium">Loading…</span>
                    </div>
                  ) : null}

                  {!isLoading && (!notifications || notifications.length === 0) ? (
                    <div className="py-10 text-center text-muted-foreground">
                      <Bell className="mx-auto mb-2 h-8 w-8 opacity-30" />
                      <p className="text-xs font-medium">No notifications yet</p>
                    </div>
                  ) : null}

                  {(notifications ?? []).map((notification) => (
                    <button
                      type="button"
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={[
                        "block w-full cursor-pointer px-5 py-4 text-left transition-colors hover:bg-muted",
                        notification.status === "unread" ? "bg-primary/5" : "",
                      ].join(" ")}
                    >
                      <div className="flex items-start gap-2">
                        {notification.status === "unread" ? (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        ) : null}
                        <div className={notification.status === "unread" ? "min-w-0" : "min-w-0 pl-4"}>
                          <p className="text-[12px] font-semibold leading-snug text-foreground">{notification.title}</p>
                          <p className="mt-0.5 text-[11px] font-normal leading-snug text-muted-foreground">{notification.message}</p>
                          <p className="mt-1 text-[10px] font-medium text-primary">{timeAgo(notification.createdAt)}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div className="border-t border-border px-4 py-2.5 lg:hidden">
        <div className="w-full overflow-x-auto">
          <div className="min-w-max">
            <HeaderWorkStatus
              onSuccess={(message) => onShowAlert?.(message, "success")}
              onError={(message) => onShowAlert?.(message, "error")}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
