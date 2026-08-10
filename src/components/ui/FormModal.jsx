import { X } from 'lucide-react';

// Large form modal (e.g. the Edit/Approve/Legal Review/Legal History views on top of
// the New Request sections) — unlike Modal.jsx (small, centered alert/confirm boxes),
// this has a header (title + optional badge + close button) and a right-aligned
// footer slot for the action buttons. Neither header nor footer are pinned: the
// outer box itself is the one scroll container, so both scroll away with the
// content instead of staying fixed at the top/bottom.
export default function FormModal({ open, title, titleBadge, footer, onClose, closeDisabled, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40">
      <div className="h-full w-full overflow-y-auto bg-white shadow-card">
        {(title || onClose) && (
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <h2 className="truncate text-base font-bold text-navy">{title}</h2>
              {titleBadge}
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                disabled={closeDisabled}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}
        <div className="p-6">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}
