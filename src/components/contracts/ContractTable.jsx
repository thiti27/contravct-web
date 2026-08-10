import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, Download, Eye, MoreVertical, Pencil, UploadCloud } from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';
import ContractNoCell from '../ui/ContractNoCell';
import { formatDateTime } from '../../lib/formatDate';
import { EDITABLE_STATUSES } from '../../lib/statusGroups';
import { useAuth } from '../../context/AuthContext';

const DOCUMENT_DATES = ['2027-04-02', '2027-12-12', '2027-03-05'];

// Groups rows by Company, then by master contract (a renew/amend/claim/terminate
// row's refer_contract_no points back to its master's contract_no) — relies on the
// backend having already sorted by supplier, then by master contract_no, then by id
// (see GET /api/contracts) so each group is a contiguous run in `contracts`.
function buildRowMeta(contracts) {
  let prevSupplier;
  let prevGroupKey;
  const meta = contracts.map(contract => {
    const groupKey = contract.referContractNo || contract.contractNo || `__id_${contract.id}`;
    const isNewCompany = contract.supplier !== prevSupplier;
    const isNewMasterGroup = isNewCompany || groupKey !== prevGroupKey;
    prevSupplier = contract.supplier;
    prevGroupKey = groupKey;
    return { contract, isNewCompany, isNewMasterGroup, isMaster: !contract.referContractNo, companyRowSpan: 1 };
  });
  meta.forEach((row, i) => {
    if (!row.isNewCompany) return;
    let span = 1;
    for (let j = i + 1; j < meta.length && !meta[j].isNewCompany; j += 1) span += 1;
    row.companyRowSpan = span;
  });
  meta.forEach((row, i) => {
    const next = meta[i + 1];
    row.isLastInCompany = !next || next.isNewCompany;
    row.isLastInMasterGroup = !next || next.isNewMasterGroup;
  });
  return meta;
}

// Rendered through a portal (like react-select's menuPortalTarget elsewhere in this
// app) so the menu escapes the table's overflow-x-auto clipping box instead of being
// cut off/sunk behind it.
function MoreMenu({ anchorRect, showEdit, onEdit, showView, onView, onUploadSign, showUploadSign, onClose, restricted }) {
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = e => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const handleReposition = () => onClose();
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={ref}
      style={{ position: 'fixed', top: anchorRect.bottom + 4, left: anchorRect.right - 176 }}
      className="z-50 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-left shadow-card"
    >
      {showEdit && (
        <button
          type="button"
          onClick={restricted ? undefined : onEdit}
          disabled={restricted}
          title={restricted ? 'You do not have permission to access this contract.' : undefined}
          className={`flex w-full items-center justify-start gap-2 px-4 py-2 text-left text-sm ${restricted ? 'cursor-not-allowed text-slate-300' : 'text-slate-600 hover:bg-slate-50'
            }`}
        >
          <Pencil size={14} /> Edit
        </button>
      )}
      {showView && (
        <button
          type="button"
          onClick={restricted ? undefined : onView}
          disabled={restricted}
          title={restricted ? 'You do not have permission to access this contract.' : undefined}
          className={`flex w-full items-center justify-start gap-2 px-4 py-2 text-left text-sm ${restricted ? 'cursor-not-allowed text-slate-300' : 'text-slate-600 hover:bg-slate-50'
            }`}
        >
          <Eye size={14} /> View
        </button>
      )}
      {showUploadSign && (
        <button
          type="button"
          onClick={restricted ? undefined : onUploadSign}
          disabled={restricted}
          title={restricted ? 'You do not have permission to access this contract.' : undefined}
          className={`flex w-full items-center justify-start gap-2 px-4 py-2 text-left text-sm ${restricted ? 'cursor-not-allowed text-slate-300' : 'text-slate-600 hover:bg-slate-50'
            }`}
        >
          <UploadCloud size={14} /> Upload Sign Contract
        </button>
      )}
    </div>,
    document.body
  );
}

