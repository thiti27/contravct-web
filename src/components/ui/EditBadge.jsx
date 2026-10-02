// Shown as the whole title in EditRequestModal's Edit mode (plain "edit an existing
// request" — remark 'new' on Home/Contract Making, and the fixed generic override My
// Job/All Job use for every remark) — same rounded-pill shape RequestBadge/RemarkBadge/
// ConfidentialBadge use elsewhere, just the app's own "in progress" orange instead of
// brand blue or a status color, and no separate title text next to it.
export default function EditBadge({ children = 'Edit' }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-amber-50 px-3 py-1 text-base font-semibold text-amber-600">
      {children}
    </span>
  );
}
