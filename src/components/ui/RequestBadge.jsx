// Shown inline at the start of a modal header's title (LinkedRequestModal, and
// EditRequestModal's Approval > Waiting/History views) — a plain blue "info" pill
// labeling the title that follows as a request (e.g. "[Request] Renew Contract -
// DSST02-2026"), same rounded-pill shape ConfidentialBadge/RemarkBadge use elsewhere,
// just the app's own brand blue instead of a status color.
export default function RequestBadge() {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600">
      Request
    </span>
  );
}
