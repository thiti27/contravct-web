import { useEffect } from 'react';

// Module-level (not React state) so every modal instance app-wide shares one counter —
// necessary because modals stack (e.g. ConfirmModal opened on top of a FormModal): if
// each modal locked/unlocked independently, closing the top one would restore page
// scroll while the one underneath is still open. The body only unlocks once every
// modal that asked for a lock has released it.
let lockCount = 0;
let previousOverflow;

function lock() {
  if (lockCount === 0) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  lockCount += 1;
}

function unlock() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) document.body.style.overflow = previousOverflow;
}

// Hides the main page's scrollbar for as long as this modal is open. Call unconditionally
// (before any `if (!open) return null` in the component) — the lock itself only engages
// while `open` is true.
export default function useBodyScrollLock(open) {
  useEffect(() => {
    if (!open) return undefined;
    lock();
    return unlock;
  }, [open]);
}
