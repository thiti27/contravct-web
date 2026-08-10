// Shown next to the Supplier name in job-list tables and in the modal header (after
// the Remark badge) whenever contract_requests.confidentiality = 1.
export default function ConfidentialBadge() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600">
      <span className="h-2 w-2 rounded-full bg-rose-500" />
      HIGH CONFIDENTIAL
    </span>
  );
}
