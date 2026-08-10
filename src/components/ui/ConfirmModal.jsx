import { HelpCircle } from 'lucide-react';
import Modal from './Modal';

// Generic "are you sure" gate for actions that should not fire on a single click —
// Yes runs the pending action, No just closes without doing anything.
export default function ConfirmModal({ open, title = 'Confirm to save', message, busy, onConfirm, onCancel }) {
  return (
    <Modal open={open}>
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-600">
        <HelpCircle size={30} />
      </div>
      <h2 className="text-lg font-bold text-navy">{title}</h2>
      {message && <p className="mt-2 text-sm text-slate-500">{message}</p>}
      <div className="mt-6 flex justify-center gap-3">
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className="h-11 flex-1 rounded-2xl bg-brand-600 text-sm font-semibold text-white shadow-soft hover:bg-brand-700 disabled:opacity-60"
        >
          {busy ? 'Saving…' : 'Yes'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="h-11 flex-1 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
        >
          No
        </button>
      </div>
    </Modal>
  );
}
