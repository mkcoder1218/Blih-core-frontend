import { Loader2 } from 'lucide-react';
import { useState } from 'react';

interface WfhRejectModalProps {
  open: boolean;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

export default function WfhRejectModal({
  open,
  isLoading = false,
  onClose,
  onConfirm,
}: WfhRejectModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!open) {
    return null;
  }

  const handleClose = () => {
    if (isLoading) {
      return;
    }

    setReason('');
    setError('');
    onClose();
  };

  const handleConfirm = async () => {
    const trimmedReason = reason.trim();

    if (trimmedReason.length < 3) {
      setError('Enter the rejection reason.');
      return;
    }

    setError('');
    await onConfirm(trimmedReason);
    setReason('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <h3 className="text-sm font-black text-slate-950">
          Reject WFH Request
        </h3>

        <p className="mt-1 text-xs font-semibold text-slate-500">
          Enter why this request is being rejected.
        </p>

        <textarea
          autoFocus
          rows={4}
          value={reason}
          onChange={(event) => {
            setReason(event.currentTarget?.value);
            setError('');
          }}
          placeholder="Rejection reason..."
          className="mt-4 w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-xs font-semibold outline-none focus:border-blue-500"
        />

        {error && (
          <p className="mt-2 text-[11px] font-semibold text-rose-600">
            {error}
          </p>
        )}

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            disabled={isLoading}
            onClick={handleClose}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={handleConfirm}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60"
          >
            {isLoading && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}

            Reject
          </button>
        </div>
      </div>
    </div>
  );
}