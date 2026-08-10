import { useEffect, useState } from 'react';
import PageContainer from '../../components/layout/PageContainer';
import ContractFilters, { EMPTY_FILTERS } from '../../components/contracts/ContractFilters';
import ActionHistoryTable from '../../components/contracts/ActionHistoryTable';
import Pagination from '../../components/ui/Pagination';
import EditRequestModal from '../../components/contracts/EditRequestModal';
import { useAuth } from '../../context/AuthContext';
import { useMetaContext } from '../../context/MetaContext';
import { fetchLegalHistory } from '../../lib/api';

const PAGE_SIZE = 10;

// Legal > History — Check/Terminate actions any legal user has taken, newest first.
// Not filtered by created_by: legal is a shared role queue, so every legal user sees
// the same combined history. "View" opens the underlying contract in Legal History
// Mode — read-only except it can still Terminate (adding a new row here), so this
// list needs its own refreshKey unlike Approval's read-only-only My History.
export default function LegalHistoryTab() {
  const { user } = useAuth();
  const meta = useMetaContext();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [viewingId, setViewingId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => setPage(1), [JSON.stringify(filters)]);

  useEffect(() => {
    if (!user?.legal) {
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    fetchLegalHistory({ ...filters, page, pageSize: PAGE_SIZE })
      .then(data => {
        if (cancelled) return;
        setItems(data.items || []);
        setTotal(data.total || 0);
      })
      .catch(() => {
        if (cancelled) return;
        setItems([]);
        setTotal(0);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [user?.legal, page, refreshKey, JSON.stringify(filters)]);

  return (
    <PageContainer>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-navy">LEGAL HISTORY</h1>
        <p className="mt-1 text-sm text-slate-500">ประวัติการดำเนินการของฝ่ายกฎหมาย (Check, Terminate)</p>
      </div>

      {!user?.legal ? (
        <div className="rounded-xl2 border border-slate-200 bg-white py-16 text-center text-slate-400 shadow-card">
          คุณไม่มีสิทธิ์เข้าถึงหน้านี้
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <ContractFilters
            filters={filters}
            onChange={setFilters}
            onClear={() => setFilters(EMPTY_FILTERS)}
            meta={meta}
            showStatus
            statusOptions={['Check', 'Terminate']}
          />
          {loading ? (
            <div className="rounded-xl2 border border-slate-200 bg-white py-16 text-center text-slate-400 shadow-card">กำลังโหลดข้อมูล...</div>
          ) : (
            <>
              <ActionHistoryTable items={items} onView={setViewingId} />
              <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
            </>
          )}
        </div>
      )}

      <EditRequestModal
        mode="legal-history"
        contractId={viewingId}
        onClose={() => setViewingId(null)}
        onSaved={() => {
          setRefreshKey(k => k + 1);
          meta.refreshMeta?.();
        }}
      />
    </PageContainer>
  );
}
