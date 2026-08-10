import { useEffect, useState } from 'react';
import PageContainer from '../../components/layout/PageContainer';
import ContractFilters, { EMPTY_FILTERS } from '../../components/contracts/ContractFilters';
import ActionHistoryTable from '../../components/contracts/ActionHistoryTable';
import Pagination from '../../components/ui/Pagination';
import EditRequestModal from '../../components/contracts/EditRequestModal';
import { useAuth } from '../../context/AuthContext';
import { useMetaContext } from '../../context/MetaContext';
import { fetchApprovalHistory } from '../../lib/api';

const PAGE_SIZE = 10;

// Approval > My History — Approve/Return/Reject actions the logged-in user has taken,
// newest first. "View" always opens the underlying contract read-only (mode="view");
// unlike My Job/Waiting Approve this list never mutates data itself, so it doesn't need
// a refreshKey of its own — navigating here always fetches fresh via the effect below.
export default function MyHistoryTab() {
  const { user } = useAuth();
  const meta = useMetaContext();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [viewingId, setViewingId] = useState(null);

  useEffect(() => setPage(1), [JSON.stringify(filters)]);

  useEffect(() => {
    if (!user?.em_id) return undefined;
    let cancelled = false;
    setLoading(true);
    fetchApprovalHistory({ ...filters, emId: user.em_id, page, pageSize: PAGE_SIZE })
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
  }, [user?.em_id, page, JSON.stringify(filters)]);

  return (
    <PageContainer>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-navy">MY HISTORY</h1>
        <p className="mt-1 text-sm text-slate-500">ประวัติการอนุมัติ (Approve, Return, Reject) ของคุณ</p>
      </div>

      <div className="flex flex-col gap-4">
        <ContractFilters
          filters={filters}
          onChange={setFilters}
          onClear={() => setFilters(EMPTY_FILTERS)}
          meta={meta}
          showStatus
          statusOptions={['Approve', 'Return', 'Reject']}
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

      <EditRequestModal mode="view" contractId={viewingId} onClose={() => setViewingId(null)} />
    </PageContainer>
  );
}
