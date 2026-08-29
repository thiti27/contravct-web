import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Ban,
  CalendarDays,
  Download,
  Eye,
  FileEdit,
  FilePlus2,
  Loader2,
  MessageSquare,
  MoreVertical,
  Pencil,
  RefreshCw,
  UploadCloud,
  XCircle,
} from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';
import ContractNoCell from '../ui/ContractNoCell';
import { formatDateTime } from '../../lib/formatDate';
import { EDITABLE_STATUSES } from '../../lib/statusGroups';
import { hasConfidentialAccess } from '../../lib/confidentialAccess';
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
    return { contract, isNewCompany, isNewMasterGroup, companyRowSpan: 1 };
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
function MoreMenu({
  anchorRect,
  showEdit,
  onEdit,
  showCancel,
  onCancel,
  showView,
  onView,
  onUploadSign,
  showUploadSign,
  showSignedActions,
  onRenew,
  onAmend,
  onClaimNote,
  onTerminate,
  showLegalComment,
  onLegalComment,
  onClose,
  // Already resolved by RowActions (see its own `effectiveRestricted`) — on My Job this
  // is always false regardless of the row's actual confidentiality, since every row
  // there is this user's own contract; every item below just uses whatever comes in.
  restricted,
}) {
  const ref = useRef(null);
  // Positioned in two passes: an initial guess (open below, right-aligned to the
  // button — the old fixed formula) so the menu has a size to measure, then
  // useLayoutEffect measures its actual rendered footprint and flips it above the
  // button (or clamps it sideways) if the initial guess would overflow the viewport —
  // exactly what a last-row/near-edge More icon needs, since the menu's own height
  // (it varies per row: Edit/Cancel/View/... aren't all shown at once) isn't known
  // until it's actually rendered. Stays hidden (not just off-position) until that
  // measure-and-correct pass lands, so the wrong-position guess is never visible —
  // React commits both passes before the browser ever paints.
  const [placement, setPlacement] = useState(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const menuRect = el.getBoundingClientRect();
    const margin = 8;

    let top = anchorRect.bottom + 4;
    if (top + menuRect.height > window.innerHeight - margin) {
      const spaceAbove = anchorRect.top - margin;
      const spaceBelow = window.innerHeight - anchorRect.bottom - margin;
      if (spaceAbove > spaceBelow) top = anchorRect.top - menuRect.height - 4;
    }
    top = Math.max(margin, top);

    let left = anchorRect.right - menuRect.width;
    if (left + menuRect.width > window.innerWidth - margin) left = window.innerWidth - menuRect.width - margin;
    if (left < margin) left = margin;

    setPlacement({ top, left });
  }, [anchorRect]);

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
      style={{
        position: 'fixed',
        top: placement ? placement.top : anchorRect.bottom + 4,
        left: placement ? placement.left : anchorRect.right - 176,
        visibility: placement ? 'visible' : 'hidden',
      }}
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
      {showCancel && (
        <button
          type="button"
          onClick={restricted ? undefined : onCancel}
          disabled={restricted}
          title={restricted ? 'You do not have permission to access this contract.' : undefined}
          className={`flex w-full items-center justify-start gap-2 px-4 py-2 text-left text-sm ${
            restricted ? 'cursor-not-allowed text-slate-300' : 'text-rose-600 hover:bg-rose-50'
          }`}
        >
          <XCircle size={14} /> Cancel
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
      {showSignedActions && (
        <>
          <button
            type="button"
            onClick={restricted ? undefined : onRenew}
            disabled={restricted}
            title={restricted ? 'You do not have permission to access this contract.' : undefined}
            className={`flex w-full items-center justify-start gap-2 px-4 py-2 text-left text-sm ${
              restricted ? 'cursor-not-allowed text-slate-300' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <RefreshCw size={14} /> Renew
          </button>
          <button
            type="button"
            onClick={restricted ? undefined : onAmend}
            disabled={restricted}
            title={restricted ? 'You do not have permission to access this contract.' : undefined}
            className={`flex w-full items-center justify-start gap-2 px-4 py-2 text-left text-sm ${
              restricted ? 'cursor-not-allowed text-slate-300' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <FileEdit size={14} /> Amend
          </button>
          <button
            type="button"
            onClick={restricted ? undefined : onClaimNote}
            disabled={restricted}
            title={restricted ? 'You do not have permission to access this contract.' : undefined}
            className={`flex w-full items-center justify-start gap-2 px-4 py-2 text-left text-sm ${
              restricted ? 'cursor-not-allowed text-slate-300' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <FilePlus2 size={14} /> Claim Note
          </button>
          <button
            type="button"
            onClick={restricted ? undefined : onTerminate}
            disabled={restricted}
            title={restricted ? 'You do not have permission to access this contract.' : undefined}
            className={`flex w-full items-center justify-start gap-2 px-4 py-2 text-left text-sm ${
              restricted ? 'cursor-not-allowed text-slate-300' : 'text-rose-600 hover:bg-rose-50'
            }`}
          >
            <Ban size={14} /> Terminate
          </button>
        </>
      )}
      {/* Sibling of showSignedActions (not nested inside it) so this lands right after
          Terminate for Signed rows, but also right after Upload Sign Contract for
          Drafted rows — Legal Review covers both statuses (see LEGAL_REVIEW_STATUSES),
          and each status renders nothing else between its own last item and this one. */}
      {showLegalComment && (
        <button
          type="button"
          onClick={restricted ? undefined : onLegalComment}
          disabled={restricted}
          title={restricted ? 'You do not have permission to access this contract.' : undefined}
          className={`flex w-full items-center justify-start gap-2 px-4 py-2 text-left text-sm ${
            restricted ? 'cursor-not-allowed text-slate-300' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <MessageSquare size={14} /> Legal Comment
        </button>
      )}
    </div>,
    document.body
  );
}

function RowActions({
  contractNo,
  onDownload,
  showEdit,
  onEdit,
  showCancel,
  onCancel,
  showView,
  showUploadSign,
  onUploadSign,
  showSignedActions,
  onRenew,
  onAmend,
  onClaimNote,
  onTerminate,
  showLegalComment,
  onLegalComment,
  approvalMode,
  onView,
  restricted,
  // Home/Find Contract (variant="browse") always shows the More icon next to Download,
  // even on a row with no menu items at all (e.g. Active/Rejected/Expired/Cancelled) —
  // disabled rather than hidden, so the control's position on the row stays predictable
  // instead of the layout shifting row to row. Every other list (My Job, Waiting
  // Approve, ...) keeps the original behavior: hidden entirely when there's nothing to do.
  alwaysShowMore = false,
  // My Job only: every action on a row is treated as if it weren't confidentiality-
  // restricted at all — Download, the More icon itself, and every item inside the menu
  // (Edit, Cancel, ...). This is "my job", not someone else's — the confidentiality +
  // `view`-permission gate exists to stop OTHER people opening a confidential contract
  // they don't own, which doesn't apply to a user managing their own request.
  neverDisableMore = false,
}) {
  const effectiveRestricted = neverDisableMore ? false : restricted;
  const downloadable = contractNo && contractNo !== '-' && !effectiveRestricted;
  const hasAnyAction = showEdit || showView || showSignedActions || showCancel || showLegalComment;
  const moreDisabled = effectiveRestricted || !hasAnyAction;
  const [anchorRect, setAnchorRect] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const btnRef = useRef(null);

  const toggleOpen = () => {
    setAnchorRect(r => (r ? null : btnRef.current.getBoundingClientRect()));
  };

  const handleDownload = async () => {
    if (!downloadable || downloading) return;
    setDownloading(true);
    try {
      await onDownload?.();
    } catch {
      window.alert('ดาวน์โหลด PDF ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setDownloading(false);
    }
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
        type="button"
        onClick={handleDownload}
        disabled={!downloadable || downloading}
        title={effectiveRestricted ? 'You do not have permission to download this contract.' : undefined}
        className="mr-1.5 inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-sm font-semibold text-white disabled:border disabled:border-dashed disabled:border-slate-200 disabled:bg-white disabled:text-slate-300"
      >
        {downloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} Download
      </button>
      {/* Rendered whenever there's actually something behind it (an editable/viewable
          status, or a restricted row that needs the disabled state + tooltip to explain
          why) — otherwise it'd be a dead click. Filled + colored, not just an outlined
          icon, so it reads as a clickable action next to Download instead of a faint
          decoration users overlook. alwaysShowMore (Home/Find Contract) additionally
          renders it — disabled — even with nothing behind it, so it doesn't hide. */}
      {(hasAnyAction || effectiveRestricted || alwaysShowMore) && (
        <button
          ref={btnRef}
          type="button"
          onClick={moreDisabled ? undefined : toggleOpen}
          disabled={moreDisabled}
          title={
            moreDisabled
              ? effectiveRestricted
                ? 'You do not have permission to access this contract.'
                : 'No actions available for this contract.'
              : 'More actions'
          }
          className="inline-grid h-9 w-9 place-items-center rounded-full bg-brand-50 text-brand-600 hover:bg-brand-100 disabled:cursor-not-allowed disabled:bg-white disabled:text-slate-300 disabled:opacity-60"
        >
          <MoreVertical size={17} />
        </button>
      )}
      {anchorRect && hasAnyAction && (
        <MoreMenu
          anchorRect={anchorRect}
          onClose={() => setAnchorRect(null)}
          showEdit={showEdit}
          restricted={effectiveRestricted}
          onEdit={() => {
            setAnchorRect(null);
            onEdit?.();
          }}
          showCancel={showCancel}
          onCancel={() => {
            setAnchorRect(null);
            onCancel?.();
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
          showSignedActions={showSignedActions}
          onRenew={() => {
            setAnchorRect(null);
            onRenew?.();
          }}
          onAmend={() => {
            setAnchorRect(null);
            onAmend?.();
          }}
          onClaimNote={() => {
            setAnchorRect(null);
            onClaimNote?.();
          }}
          onTerminate={() => {
            setAnchorRect(null);
            onTerminate?.();
          }}
          showLegalComment={showLegalComment}
          onLegalComment={() => {
            setAnchorRect(null);
            onLegalComment?.();
          }}
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
  onDownload,
  onCancel,
  onUploadSign,
  onRenew,
  onAmend,
  onClaimNote,
  onTerminate,
  onLegalComment,
  approvalMode = false,
  onView,
  viewableStatuses = [],
  // My Job only — see RowActions' neverDisableMore for what this actually does.
  neverDisableMore = false,
  // All Job/Home only — broadens the HIGH CONFIDENTIAL access check below from just
  // `view` to creator-or-view-or-approver (see lib/confidentialAccess.js), matching the
  // same rule the backend re-checks on getRequest/file download. Defaults false so
  // every other page (Waiting Approve/Waiting Check/Legal History/My History) keeps the
  // plain `view`-only check — My Job doesn't need this at all since neverDisableMore
  // already bypasses `restricted` outright there.
  checkJobPermission = false,
  // Home only — hides Type/Purpose on a child row (Renew/Amend/Claim Note/Terminate —
  // any row with a referContractNo pointing back to a master). The master itself always
  // shows its own Type/Purpose, whether or not it has children.
  hideChildType = false,
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
            {rowMeta.map(({ contract, isNewCompany, companyRowSpan, isLastInCompany, isLastInMasterGroup }, index) => {
              // All Job/Home: creator, `view` permission, or one of the 3 approvers all
              // grant access (see lib/confidentialAccess.js) — same rule the backend
              // re-checks. Everywhere else: confidential contracts require the view
              // permission, full stop, unrelated to who created the request. Non-
              // confidential contracts are never restricted either way.
              const restricted = checkJobPermission ? !hasConfidentialAccess(contract, user) : !!contract.confidentiality && !user?.view;
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
                      {/* Unlike Supplier's rowSpan merge above, Type/Purpose isn't merged
                          across a master's renew/amend/claim/terminate child rows — each
                          is its own contract_request with its own type/purpose, so every
                          row shows its own value directly (previously only the master row
                          did, leaving child rows blank) — except on Home, where a child
                          row (referContractNo set) hides its own Type/Purpose (see
                          hideChildType above); the master itself always shows its own,
                          with or without children. */}
                      {contract.type && !(hideChildType && !!contract.referContractNo) && (
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
                      onDownload={() => onDownload?.(contract)}
                      showEdit={enableEdit && EDITABLE_STATUSES.includes(contract.status)}
                      onEdit={() => onEdit?.(contract.id)}
                      showCancel={enableEdit && contract.status === 'Drafted'}
                      onCancel={() => onCancel?.(contract)}
                      showView={viewableStatuses.includes(contract.status)}
                      showUploadSign={enableEdit && contract.status === 'Drafted'}
                      onUploadSign={() => onUploadSign?.(contract)}
                      showSignedActions={enableEdit && contract.status === 'Signed'}
                      onRenew={() => onRenew?.(contract)}
                      onAmend={() => onAmend?.(contract)}
                      onClaimNote={() => onClaimNote?.(contract)}
                      onTerminate={() => onTerminate?.(contract)}
                      showLegalComment={
                        enableEdit && (contract.status === 'Signed' || contract.status === 'Drafted') && !!user?.legal && !contract.legalCheck
                      }
                      onLegalComment={() => onLegalComment?.(contract)}
                      approvalMode={approvalMode}
                      onView={() => onView?.(contract.id)}
                      restricted={restricted}
                      alwaysShowMore={variant === 'browse'}
                      neverDisableMore={neverDisableMore}
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
                        <RowActions contractNo={doc} restricted={restricted} alwaysShowMore={variant === 'browse'} />
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
