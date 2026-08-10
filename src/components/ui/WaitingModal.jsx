import { Loader2 } from 'lucide-react';
import Modal from './Modal';

// Non-dismissable "waiting for the server" modal — show while an async submit is in flight.
export default function WaitingModal({ open, message = 'Saving data...' }) {
  return (
    <Modal open={open}>
      <Loader2 size={32} className="mx-auto mb-3 animate-spin text-brand-600" />
      <p className="text-sm font-medium text-slate-600">{message}</p>
    </Modal>
  );
}
