import ConfidentialBadge from './ConfidentialBadge';
import { REMARK_LABELS } from './RemarkBadge';

// Shared "Contract No." cell content — used by every table that lists contracts
// (ContractTable's job/browse variants and ActionHistoryTable's Approval/Legal
// History) so the format stays identical everywhere: {contract_no} ({remark}) on one
// line, remark de-emphasized and non-mono so it doesn't read as part of the code,
// plus the confidential badge when applicable. Contract No. itself never truncates or
// wraps (shrink-0 + whitespace-nowrap — the column is sized with enough room for the
// full number) — if the cell is too narrow for both, the remark truncates with an
// ellipsis + hover tooltip instead of wrapping onto its own line. Renders nothing but
// this content — the caller still owns its own <td> (padding/alignment can differ per table).
export default function ContractNoCell({ contractNo, remark, confidentiality }) {
  const remarkLabel = REMARK_LABELS[remark];
  return (
    <div className="flex min-w-0 flex-col items-start gap-1">
      {confidentiality ? <ConfidentialBadge /> : null}
      <div className="flex w-full min-w-0 items-baseline gap-1.5">
        <span className="shrink-0 whitespace-nowrap font-mono font-semibold text-slate-700">{contractNo || '-'}</span>
        {remarkLabel && (
          <span title={remarkLabel} className="min-w-0 truncate text-xs font-normal text-slate-400">
            ({remarkLabel})
          </span>
        )}
      </div>
    </div>
  );
}
