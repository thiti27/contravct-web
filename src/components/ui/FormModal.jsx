import { X } from 'lucide-react';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';

// Large form modal (e.g. the Edit/Approve/Legal Review/Legal History views on top of
// the New Request sections) — unlike Modal.jsx (small, centered alert/confirm boxes),
// this has a header (title + optional badge + close button) and a right-aligned
// footer slot for the action buttons.
//
// size="full" (default): neither header nor footer are pinned — the outer box itself
// is the one scroll container, so both scroll away with the content instead of staying
// fixed at the top/bottom.
// size="boxed": a centered dialog capped at max-w-2xl/90vh instead of filling the
// screen — header and footer stay pinned, only the content area scrolls.
export default function FormModal({
  open,
  title,
  titleBadge,
  footer,
  onClose,
  closeDisabled,
  children,
  size = 'full',
  // Opt-in: centers the title within the header bar instead of the default left-aligned
  // layout. A 3-column grid (invisible spacer, centered title, close button) keeps the
  // title mathematically centered on the bar rather than just centered in the leftover
  // space next to the close button, which `justify-between` alone can't do.
  centerTitle = false,
}) {
  useBodyScrollLock(open);
  if (!open) return null;
  const boxed = size === 'boxed';
  return (
    // "full" fills the viewport edge-to-edge (no backdrop margin, no rounded corners) —
    // only "boxed" gets the padded, centered-dialog treatment.
    <div className={boxed ? 'fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4' : 'fixed inset-0 z-40'}>
      <div
        className={
          boxed
            ? 'flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl2 bg-white shadow-card'
            // modal-scroll: a wide, high-contrast scrollbar (see styles.css) — this box is
            // the only scroll container in "full" mode, and its content routinely runs
            // longer than one screen, so the default thin/pale OS scrollbar is easy to miss
            // entirely and users don't realize there's more form below the fold.
            : 'modal-scroll h-full w-full overflow-y-auto bg-white shadow-card'
        }
      >
        {(title || onClose) &&
          (centerTitle ? (
            <div className="grid shrink-0 grid-cols-[2.25rem_1fr_2.25rem] items-center gap-3 border-b border-slate-100 px-6 py-4">
              <div />
              <div className="flex min-w-0 items-center justify-center gap-3">
                <h2 className="truncate text-base font-bold text-navy">{title}</h2>
                {titleBadge}
              </div>
              {onClose ? (
                <button
                  type="button"
                  onClick={onClose}
                  disabled={closeDisabled}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40"
                >
                  <X size={18} />
                </button>
              ) : (
                <div />
              )}
            </div>
          ) : (
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
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
          ))}
        <div className={boxed ? 'overflow-y-auto p-6' : 'p-6'}>{children}</div>
        {footer && (
          <div className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-slate-100 px-6 py-4">{footer}</div>
        )}
      </div>
    </div>
  );
}
