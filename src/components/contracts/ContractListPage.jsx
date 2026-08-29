import { useEffect, useState } from 'react';
import ContractFilters, { EMPTY_FILTERS } from './ContractFilters';
import ContractTable from './ContractTable';
import EditRequestModal from './EditRequestModal';
import UploadSignContractModal from './UploadSignContractModal';
import LinkedRequestModal from './LinkedRequestModal';
import Pagination from '../ui/Pagination';
import PageContainer from '../layout/PageContainer';
import { useContracts } from '../../hooks/useContracts';
import { useMetaContext } from '../../context/MetaContext';
import { useAuth } from '../../context/AuthContext';
import { fetchContractRequest } from '../../lib/api';
import { downloadContractRequisitionFormPdf } from '../../pdf/downloadContractRequisitionFormPdf';
import { normalizeThousands } from '../../lib/formatNumber';

const PAGE_SIZE = 10;

// Shared list screen used by every "job list" style page: My Job, My History, All Job,
// Waiting Approve, Waiting Check, Legal History, and the Home Find Contract / Contract Making / Upload Contract tabs.
// Only the scope of statuses, visible filters and heading text change between them.
export default function ContractListPage({
  title,
  subtitle,
  statusScope = null,
  variant = 'job',
  showYear = false,
  showBrowse = false,
  showExport = false,
  showSection = true,
  showStatus = null, // null = auto (show only when the scope has more than one status)
  requireContractNo = false,
  scopeToCurrentUser = false, // true = only rows this logged-in user created (e.g. "My Job")
  enableEdit = false, // true = the "more" menu offers Edit for rows in an editable status
  approvalMode = false, // true = rows show a single View button opening the modal in Approve Mode
  legalMode = false, // true = rows show a single View button opening the modal in Legal Review Mode
  viewableStatuses = [], // statuses for which the "more" menu offers read-only View (e.g. "My History")
  // true = All Job only (see AllJobTab.jsx) — Related Contract Document's Specification/
  // Drawing/Plan enforce the stricter creator-or-approver-and-`view`-permission check
  // (EditRequestModal.jsx's restrictedFileAccess) instead of the plain isOwner gate every
  // other enableEdit page keeps.
  enforceFilePermission = false,
  // All Job only — overrides the Edit modal's header title with this literal string
  // ("Edit Contract") instead of the usual status/contractNo/remark-derived title. Header
  // only; content/form/logic/permission are untouched.
  editModalTitle,
  // My Job only — the More icon itself is never disabled (see ContractTable.jsx's
  // neverDisableMore); individual menu items still enforce their own permission checks.
  neverDisableMore = false,
  // All Job/Home only — see ContractTable.jsx's checkJobPermission.
  checkJobPermission = false,
  // Home only — see ContractTable.jsx's hideChildType.
  hideChildType = false,
}) {
  const meta = useMetaContext();
  const { user } = useAuth();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [viewingId, setViewingId] = useState(null);
  const [legalCommentId, setLegalCommentId] = useState(null);
  const [uploadSignContract, setUploadSignContract] = useState(null);
  const [linkedRequest, setLinkedRequest] = useState(null); // { masterContract, remark } | null
  const [refreshKey, setRefreshKey] = useState(0);

  const openLinkedRequest = remark => masterContract => setLinkedRequest({ masterContract, remark });

  // The row object here comes from GET /api/contracts (contractController.js's
  // listContracts) — a summary shape (supplier/contractNo/type/status/...) for table
  // display, NOT the full contract_requests detail the PDF needs (documents, payments,
  // comments, approverSignatures, briefDescription, requestorName, ...). Fetching the
  // full detail here (same fetchContractRequest call EditRequestModal's own Download
  // PDF button already uses) is what actually makes the row's data PDF-shaped — passing
  // the summary row straight into the PDF component would render it full of blanks.
  // RowActions (ContractTable.jsx) already wraps this in try/catch with a loading
  // spinner + Thai error alert, so failures here just need to propagate, not be handled
  // twice.
  const handleDownloadPdf = async contract => {
    const data = await fetchContractRequest(contract.id);
    // totalNetPrice comes back from the API as a plain numeric string ("22222.00") —
    // EditRequestModal.jsx's own loadContractData applies this exact same
    // normalizeThousands step before the data ever reaches its formik values (and so,
    // its own Download PDF button); doing it here too keeps the PDF's number
    // formatting identical regardless of which page triggered the download.
    await downloadContractRequisitionFormPdf({ ...data, totalNetPrice: normalizeThousands(data.totalNetPrice) }, contract.type);
  };

  // Reset filters + page whenever the scope changes (i.e. switching tabs)
  useEffect(() => {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  }, [statusScope?.join(',')]);

  useEffect(() => setPage(1), [JSON.stringify(filters)]);

  const { contracts, total, loading } = useContracts({
    ...filters,
    statuses: statusScope,
    hasContractNo: requireContractNo ? '1' : '',
    createdBy: scopeToCurrentUser ? user?.em_id : '',
    // Waiting Approve only: same em_id + current-stage-approver match the badge count uses.
    approverEmId: approvalMode ? user?.em_id : '',
    // Legal > Waiting only: legal_check = 0 is what drops a row off this list once
    // Checked — deliberately separate from `status`, same condition the badge uses.
    legalCheck: legalMode ? '0' : '',
    page,
    pageSize: PAGE_SIZE,
    refreshKey,
  });

  const scopedStatusOptions = statusScope ? statusScope.filter(s => (meta.statuses || []).includes(s)) : meta.statuses;

  return (
    <PageContainer>
      {(title || subtitle) && (
        <div className="mb-5">
          {title && <h1 className="text-2xl font-bold text-navy">{title}</h1>}
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
      )}

      <div className="flex flex-col gap-4">
        <ContractFilters
          filters={filters}
          onChange={setFilters}
          onClear={() => setFilters(EMPTY_FILTERS)}
          meta={meta}
          showYear={showYear}
          showBrowse={showBrowse}
          showExport={showExport}
          showSection={showSection}
          showStatus={showStatus}
          statusOptions={scopedStatusOptions}
        />
        {loading ? (
          <div className="rounded-xl2 border border-slate-200 bg-white py-16 text-center text-slate-400 shadow-card">กำลังโหลดข้อมูล...</div>
        ) : (
          <>
            <ContractTable
              contracts={contracts}
              variant={variant}
              enableEdit={enableEdit}
              onEdit={setEditingId}
              onDownload={handleDownloadPdf}
              onUploadSign={setUploadSignContract}
              onCancel={openLinkedRequest('cancel')}
              onRenew={openLinkedRequest('renew')}
              onAmend={openLinkedRequest('amend')}
              onClaimNote={openLinkedRequest('claim')}
              onTerminate={openLinkedRequest('terminate')}
              approvalMode={approvalMode || legalMode}
              onView={setViewingId}
              viewableStatuses={viewableStatuses}
              neverDisableMore={neverDisableMore}
              checkJobPermission={checkJobPermission}
              hideChildType={hideChildType}
              onLegalComment={contract => setLegalCommentId(contract.id)}
            />
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
          </>
        )}
      </div>

      {enableEdit && (
        <EditRequestModal
          contractId={editingId}
          onClose={() => setEditingId(null)}
          onSaved={() => {
            setRefreshKey(k => k + 1);
            // Covers this modal's Save Draft/Send Request/Save Change actions — Send
            // Request in particular moves the row into Waiting Approver 1, changing the
            // same badge counts (My Job, Waiting Approve) the approve/legal actions below
            // already refresh.
            meta.refreshMeta?.();
          }}
          enforceFilePermission={enforceFilePermission}
          titleOverride={editModalTitle}
        />
      )}

      {approvalMode && (
        <EditRequestModal
          mode="approve"
          contractId={viewingId}
          onClose={() => setViewingId(null)}
          onSaved={() => {
            setRefreshKey(k => k + 1);
            meta.refreshMeta?.();
          }}
        />
      )}

      {legalMode && (
        <EditRequestModal
          mode="legal"
          contractId={viewingId}
          onClose={() => setViewingId(null)}
          onSaved={() => {
            setRefreshKey(k => k + 1);
            meta.refreshMeta?.();
          }}
        />
      )}

      {/* Legal Comment (My Job/Contract Making/Upload Contract/All Job/Home's More menu,
          shown to legal users on a Signed/Drafted row not yet legal_check = 1) — reuses
          the exact same mode="legal" modal Legal > Waiting itself opens (same header,
          body, footer), just triggered from a different page's row action. */}
      {enableEdit && (
        <EditRequestModal
          mode="legal"
          contractId={legalCommentId}
          onClose={() => setLegalCommentId(null)}
          onSaved={() => {
            setRefreshKey(k => k + 1);
            meta.refreshMeta?.();
          }}
        />
      )}

      {viewableStatuses.length > 0 && <EditRequestModal mode="view" contractId={viewingId} onClose={() => setViewingId(null)} />}

      {enableEdit && uploadSignContract && (
        <UploadSignContractModal
          contract={uploadSignContract}
          onClose={() => setUploadSignContract(null)}
          onSaved={() => setRefreshKey(k => k + 1)}
        />
      )}

      {linkedRequest && (
        <LinkedRequestModal
          masterContract={linkedRequest.masterContract}
          remark={linkedRequest.remark}
          onClose={() => setLinkedRequest(null)}
          onSaved={() => {
            setRefreshKey(k => k + 1);
            // Save Draft/Send Request here creates a brand new contract_requests row
            // (status 'Saved' or 'Waiting Approver 1') — same badge-count refresh the
            // approve/legal actions above already trigger, since this changes the same
            // underlying counts (My Job, Waiting Approve, etc.).
            meta.refreshMeta?.();
          }}
        />
      )}
    </PageContainer>
  );
}
