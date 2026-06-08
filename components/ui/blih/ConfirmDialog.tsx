/**
 * ConfirmDialog — Blih ERP shared component
 * A reusable confirmation/destructive action modal built on shadcn Dialog.
 * Replaces ad-hoc inline confirm UIs scattered throughout the app.
 *
 * Usage:
 *   <ConfirmDialog
 *     open={confirmOpen}
 *     onClose={() => setConfirmOpen(false)}
 *     onConfirm={handleDelete}
 *     title="Delete Template"
 *     description="This action cannot be undone. The template will be permanently removed."
 *     confirmLabel="Delete"
 *     variant="destructive"
 *     loading={deleteMut.isPending}
 *   />
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'destructive' | 'primary' | 'success';
  loading?: boolean;
  className?: string;
}

const variantConfig = {
  destructive: {
    iconBg: 'bg-red-50',
    iconColor: 'text-red-600',
    icon: AlertTriangle,
    btnClass: 'bg-red-600 hover:bg-red-700 text-white',
  },
  primary: {
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    icon: Info,
    btnClass: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  success: {
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    icon: CheckCircle2,
    btnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'destructive',
  loading = false,
  className,
}: ConfirmDialogProps) {
  const config = variantConfig[variant];
  const Icon = config?.icon;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className={cn('max-w-sm rounded-2xl p-5 space-y-4', className)}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-xl flex-shrink-0', config?.iconBg)}>
              <Icon className={cn('w-4 h-4', config?.iconColor)} />
            </div>
            <div>
              <DialogTitle className="text-sm font-black text-slate-900">{title}</DialogTitle>
              {description && (
                <DialogDescription className="text-[11px] text-slate-400 mt-0.5">
                  {description}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="flex gap-3 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1 border-slate-200 text-slate-600 font-bold text-xs h-9 rounded-xl"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'flex-1 font-bold text-xs h-9 rounded-xl disabled:opacity-50',
              config?.btnClass
            )}
          >
            {loading ? 'Please wait…' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
