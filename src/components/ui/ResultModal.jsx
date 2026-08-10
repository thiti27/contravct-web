import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';
import Modal from './Modal';

const AUTO_CLOSE_MS = 10000;

const VARIANTS = {
  success: { icon: CheckCircle2, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-500', bar: 'bg-emerald-400', title: 'Success' },
  error: { icon: XCircle, iconBg: 'bg-rose-50', iconColor: 'text-rose-500', bar: 'bg-rose-400', title: 'Failed' },
};

// "Sweet alert"-style result dialog for save operations: checkmark/error icon,
// message, a shrinking progress bar that auto-closes after 10s, and a manual
// Close button/X for anyone who doesn't want to wait.
export default function ResultModal({ open, variant = 'success', title, message, onClose }) {
  const [progress, setProgress] = useState(100);
  const config = VARIANTS[variant];

  useEffect(() => {
    if (!open) return undefined;
    setProgress(100);
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / AUTO_CLOSE_MS) * 100);
      setProgress(remaining);
      if (elapsed >= AUTO_CLOSE_MS) onClose();
    }, 100);
    return () => clearInterval(timer);
  }, [open, onClose]);

  const Icon = config.icon;

  return (
    <Modal open={open}>
      <div className="relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute -right-3 -top-3 grid h-7 w-7 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X size={16} />
        </button>

        <div className={`mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full ${config.iconBg} ${config.iconColor}`}>
          <Icon size={36} />
        </div>

        <h2 className="text-lg font-bold text-navy">{title || config.title}</h2>
        {message && <p className="mt-2 text-sm text-slate-500">{message}</p>}

        <button
          type="button"
          onClick={onClose}
          className="mt-6 h-11 w-full rounded-2xl bg-brand-600 text-sm font-semibold text-white shadow-soft hover:bg-brand-700"
        >
          Close
        </button>

        <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100">
          <div className={`h-full rounded-full ${config.bar}`} style={{ width: `${progress}%` }} />
        </div>
      </div>
    </Modal>
  );
}
