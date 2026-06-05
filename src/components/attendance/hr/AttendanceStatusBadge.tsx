/**
 * AttendanceStatusBadge — thin re-export of the shared StatusBadge.
 * Kept for backwards compatibility; new code should import StatusBadge directly.
 *
 *   import { StatusBadge } from '@/components/ui/blih';
 */
import React from "react";
import { StatusBadge } from "@/components/ui/blih";

export default function AttendanceStatusBadge({ status }: { status: string }) {
  return <StatusBadge status={status} />;
}
