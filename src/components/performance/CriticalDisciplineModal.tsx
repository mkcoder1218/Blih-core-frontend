import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertOctagon, ShieldAlert } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UserAvatar, StatusBadge } from '@/components/ui/blih';
import { useCriticalDisciplinaryCases } from '../../hooks/useDisciplinary';
import { useMe } from '../../hooks/useMe';

function roleSegment(role?: string) {
  if (role === 'Super Admin') return 'super-admin';
  if (role === 'Business Admin') return 'business-admin';
  if (role === 'HR Manager') return 'hr-manager';
  return 'employee';
}

function scoreLabel(metadata: Record<string, any> | undefined) {
  const raw = metadata?.score;
  return raw ? `${raw}/10` : '10/10';
}

function canShowCaseForUser(metadata: Record<string, any> | undefined, role?: string) {
  const status = metadata?.notificationStatus || {};
  const isManager = role === 'Super Admin' || role === 'Business Admin' || role === 'HR Manager';
  return isManager ? Boolean(status.managersSentAt) : Boolean(status.employeesSentAt);
}

export default function CriticalDisciplineModal() {
  const navigate = useNavigate();
  const { data: meRes } = useMe();
  const { data, isLoading } = useCriticalDisciplinaryCases();
  const [open, setOpen] = useState(false);
  const cases = data?.rows ?? [];
  const userRole = meRes?.data?.user?.role;
  const userId = meRes?.data?.user?.id || 'anonymous';
  const seenKey = `critical-discipline-seen:${userId}`;
  const sentCases = cases.filter((item) => canShowCaseForUser(item.metadata, userRole));
  const unseenCases = sentCases.filter((item) => {
    try {
      if (typeof window === 'undefined') return true;
      const seen = new Set<string>(JSON.parse(localStorage.getItem(seenKey) || '[]'));
      return !seen.has(item.id);
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (!isLoading && unseenCases.length > 0) setOpen(true);
  }, [isLoading, unseenCases.length]);

  if (isLoading || unseenCases.length === 0) return null;

  const markSeen = () => {
    try {
      if (typeof window === 'undefined') return;
      const seen = new Set<string>(JSON.parse(localStorage.getItem(seenKey) || '[]'));
      unseenCases.forEach((item) => seen.add(item.id));
      localStorage.setItem(seenKey, JSON.stringify(Array.from(seen).slice(-500)));
    } catch {
      // ignore storage failures
    }
  };

  const openDiscipline = () => {
    markSeen();
    setOpen(false);
    navigate(`/${roleSegment(meRes?.data?.user?.role)}/performance/discipline`);
  };

  const dismiss = () => {
    markSeen();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => next ? setOpen(true) : dismiss()}>
      <DialogContent className="max-w-2xl rounded-3xl border-rose-200 p-0 overflow-hidden">
        <div className="bg-rose-50/70 border-b border-rose-100 px-6 py-5">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-sm font-black text-rose-950 uppercase tracking-tight flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  Critical Discipline Attention
                </DialogTitle>
                <DialogDescription className="text-xs font-semibold text-slate-600 mt-1">
                  {unseenCases.length} employee{unseenCases.length === 1 ? '' : 's'} currently require immediate review.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
            {unseenCases.map((c) => (
              <div key={c.id} className="rounded-2xl border border-rose-100 bg-white p-4 shadow-xs">
                <div className="flex items-start justify-between gap-4">
                  <UserAvatar name={c.employee?.fullName ?? 'Employee'} subtitle={c.employee?.email ?? ''} size="sm" />
                  <span className="text-[10px] text-slate-400 font-bold shrink-0">{c.createdAt.slice(0, 10)}</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <StatusBadge label={c.caseType.replace('_', ' ')} tone="rose" />
                  <StatusBadge label={c.severity} tone="rose" />
                  <span className="text-[10px] font-black text-rose-600 ml-auto">{scoreLabel(c.metadata)}</span>
                </div>
                <p className="text-[11px] font-semibold text-slate-500 leading-snug line-clamp-2 mt-2">
                  {c.description}
                </p>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button variant="outline" onClick={dismiss} className="rounded-xl text-xs font-bold">
              Dismiss
            </Button>
            <Button onClick={openDiscipline} className="rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white">
              View Discipline
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
