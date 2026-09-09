import { useEffect, useMemo, useState } from 'react';
import AsyncSelect from 'react-select/async';
import { Plus, Pencil, Trash2, Search, ShieldCheck, Loader2, Check, RotateCcw, Save, X } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import FormModal from '../../components/ui/FormModal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import ResultModal from '../../components/ui/ResultModal';
import SelectField from '../../components/ui/SelectField';
import Pagination from '../../components/ui/Pagination';
import { useAuth } from '../../context/AuthContext';
import { fetchRoles, createRole, updateRole, deleteRole, fetchEmployees } from '../../lib/api';
import { formatDateTime } from '../../lib/formatDate';

const EMPTY_FILTERS = { search: '', status: '' };
const PAGE_SIZE = 10;
const EMPTY_FORM = { emId: '', firstName: '', lastName: '', view: false, admin: false, legal: false, active: true };

// "000123 - สมชาย ใจดี" per the spec — distinct from ApprovalSection.jsx's own
// employee option label (just the name, no em_id prefix), since here the em_id
// itself is the thing actually being saved/keyed on, not just a display convenience.
const toOption = e => ({ value: e.emId, label: `${e.emId} - ${e.firstName} ${e.lastName}`, employee: e });

// Same debounce-with-queued-resolvers shape as ApprovalSection.jsx's own employee
// loader — duplicated rather than shared, since it's a small, self-contained utility
// and this page doesn't otherwise depend on that one.
function debouncePromise(fn, delay) {
  let timer;
  let pending = [];
  return (...args) =>
    new Promise(resolve => {
      pending.push(resolve);
      clearTimeout(timer);
      timer = setTimeout(() => {
        const resolvers = pending;
        pending = [];
        Promise.resolve(fn(...args))
          .catch(() => [])
          .then(result => resolvers.forEach(r => r(result)));
      }, delay);
    });
}

