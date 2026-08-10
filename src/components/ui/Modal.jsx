// Generic centered modal overlay. Used for the "waiting on the server" state
// while a form submits, but generic enough for other confirm/alert dialogs.
export default function Modal({ open, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-sm rounded-xl2 bg-white p-7 text-center shadow-card">{children}</div>
    </div>
  );
}
