/**
 * PageHeader — Blih ERP shared page heading.
 *
 * Provides a compact page title area with:
 * - optional eyebrow / breadcrumb text
 * - title
 * - description
 * - right-aligned actions
 * - subtle bottom divider
 *
 * Usage:
 *
 * <PageHeader
 *   eyebrow="HR / Attendance"
 *   title="Check-ins Monitoring"
 *   description="Review today's attendance and exceptions."
 *   actions={<Button>Export</Button>}
 * />
 */

import React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  /**
   * Small contextual label displayed above the title.
   * Examples:
   * - HR / Attendance
   * - Business Attendance
   * - Recruitment
   */
  eyebrow?: string;

  /**
   * Preserved for backward compatibility.
   * The simplified header intentionally uses one neutral text style.
   */
  eyebrowTone?:
    | "blue"
    | "violet"
    | "emerald"
    | "amber"
    | "rose"
    | "slate";

  title: string;
  description?: string;

  /**
   * Right-aligned action area.
   * Pass buttons, dropdowns, or other compact controls.
   */
  actions?: React.ReactNode;

  className?: string;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 border-b border-slate-200 pb-5",
        "sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-xs font-medium text-slate-500">
            {eyebrow}
          </p>
        ) : null}

        <h1
          className={cn(
            "text-2xl font-semibold tracking-tight text-slate-950",
            eyebrow ? "mt-1" : "",
          )}
        >
          {title}
        </h1>

        {description ? (
          <p className="mt-1 max-w-4xl text-sm font-normal leading-6 text-slate-500">
            {description}
          </p>
        ) : null}
      </div>

      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
