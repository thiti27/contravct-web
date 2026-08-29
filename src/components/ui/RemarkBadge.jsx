// contract_requests.remark labels/colors — kept in sync with REMARK_OPTIONS
// (pages/NewRequest/constants.js), just condensed for a small header badge.
// Exported so other displays (e.g. the Contract No. column) can reuse the same
// labels without duplicating the map.
export const REMARK_LABELS = {
  new: 'New Contract',
  renew: 'Renew Contract',
  amend: 'Amend Contract',
  claim: 'Claim Note',
  terminate: 'Terminate',
  cancel: 'Cancel Contract',
};

const REMARK_TONES = {
  new: 'bg-emerald-50 text-emerald-600',
  renew: 'bg-sky-50 text-sky-600',
  amend: 'bg-amber-50 text-amber-600',
  claim: 'bg-purple-50 text-purple-600',
  terminate: 'bg-rose-50 text-rose-600',
  cancel: 'bg-rose-50 text-rose-600',
};

// Renders nothing when remark is NULL/empty, per spec.
export default function RemarkBadge({ remark }) {
  if (!remark) return null;
  return (
    <span
      className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
        REMARK_TONES[remark] || 'bg-slate-100 text-slate-500'
      }`}
    >
      {REMARK_LABELS[remark] || remark}
    </span>
  );
}
