import { useEffect, useState } from 'react';
import ContractFilters, { EMPTY_FILTERS } from './ContractFilters';
import ContractTable from './ContractTable';
import EditRequestModal from './EditRequestModal';
import UploadSignContractModal from './UploadSignContractModal';
import Pagination from '../ui/Pagination';
import PageContainer from '../layout/PageContainer';
import { useContracts } from '../../hooks/useContracts';
import { useMetaContext } from '../../context/MetaContext';
import { useAuth } from '../../context/AuthContext';

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
  includeNoNeededForCurrentUser = false, // true = also show this user's own 'No Needed' rows (e.g. "My History")
  viewableStatuses = [], // statuses for which the "more" menu offers read-only View (e.g. "My History"'s Rejected/Canceled)
}) {
  const meta = useMetaContext();
  const { user } = useAuth();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [viewingId, setViewingId] = useState(null);
  const [uploadSignContract, setUploadSignContract] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

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
    // My History only: 'No Needed' rows aren't part of statusScope (HISTORY_STATUSES)
    // since that status ends a request's lifecycle outside the normal flow — OR'd in
    // server-side, scoped to this user's own em_id like scopeToCurrentUser above.
    noNeededEmId: includeNoNeededForCurrentUser ? user?.em_id : '',
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
              onUploadSign={setUploadSignContract}
              approvalMode={approvalMode || legalMode}
              onView={setViewingId}
              viewableStatuses={viewableStatuses}
            />
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
          </>
        )}
      </div>

      {enableEdit && (
        <EditRequestModal
          contractId={editingId}
          onClose={() => setEditingId(null)}
          onSaved={() => setRefreshKey(k => k + 1)}
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

      {viewableStatuses.length > 0 && <EditRequestModal mode="view" contractId={viewingId} onClose={() => setViewingId(null)} />}

      {enableEdit && uploadSignContract && (
        <UploadSignContractModal
          contract={uploadSignContract}
          onClose={() => setUploadSignContract(null)}
          onSaved={() => setRefreshKey(k => k + 1)}
        />
      )}
    </PageContainer>
  );
}