function RowActions({ contractNo, showEdit, onEdit, showView, showUploadSign, onUploadSign, approvalMode, onView, restricted }) {
  const downloadable = contractNo && contractNo !== '-' && !restricted;
  const [anchorRect, setAnchorRect] = useState(null);
  const btnRef = useRef(null);

  const toggleOpen = () => {
    setAnchorRect(r => (r ? null : btnRef.current.getBoundingClientRect()));
  };

  if (approvalMode) {
    return (
      <td className="whitespace-nowrap px-3 py-1.5 text-right align-top">
        <button
          type="button"
          onClick={onView}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-3 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <Eye size={15} /> View
        </button>
      </td>
    );
  }

  return (
    <td className="whitespace-nowrap px-3 py-1.5 text-right align-top">
      <button
        disabled={!downloadable}
        title={restricted ? 'You do not have permission to download this contract.' : undefined}
        className="mr-1.5 inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-sm font-semibold text-white disabled:border disabled:border-dashed disabled:border-slate-200 disabled:bg-white disabled:text-slate-300"
      >
        <Download size={15} /> Download
      </button>
      {/* Only rendered when there's actually something behind it (an editable/viewable
          status, or a restricted row that needs the disabled state + tooltip to explain
          why) — otherwise it'd be a dead click. Filled + colored, not just an outlined
          icon, so it reads as a clickable action next to Download instead of a faint
          decoration users overlook. */}
      {(showEdit || showView || restricted) && (
        <button
          ref={btnRef}
          type="button"
          onClick={restricted ? undefined : toggleOpen}
          disabled={restricted}
          title={restricted ? 'You do not have permission to access this contract.' : 'More actions'}
          className="inline-grid h-9 w-9 place-items-center rounded-full bg-brand-50 text-brand-600 hover:bg-brand-100 disabled:cursor-not-allowed disabled:bg-white disabled:text-slate-300 disabled:opacity-60"
        >
          <MoreVertical size={17} />
        </button>
      )}
      {anchorRect && (showEdit || showView) && (
        <MoreMenu
          anchorRect={anchorRect}
          onClose={() => setAnchorRect(null)}
          showEdit={showEdit}
          onEdit={() => {
            setAnchorRect(null);
            onEdit?.();
          }}
          showView={showView}
          onView={() => {
            setAnchorRect(null);
            onView?.();
          }}
          showUploadSign={showUploadSign}
          onUploadSign={() => {
            setAnchorRect(null);
            onUploadSign?.();
          }}
          restricted={restricted}
        />
      )}
    </td>
  );
}

