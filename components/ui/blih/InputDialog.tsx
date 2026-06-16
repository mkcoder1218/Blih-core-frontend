import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface InputDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;
  title: string;
  description?: string;
  label?: string;
  initialValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  required?: boolean;
  loading?: boolean;
}

export function InputDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  label,
  initialValue = '',
  placeholder,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  required = false,
  loading = false,
}: InputDialogProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (open) setValue(initialValue);
  }, [initialValue, open]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (required && !value.trim()) return;
    onConfirm(value);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl p-5">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-sm font-black text-slate-900">{title}</DialogTitle>
            {description && (
              <DialogDescription className="text-[11px] font-semibold text-slate-400">
                {description}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-1.5">
            {label && <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</label>}
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              className="h-10 rounded-xl text-xs font-semibold"
              autoFocus
            />
          </div>

          <DialogFooter className="flex gap-3 sm:gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="flex-1 rounded-xl text-xs font-bold">
              {cancelLabel}
            </Button>
            <Button type="submit" disabled={loading || (required && !value.trim())} className="flex-1 rounded-xl text-xs font-bold">
              {loading ? 'Please wait...' : confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