function PermissionCheck({ on }) {
  return (
    <span
      className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${
        on ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-300'
      }`}
    >
      {on ? <Check size={14} strokeWidth={3} /> : <span className="text-xs">–</span>}
    </span>
  );
}

function Switch({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3">
      <span className="text-sm font-semibold text-slate-600">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-brand-600' : 'bg-slate-200'}`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-[1.375rem]' : 'translate-x-0'
          }`}
        />
      </button>
    </label>
  );
}

export default function RoleTab() {
  const { user } = useAuth();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [page, setPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null); // admin_users row, or null when adding
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [pendingDelete, setPendingDelete] = useState(null); // role row, or null
  const [deleting, setDeleting] = useState(false);
  const [result, setResult] = useState(null); // { variant, message } | null

  const employeeLoader = useMemo(
    () => debouncePromise(inputValue => fetchEmployees({ search: inputValue }).then(rows => rows.map(toOption)), 300),
    []
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    fetchRoles({ search: filters.search, status: filters.status.toLowerCase() })
      .then(data => {
        if (cancelled) return;
        setRoles(data);
      })
      .catch(() => {
        if (cancelled) return;
        setRoles([]);
        setLoadError(true);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [filters.search, filters.status, refreshKey]);

  // The list itself has no page/pageSize params (see roleController's listRoles) —
  // admin_users is small enough to just fetch everything matching the filters and
  // paginate it client-side, same "total" shape the shared Pagination component
  // otherwise expects a backend to provide.
  useEffect(() => setPage(1), [filters.search, filters.status]);
  const pagedRoles = roles.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openAdd = () => {
    setEditingRole(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = role => {
    setEditingRole(role);
    setForm({
      emId: role.emId,
      firstName: role.firstName,
      lastName: role.lastName,
      view: role.view,
      admin: role.admin,
      legal: role.legal,
      active: role.active,
    });
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
  };

  const handleSelectEmployee = option => {
    if (!option) {
      setForm(f => ({ ...f, emId: '', firstName: '', lastName: '' }));
      return;
    }
    setForm(f => ({ ...f, emId: option.employee.emId, firstName: option.employee.firstName, lastName: option.employee.lastName }));
  };

  const handleSave = async () => {
    if (!editingRole && !form.emId) {
      setFormError('Please select an employee.');
      return;
    }
    setFormError('');
    setSaving(true);
    try {
      if (editingRole) {
        await updateRole(editingRole.id, {
          view: form.view,
          admin: form.admin,
          legal: form.legal,
          active: form.active,
          updatedName: user?.name,
        });
        setResult({ variant: 'success', message: `Role for "${form.firstName} ${form.lastName}" updated successfully.` });
      } else {
        await createRole({
          emId: form.emId,
          firstName: form.firstName,
          lastName: form.lastName,
          view: form.view,
          admin: form.admin,
          legal: form.legal,
          updatedName: user?.name,
        });
        setResult({ variant: 'success', message: `"${form.firstName} ${form.lastName}" has been added successfully.` });
      }
      setShowModal(false);
      setRefreshKey(k => k + 1);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteRole(pendingDelete.id, { updatedName: user?.name });
      setResult({ variant: 'success', message: `"${pendingDelete.firstName} ${pendingDelete.lastName}" has been removed.` });
      setPendingDelete(null);
      setRefreshKey(k => k + 1);
    } catch (err) {
      setResult({ variant: 'error', message: err.response?.data?.message || 'Failed to remove. Please try again.' });
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <PageContainer>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">ROLE MANAGEMENT</h1>
          <p className="mt-1 text-sm text-slate-500">จัดการสิทธิ์การใช้งานของผู้ใช้งานในระบบ</p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="ml-auto flex h-11 items-center gap-2 rounded-2xl bg-brand-600 px-5 text-sm font-semibold text-white shadow-soft hover:bg-brand-700"
        >
          <Plus size={16} /> Add New Role
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl2 border border-slate-200 bg-white p-5 shadow-card">
        <label className="block w-full sm:w-72">
          <span className="mb-2 block text-xs font-semibold tracking-wide text-slate-500">SEARCH</span>
          <div className="relative">
            <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              placeholder="Employee ID, First name, Last name..."
              className="h-11 w-full rounded-2xl border border-slate-200 pl-10 pr-3 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
            />
          </div>
        </label>
        <SelectField
          label="STATUS"
          value={filters.status}
          onChange={v => setFilters(f => ({ ...f, status: v }))}
          options={['Active', 'Inactive']}
          className="block w-full sm:w-48"
        />
        <button
          type="button"
          onClick={() => setFilters(EMPTY_FILTERS)}
          className="flex h-11 items-center gap-1.5 rounded-2xl px-3 text-sm font-medium text-slate-400 hover:text-slate-600 sm:ml-auto"
        >
          <RotateCcw size={16} /> Clear
        </button>
      </div>

      <div className="overflow-hidden rounded-xl2 border border-slate-200 bg-white shadow-card">
        {loading ? (
          <div className="py-16 text-center text-slate-400">กำลังโหลดข้อมูล...</div>
        ) : loadError ? (
          <div className="py-16 text-center text-rose-500">Failed to load users. Please try again.</div>
        ) : !roles.length ? (
          <div className="py-16 text-center text-slate-400">No users found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-3">Employee ID</th>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3 text-center">View</th>
                  <th className="px-6 py-3 text-center">Admin</th>
                  <th className="px-6 py-3 text-center">Legal</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-center">Updated By</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody>
                {pagedRoles.map(role => (
                  <tr key={role.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                    <td className="px-6 py-3 font-mono font-semibold text-slate-700">{role.emId}</td>
                    <td className="px-6 py-3 font-semibold text-navy">
                      {role.firstName} {role.lastName}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <PermissionCheck on={role.view} />
                    </td>
                    <td className="px-6 py-3 text-center">
                      <PermissionCheck on={role.admin} />
                    </td>
                    <td className="px-6 py-3 text-center">
                      <PermissionCheck on={role.legal} />
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span
                        className={`inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-bold ${
                          role.active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {role.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      {role.updatedBy ? (
                        <>
                          <div className="truncate font-semibold text-slate-700">{role.updatedBy}</div>
                          <div className="whitespace-nowrap text-xs text-slate-400">{formatDateTime(role.updatedAt)}</div>
                        </>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(role)}
                          className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDelete(role)}
                          className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && !loadError && roles.length > 0 && (
        <div className="mt-4">
          <Pagination page={page} pageSize={PAGE_SIZE} total={roles.length} onPageChange={setPage} />
        </div>
      )}

      <FormModal
        open={showModal}
        size="boxed"
        title={
          <span className="inline-flex items-center gap-2">
            <ShieldCheck size={18} className="text-brand-600" />
            {editingRole ? 'Edit User Role' : 'Add User Role'}
          </span>
        }
        onClose={closeModal}
        closeDisabled={saving}
        footer={
          <>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex h-11 items-center gap-2 rounded-2xl bg-brand-600 px-6 text-sm font-semibold text-white shadow-soft hover:bg-brand-700 disabled:opacity-60"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save
            </button>
            <button
              type="button"
              onClick={closeModal}
              disabled={saving}
              className="flex h-11 items-center gap-2 rounded-2xl border border-slate-200 px-6 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-60"
            >
              <X size={16} /> Cancel
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold tracking-wide text-slate-500">
              Employee {!editingRole && <span className="text-rose-500">*</span>}
            </span>
            {editingRole ? (
              <div className="flex h-11 items-center rounded-2xl border border-slate-200 bg-slate-100 px-4 text-sm text-slate-600">
                {form.emId} - {form.firstName} {form.lastName}
              </div>
            ) : (
              <AsyncSelect
                classNamePrefix="rs"
                isClearable
                cacheOptions
                defaultOptions
                placeholder="ค้นหาด้วย Employee ID, First name หรือ Last name..."
                loadOptions={employeeLoader}
                onChange={handleSelectEmployee}
                menuPortalTarget={document.body}
                styles={{ menuPortal: base => ({ ...base, zIndex: 60 }) }}
              />
            )}
          </label>

          <Switch label="View" checked={form.view} onChange={v => setForm(f => ({ ...f, view: v }))} />
          <Switch label="Admin" checked={form.admin} onChange={v => setForm(f => ({ ...f, admin: v }))} />
          <Switch label="Legal" checked={form.legal} onChange={v => setForm(f => ({ ...f, legal: v }))} />
          {editingRole && <Switch label="Active" checked={form.active} onChange={v => setForm(f => ({ ...f, active: v }))} />}

          {formError && <p className="text-xs font-medium text-rose-500">{formError}</p>}
        </div>
      </FormModal>

      <ConfirmModal
        open={!!pendingDelete}
        busy={deleting}
        title="Confirm Remove"
        message={pendingDelete ? `Remove "${pendingDelete.firstName} ${pendingDelete.lastName}" from Role Management?` : undefined}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setPendingDelete(null)}
      />
      <ResultModal open={!!result} variant={result?.variant} message={result?.message} onClose={() => setResult(null)} />
    </PageContainer>
  );
}
