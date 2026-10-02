import { useEffect, useState } from 'react';
import { Search, RotateCcw, History } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import SelectField from '../../components/ui/SelectField';
import Pagination from '../../components/ui/Pagination';
import { fetchActivityLogs, fetchActivityLogActions } from '../../lib/api';
import { formatDateTime } from '../../lib/formatDate';

const EMPTY_FILTERS = { search: '', action: '', dateFrom: '', dateTo: '' };
const PAGE_SIZE = 20;

// Raw activity_logs.action values (see contract-server's app/utils/activityLog.js call
// sites) -> a readable label + a tone, same brand/amber/green/rose/slate language
// StatusBadge.jsx uses elsewhere. Anything not listed here (future action types added
// server-side) still renders fine — falls back to the raw string, slate tone.
const ACTION_META = {
  login_success: { label: 'Login Success', tone: 'green' },
  login_failed: { label: 'Login Failed', tone: 'rose' },
  send_request: { label: 'Send Request', tone: 'brand' },
  save_draft: { label: 'Save Draft', tone: 'slate' },
  save_change: { label: 'Save Change', tone: 'slate' },
  cancel_request: { label: 'Cancel Request', tone: 'rose' },
  approve: { label: 'Approve', tone: 'green' },
  return: { label: 'Return', tone: 'amber' },
  reject: { label: 'Reject', tone: 'rose' },
  waive: { label: 'Waive', tone: 'amber' },
  legal_comment: { label: 'Legal Comment', tone: 'brand' },
  legal_check: { label: 'Legal Check', tone: 'green' },
  legal_terminate: { label: 'Legal Terminate', tone: 'rose' },
  legal_waive: { label: 'Legal Waive', tone: 'amber' },
  legal_cancel: { label: 'Legal Cancel', tone: 'rose' },
  upload_signed_contract: { label: 'Upload Signed Contract', tone: 'green' },
  set_original_at: { label: 'Set Original At', tone: 'brand' },
  role_create: { label: 'Role Created', tone: 'green' },
  role_update: { label: 'Role Updated', tone: 'amber' },
  role_delete: { label: 'Role Deleted', tone: 'rose' },
  contract_type_create: { label: 'Contract Type Created', tone: 'green' },
  contract_type_update: { label: 'Contract Type Updated', tone: 'amber' },
  contract_purpose_create: { label: 'Purpose Created', tone: 'green' },
  contract_purpose_update: { label: 'Purpose Updated', tone: 'amber' },
  global_document_upload: { label: 'Document Uploaded', tone: 'brand' },
};

const TONE_CLASS = {
  brand: 'bg-brand-50 text-brand-600',
  amber: 'bg-amber-50 text-amber-600',
  green: 'bg-emerald-50 text-emerald-600',
  rose: 'bg-rose-50 text-rose-600',
  slate: 'bg-slate-100 text-slate-500',
};

function ActionPill({ action }) {
  const meta = ACTION_META[action] || { label: action, tone: 'slate' };
  return <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-base font-bold ${TONE_CLASS[meta.tone]}`}>{meta.label}</span>;
}

export default function ActivityLogTab() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [actionOptions, setActionOptions] = useState([]);

  useEffect(() => {
    fetchActivityLogActions()
      .then(setActionOptions)
      .catch(() => setActionOptions([]));
  }, []);

  useEffect(() => setPage(1), [filters.search, filters.action, filters.dateFrom, filters.dateTo]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    fetchActivityLogs({ ...filters, page, pageSize: PAGE_SIZE })
      .then(res => {
        if (cancelled) return;
        setData(res);
      })
      .catch(() => {
        if (cancelled) return;
        setData({ items: [], total: 0 });
        setLoadError(true);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [filters, page]);

  return (
    <PageContainer>
      <div className="mb-5  ">
        <h1 className="text-2xl font-bold text-navy">ACTIVITY LOG</h1>
        <p className="mt-1 text-base text-black">ประวัติการใช้งานระบบ — login, ส่งคำร้อง, อนุมัติ/ปฏิเสธ, อัปโหลด, และการเปลี่ยนแปลงใน Settings</p>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl2 border border-slate-200 bg-white p-5 shadow-card">
        <label className="block w-full sm:w-64">
          <span className="mb-2 block text-base font-semibold tracking-wide text-slate-500">SEARCH</span>
          <div className="relative">
            <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              placeholder="ชื่อผู้ใช้, Employee ID, รายละเอียด..."
              className="h-11 w-full rounded-2xl border border-slate-200 pl-10 pr-3 text-base text-slate-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
            />
          </div>
        </label>
        <SelectField
          label="ACTION"
          value={filters.action}
          onChange={v => setFilters(f => ({ ...f, action: v }))}
          options={actionOptions.map(a => ({ value: a, label: ACTION_META[a]?.label || a }))}
          className="block w-full sm:w-56"
        />
        <label className="block w-full sm:w-44">
          <span className="mb-2 block text-base font-semibold tracking-wide text-slate-500">FROM</span>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
            className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-base text-slate-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
          />
        </label>
        <label className="block w-full sm:w-44">
          <span className="mb-2 block text-base font-semibold tracking-wide text-slate-500">TO</span>
          <input
            type="date"
            value={filters.dateTo}
            onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))}
            className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-base text-slate-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
          />
        </label>
        <button
          type="button"
          onClick={() => setFilters(EMPTY_FILTERS)}
          className="flex h-11 items-center gap-1.5 rounded-2xl px-3 text-base font-medium text-slate-400 hover:text-slate-600 sm:ml-auto"
        >
          <RotateCcw size={16} /> Clear
        </button>
      </div>

      <div className="overflow-hidden rounded-xl2 border border-slate-200 bg-white shadow-card">
        {loading ? (
          <div className="py-16 text-center text-slate-400">กำลังโหลดข้อมูล...</div>
        ) : loadError ? (
          <div className="py-16 text-center text-rose-500">Failed to load activity log. Please try again.</div>
        ) : !data.items.length ? (
          <div className="py-16 text-center text-slate-400">
            <History size={28} className="mx-auto mb-2 text-slate-300" />
            No activity found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse text-base">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-base font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-3">Time</th>
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Action</th>
                  <th className="px-6 py-3">Detail</th>
                  <th className="px-6 py-3">IP Address</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map(row => (
                  <tr key={row.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                    <td className="whitespace-nowrap px-6 py-3 text-slate-500">{formatDateTime(row.createdAt)}</td>
                    <td className="px-6 py-3">
                      <div className="font-semibold text-navy">{row.userName || '—'}</div>
                      {row.emId && <div className="font-mono text-base text-slate-400">{row.emId}</div>}
                    </td>
                    <td className="px-6 py-3">
                      <ActionPill action={row.action} />
                    </td>
                    <td className="max-w-[360px] truncate px-6 py-3 text-slate-600" title={row.detail || ''}>
                      {row.detail || '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-3 font-mono text-base text-slate-400">{row.ipAddress || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && !loadError && data.items.length > 0 && (
        <div className="mt-4">
          <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPageChange={setPage} />
        </div>
      )}
    </PageContainer>
  );
}
