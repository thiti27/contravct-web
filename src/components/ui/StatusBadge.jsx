const TONE_BY_STATUS = status => {
  // Signed gets its own blue tone, split out from the green group below, so it reads as
  // visibly distinct at a glance instead of blending in with Draft/Active/Approve/Check.
  if (status === 'Signed') return 'blue';
  if (status.includes('Draft') || status === 'Active' || status === 'Approve' || status === 'Check') return 'green';
  if (status.includes('Waiting') || status.includes('Expiry') || status === 'Returned' || status === 'Return') return 'orange';
  if (
    status === 'Rejected' ||
    status === 'Expired' ||
    status === 'Cancelled' ||
    status === 'Reject' ||
    status === 'Terminated' ||
    status === 'Terminate'
  )
    return 'red';
  return 'gray';
};

const TONE_CLASSES = {
  green: 'bg-emerald-50 text-emerald-600',
  blue: 'bg-brand-50 text-brand-600',
  orange: 'bg-amber-50 text-amber-600',
  red: 'bg-rose-50 text-rose-600',
  gray: 'bg-slate-100 text-slate-500',
};

const DOT_CLASSES = {
  green: 'bg-emerald-500',
  blue: 'bg-brand-500',
  orange: 'bg-amber-500',
  red: 'bg-rose-500',
  gray: 'bg-slate-400',
};

// `wrap` lets a caller allow long statuses like "Waiting Approver 1" to break onto a
// second line instead of overflowing past the badge — unused by the job/browse tables
// today (their Status column is now sized for one line at this smaller text-xs), but
// left in place for any narrower context that still needs it.
export default function StatusBadge({ status, wrap = false }) {
  const tone = TONE_BY_STATUS(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${wrap ? 'whitespace-normal text-center leading-tight' : 'whitespace-nowrap'
        } ${TONE_CLASSES[tone]}`}
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${DOT_CLASSES[tone]}`} />
      {status}
    </span>
  );
}
