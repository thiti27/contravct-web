import { Eye } from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';
import ContractNoCell from '../ui/ContractNoCell';
import { formatDateTime } from '../../lib/formatDate';

// Shared table for both Approval > My History (Approve/Return/Reject) and Legal >
// History (Check/Terminate) — one row per action taken, not a contract_requests row
// directly. Deliberately a dedicated table (not ContractTable): the row's own id is
// the history row's id (needed as a stable React key across possibly-repeated
// contractRequestId values), while View opens the underlying contract via `contractRequestId`.
export default function ActionHistoryTable({ items, onView }) {
  return (
    <section className="min-h-[360px] overflow-hidden rounded-xl2 border border-slate-200 bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] table-fixed border-collapse text-sm">
          <colgroup>
            {/* Narrowed to free space for Contract No. below — Supplier still wraps
                onto multiple lines for long names (no truncate/nowrap here). */}
            <col style={{ width: '260px' }} />
            {/* Widened so the full contract number never truncates or wraps (it's
                shrink-0 + whitespace-nowrap in ContractNoCell) — any leftover space
                still flows to Type, the only column without an explicit width. */}
            <col style={{ width: '230px' }} />
            <col />
            <col style={{ width: '120px' }} />
            <col style={{ width: '210px' }} />
            <col style={{ width: '190px' }} />
          </colgroup>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-6 py-3 text-center">Supplier</th>
              <th className="px-6 py-3 text-left">Contract No.</th>
              <th className="px-6 py-3 text-center">Type</th>
              <th className="px-6 py-3 text-center">Status</th>
              <th className="px-6 py-3 text-center">Updated By</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                <td className="px-6 py-1.5 align-top font-medium text-navy">{item.supplier}</td>
                <td className="px-6 py-1.5 text-left align-top">
                  <ContractNoCell contractNo={item.contractNo} remark={item.remark} />
                </td>
                <td className="px-6 py-1.5 text-center align-top">
                  <div title={item.type} className="truncate font-semibold text-slate-700">
                    {item.type}
                  </div>
                  {item.purpose && (
                    <div title={item.purpose} className="truncate text-xs text-slate-400">
                      {item.purpose}
                    </div>
                  )}
                </td>
                <td className="px-6 py-1.5 text-center">
                  <StatusBadge status={item.action} />
                </td>
                <td className="px-6 py-1.5 text-center align-top text-slate-600">
                  {item.updatedName && (
                    <div title={item.updatedName} className="truncate font-semibold text-slate-700">
                      {item.updatedName}
                    </div>
                  )}
                  <div className="whitespace-nowrap text-xs text-slate-400">{formatDateTime(item.updatedAt)}</div>
                </td>
                <td className="whitespace-nowrap px-6 py-1.5 text-right">
                  <button
                    type="button"
                    onClick={() => onView?.(item.contractRequestId)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"
                  >
                    <Eye size={15} /> View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!items.length && <div className="py-16 text-center text-slate-400">No history found</div>}
    </section>
  );
}