// variant "browse": used by the Home / Find Contract tab — shows expire date + child document rows.
// variant "job": used by every job-list style page (My Job, Approval, Legal, ...) — shows status + updated by.
export default function ContractTable({
  contracts,
  variant = 'job',
  enableEdit = false,
  onEdit,
  onUploadSign,
  approvalMode = false,
  onView,
  viewableStatuses = [],
}) {
  const { user } = useAuth();
  const rowMeta = buildRowMeta(contracts);
  return (
    <section className="min-h-[360px] overflow-hidden rounded-xl2 border border-slate-200 bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] table-fixed border-collapse text-sm">
          <colgroup>
            {/* Narrowed to free space for Contract No. below — Supplier still wraps
                onto multiple lines for long names (no truncate/nowrap here), same as
                it always has. */}
            <col style={{ width: '260px' }} />
            {/* Widened so the full contract number (e.g. "DSST08-2026-01") never
                truncates or wraps — it's shrink-0 in ContractNoCell, so it needs
                actual room rather than relying on ellipsis like the remark next to it. */}
            <col style={{ width: '230px' }} />
            <col />
            {variant === 'browse' ? (
              <>
                <col style={{ width: '135px' }} />
                <col style={{ width: '175px' }} />
              </>
            ) : (
              <>
                <col style={{ width: '175px' }} />
                <col style={{ width: '195px' }} />
              </>
            )}
            <col style={{ width: '190px' }} />
          </colgroup>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-6 py-3 text-center">Supplier</th>
              <th className="px-6 py-3 text-left">Contract No.</th>
              <th className="px-6 py-3 text-center">Type</th>
              {variant === 'browse' ? (
                <>
                  <th className="px-6 py-3 text-center">Expire Date</th>
                  <th className="px-6 py-3 text-center">Status</th>
                </>
              ) : (
                <>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-center">Updated By</th>
                </>
              )}
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody>
            {rowMeta.map(({ contract, isNewCompany, isMaster, companyRowSpan, isLastInCompany, isLastInMasterGroup }, index) => {
              // Confidential contracts require the view permission, full stop — unrelated
              // to who created the request. Non-confidential contracts are never restricted.
              const restricted = !!contract.confidentiality && !user?.view;
              // Company groups get a thicker rule below their last row; master/child groups
              // within the same company get a thin rule; rows sharing a master group otherwise
              // sit flush against each other so the renew/amend/claim history reads as one block.
              // The very last row of the table never draws a rule — the section's own border closes it off.
              const isVeryLastRow = index === rowMeta.length - 1;
              const rowBorder = isVeryLastRow
                ? 'border-b-0'
                : isLastInCompany
                  ? 'border-b-2 border-slate-300'
                  : isLastInMasterGroup
                    ? 'border-b border-slate-200'
                    : 'border-b-0';
              return (
                <React.Fragment key={contract.id}>
                  <tr className={`${rowBorder} hover:bg-slate-50/60`}>
                    {isNewCompany && (
                      <td rowSpan={companyRowSpan} className="border-r border-slate-100 px-6 py-1.5 align-top font-medium text-navy">
                        {contract.supplier}
                      </td>
                    )}
                    <td className="px-6 py-1.5 text-left align-top">
                      <ContractNoCell contractNo={contract.contractNo} remark={contract.remark} confidentiality={contract.confidentiality} />
                    </td>
                    <td className="px-6 py-1.5 text-center align-top">
                      {isMaster && (
                        <>
                          <div title={contract.type} className="truncate font-semibold text-slate-700">
                            {contract.type}
                          </div>
                          {contract.purpose && (
                            <div title={contract.purpose} className="truncate text-xs text-slate-400">
                              {contract.purpose}
                            </div>
                          )}
                        </>
                      )}
                    </td>
                    {variant === 'browse' ? (
                      <>
                        <td className="px-6 py-1.5 align-top text-slate-600">
                          {contract.expireDate && (
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarDays size={15} className="text-slate-400" /> {contract.expireDate}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-1.5 text-center align-top">
                          <StatusBadge status={contract.status} />
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-1.5 text-center align-top">
                          <StatusBadge status={contract.status} />
                        </td>
                        <td className="px-6 py-1.5 text-center align-top text-slate-600">
                          {contract.updatedName && (
                            <>
                              <div title={contract.updatedName} className="truncate font-semibold text-slate-700">
                                {contract.updatedName}
                              </div>
                              <div className="whitespace-nowrap text-xs text-slate-400">{formatDateTime(contract.updatedAt)}</div>
                            </>
                          )}
                        </td>
                      </>
                    )}
                    <RowActions
                      contractNo={contract.contractNo}
                      showEdit={enableEdit && EDITABLE_STATUSES.includes(contract.status)}
                      onEdit={() => onEdit?.(contract.id)}
                      showView={viewableStatuses.includes(contract.status)}
                      showUploadSign={enableEdit && contract.status === 'Drafted'}
                      onUploadSign={() => onUploadSign?.(contract)}
                      approvalMode={approvalMode}
                      onView={() => onView?.(contract.id)}
                      restricted={restricted}
                    />
                  </tr>

                  {variant === 'browse' &&
                    contract.documents?.map((doc, index) => (
                      <tr key={doc} className="border-b border-slate-100 bg-slate-50/40 text-slate-500 last:border-0">
                        <td className="px-6 py-2" />
                        <td className="px-6 py-2">└&nbsp;&nbsp;{doc}</td>
                        <td className="px-6 py-2" />
                        <td className="px-6 py-2">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays size={15} className="text-slate-400" /> {DOCUMENT_DATES[index]}
                          </span>
                        </td>
                        <td className="px-6 py-2">
                          <StatusBadge status={index === 1 ? 'Near Expiry' : 'Active'} />
                        </td>
                        <RowActions contractNo={doc} restricted={restricted} />
                      </tr>
                    ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {!contracts.length && <div className="py-16 text-center text-slate-400">No contracts found</div>}
    </section>
  );
}
