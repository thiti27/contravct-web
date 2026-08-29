// Shown in the modal header's title badge row (after the Remark badge) whenever
// contract_requests.confidentiality = 1. Everywhere else that shows confidentiality —
// Contract No. cells (ContractNoCell.jsx), the New Request form's letterhead
// (NewRequestHeader.jsx) — uses the compact "!" + tooltip mark instead
// (ConfidentialMark.jsx); the modal title badge specifically keeps this full,
// always-visible text form.
export default function ConfidentialBadge() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600">
      <span className="h-2 w-2 rounded-full bg-rose-500" />
      HIGH CONFIDENTIAL
    </span>
  );
}
