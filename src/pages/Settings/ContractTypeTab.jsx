import { useEffect, useState } from 'react';
import { Plus, Pencil, Check, X, ChevronDown, ChevronRight, UploadCloud, FileDown, Loader2, Trash2 } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import ConfirmModal from '../../components/ui/ConfirmModal';
import ResultModal from '../../components/ui/ResultModal';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime } from '../../lib/formatDate';
import {
  fetchAdminContractTypes,
  createContractType,
  updateContractType,
  createPurpose,
  updatePurpose,
  attachFormItemLang,
  deleteFormItemLang,
  fetchGlobalDocuments,
  attachGlobalDocument,
  uploadFiles,
  downloadUploadFile,
  fileUrl,
} from '../../lib/api';

// Wraps a mutating action behind a "Confirm to save" popup: ask(fn, successMessage)
// opens the modal, confirm() runs fn then shows a "complete" popup, cancel() closes
// without running anything.
function useConfirmAction() {
  const [pending, setPending] = useState(null); // { run, successMessage }
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(null); // successMessage string, or null when hidden

  const ask = (run, successMessage) => setPending({ run, successMessage });
  const cancel = () => setPending(null);
  const confirm = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      await pending.run();
      setComplete(pending.successMessage || 'Saved successfully.');
    } finally {
      setBusy(false);
      setPending(null);
    }
  };
  const closeComplete = () => setComplete(null);

  return { open: !!pending, busy, ask, cancel, confirm, complete, closeComplete };
}

function ActiveToggle({ active, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`h-9 shrink-0 rounded-lg px-3 text-xs font-semibold transition-colors ${
        active ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
      }`}
    >
      {active ? 'Active' : 'Inactive'}
    </button>
  );
}

// Singleton document upload (Contract Procedure / Check Sheet / User Manual) — no
// delete, since there's always meant to be exactly one; picking a new file just
// replaces it. Download goes through downloadUploadFile (authenticated blob fetch)
// rather than a plain <a href> — every /api route now requires a Bearer token, which
// a raw browser navigation can't attach, so a plain link 401'd every time.
//
// Fixed h-11/w-56 sizing and a hover title (no inline file-name caption) keep this
// button's footprint identical whether a file is attached or not — a long file name
// used to render as a caption under the button and blow up the toolbar layout.
// Upload/download outcomes are reported up via onResult so the parent can show one
// shared success/error notification instead of inline text that would do the same.
function GlobalDocumentButton({ docKey, label, doc, onChange, onResult }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);

  const pickAndAttach = async e => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const [record] = await uploadFiles([file]);
      await attachGlobalDocument(docKey, record.id, { emId: user?.em_id, updatedName: user?.name });
      onChange();
      onResult('success', `${label} uploaded successfully.`);
    } catch {
      onResult('error', `Failed to upload ${label}. Please try again.`);
    } finally {
      setBusy(false);
    }
  };

  const handleDownload = async () => {
    if (!doc?.fileId) return;
    try {
      await downloadUploadFile(doc.fileId, doc.fileName || label);
    } catch {
      onResult('error', `Failed to download ${label}. Please try again.`);
    }
  };

  const tooltip = doc?.fileName
    ? `${doc.fileName} · Uploaded by ${doc.updatedByName || '-'} · ${formatDateTime(doc.updatedAt)}`
    : `No ${label} uploaded yet`;

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <button
        type="button"
        onClick={handleDownload}
        disabled={!doc?.fileId}
        title={tooltip}
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border shadow-card transition-colors ${
          doc?.fileId
            ? 'border-slate-200 bg-white text-emerald-600 hover:bg-emerald-50'
            : 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300'
        }`}
      >
        <FileDown size={18} />
      </button>

      <label
        title={tooltip}
        className={`flex h-11 w-56 shrink-0 items-center justify-center gap-2 overflow-hidden rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 shadow-card ${
          busy ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-slate-50'
        }`}
      >
        {busy ? <Loader2 size={16} className="shrink-0 animate-spin" /> : <UploadCloud size={16} className="shrink-0" />}
        <span className="truncate">{doc?.filePath ? `Replace ${label}` : `Upload ${label}`}</span>
        <input type="file" className="hidden" disabled={busy} onChange={pickAndAttach} />
      </label>
    </div>
  );
}

// One row per language (ENG / THA): shows a download link + Replace/Delete when a file
// is attached, or just a single "Attach" file picker when it isn't. Each language is
// fully independent — attaching or deleting one never touches the other.
function FormItemLangRow({ purpose, lang, label, onChange }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const path = lang === 'eng' ? purpose.formItem?.fileEngPath : purpose.formItem?.fileThaPath;

  const pickAndAttach = async e => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const [record] = await uploadFiles([file]);
      await attachFormItemLang(purpose.id, lang, record.id);
      onChange();
    } catch {
      setError('แนบไฟล์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await deleteFormItemLang(purpose.id, lang);
      onChange();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
      <span className="w-10 shrink-0 text-xs font-bold uppercase tracking-wide text-slate-400">{label}</span>

      {path ? (
        <a
          href={fileUrl(path)}
          target="_blank"
          rel="noreferrer"
          className="flex flex-1 items-center gap-1.5 text-sm font-semibold text-brand-600 hover:underline"
        >
          <FileDown size={14} /> Download current file
        </a>
      ) : (
        <span className="flex-1 text-sm text-slate-400">No file attached</span>
      )}

      <div className="flex shrink-0 items-center gap-2">
        <label
          className={`flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 ${
            busy ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-slate-100'
          }`}
        >
          {busy ? <Loader2 size={13} className="animate-spin" /> : <UploadCloud size={13} />}
          {path ? 'Replace' : 'Attach'}
          <input type="file" className="hidden" disabled={busy} onChange={pickAndAttach} />
        </label>
        {path && (
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 disabled:opacity-50"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {error && <span className="w-full text-xs font-medium text-rose-500">{error}</span>}
    </div>
  );
}

function PurposeRow({ purpose, index, onChange }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ purposeText: purpose.purposeText, description: purpose.description || '' });
  const saveConfirm = useConfirmAction();
  const toggleConfirm = useConfirmAction();

  const doSave = async () => {
    await updatePurpose(purpose.id, form);
    setEditing(false);
    onChange();
  };

  const doToggleActive = async () => {
    await updatePurpose(purpose.id, { active: !purpose.active });
    onChange();
  };

  return (
    <div className={`rounded-2xl border p-4 ${purpose.active ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-100/60'}`}>
      {editing ? (
        <div className="space-y-2">
          <input
            value={form.purposeText}
            onChange={e => setForm(f => ({ ...f, purposeText: e.target.value }))}
            className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-500"
            placeholder="Purpose text"
            autoFocus
          />
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
            placeholder="Description (optional)"
            rows={3}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => saveConfirm.ask(doSave, 'Purpose updated successfully.')}
              disabled={!form.purposeText.trim()}
              className="flex h-8 items-center gap-1 rounded-lg bg-brand-600 px-3 text-xs font-semibold text-white disabled:opacity-50"
            >
              <Check size={13} /> Save
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600"
            >
              <X size={13} /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-400">#{index + 1}</span>
              <span className="font-semibold text-navy">{purpose.purposeText}</span>
              {!purpose.active && (
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500">Inactive</span>
              )}
            </div>
            {purpose.description && <div className="mt-0.5 whitespace-pre-line text-sm text-slate-500">{purpose.description}</div>}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setForm({ purposeText: purpose.purposeText, description: purpose.description || '' });
                setEditing(true);
              }}
              className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <Pencil size={14} />
            </button>
            <ActiveToggle
              active={purpose.active}
              onToggle={() =>
                toggleConfirm.ask(doToggleActive, `"${purpose.purposeText}" has been ${purpose.active ? 'deactivated' : 'activated'}.`)
              }
            />
          </div>
        </div>
      )}

      <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
        <FormItemLangRow purpose={purpose} lang="eng" label="ENG" onChange={onChange} />
        <FormItemLangRow purpose={purpose} lang="tha" label="THA" onChange={onChange} />
      </div>

      <ConfirmModal
        open={saveConfirm.open}
        busy={saveConfirm.busy}
        message="Save changes to this purpose?"
        onConfirm={saveConfirm.confirm}
        onCancel={saveConfirm.cancel}
      />
      <ResultModal open={!!saveConfirm.complete} variant="success" message={saveConfirm.complete} onClose={saveConfirm.closeComplete} />

      <ConfirmModal
        open={toggleConfirm.open}
        busy={toggleConfirm.busy}
        message={`${purpose.active ? 'Deactivate' : 'Activate'} "${purpose.purposeText}"?`}
        onConfirm={toggleConfirm.confirm}
        onCancel={toggleConfirm.cancel}
      />
      <ResultModal open={!!toggleConfirm.complete} variant="success" message={toggleConfirm.complete} onClose={toggleConfirm.closeComplete} />
    </div>
  );
}

function NewPurposeForm({ typeId, onDone, onChange }) {
  const [form, setForm] = useState({ purposeText: '', description: '' });
  const [saving, setSaving] = useState(false);

  const add = async () => {
    if (!form.purposeText.trim()) return;
    setSaving(true);
    try {
      await createPurpose(typeId, form);
      onChange();
      onDone();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2 rounded-2xl border border-dashed border-slate-300 bg-white p-4">
      <input
        value={form.purposeText}
        onChange={e => setForm(f => ({ ...f, purposeText: e.target.value }))}
        className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-500"
        placeholder="Purpose text"
        autoFocus
      />
      <textarea
        value={form.description}
        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
        placeholder="Description (optional)"
        rows={3}
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={add}
          disabled={saving || !form.purposeText.trim()}
          className="flex h-8 items-center gap-1 rounded-lg bg-brand-600 px-3 text-xs font-semibold text-white disabled:opacity-50"
        >
          <Check size={13} /> Add
        </button>
        <button type="button" onClick={onDone} className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600">
          <X size={13} /> Cancel
        </button>
      </div>
    </div>
  );
}

function TypeCard({ type, index, onChange }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: type.name, description: type.description || '', allowCustomPurpose: type.allowCustomPurpose });
  const [showNewPurpose, setShowNewPurpose] = useState(false);
  const saveConfirm = useConfirmAction();
  const toggleConfirm = useConfirmAction();

  const doSave = async () => {
    await updateContractType(type.id, form);
    setEditing(false);
    onChange();
  };

  const doToggleActive = async () => {
    await updateContractType(type.id, { active: !type.active });
    onChange();
  };

  return (
    <div className={`overflow-hidden rounded-xl2 border shadow-card ${type.active ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50/70'}`}>
      {editing ? (
        <div className="space-y-3 p-5">
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-brand-500"
            placeholder="Name"
            autoFocus
          />
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
            placeholder="Description (optional)"
            rows={3}
          />
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={form.allowCustomPurpose}
              onChange={e => setForm(f => ({ ...f, allowCustomPurpose: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            Allow custom purpose (free text instead of a dropdown on the New Request form)
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => saveConfirm.ask(doSave, 'Contract type updated successfully.')}
              disabled={!form.name.trim()}
              className="flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-4 text-xs font-semibold text-white disabled:opacity-50"
            >
              <Check size={14} /> Save
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-600"
            >
              <X size={14} /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex w-full cursor-pointer items-center gap-3 px-5 py-4 hover:bg-slate-50/60" onClick={() => setExpanded(x => !x)}>
          {expanded ? <ChevronDown size={18} className="shrink-0 text-slate-400" /> : <ChevronRight size={18} className="shrink-0 text-slate-400" />}
          <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">#{index + 1}</span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-navy">{type.name}</span>
              {!type.active && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500">Inactive</span>}
            </div>
            {type.description && <div className="mt-0.5 truncate text-sm text-slate-500">{type.description}</div>}
          </div>
          <div className="flex shrink-0 items-center gap-1.5" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => {
                setForm({ name: type.name, description: type.description || '', allowCustomPurpose: type.allowCustomPurpose });
                setEditing(true);
              }}
              className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <Pencil size={15} />
            </button>
            <ActiveToggle
              active={type.active}
              onToggle={() => toggleConfirm.ask(doToggleActive, `"${type.name}" has been ${type.active ? 'deactivated' : 'activated'}.`)}
            />
          </div>
        </div>
      )}

      {expanded && !editing && (
        <div className="space-y-3 border-t border-slate-100 bg-slate-50/40 p-5">
          {type.purposes.map((p, pIndex) => (
            <PurposeRow key={p.id} purpose={p} index={pIndex} onChange={onChange} />
          ))}

          {showNewPurpose ? (
            <NewPurposeForm typeId={type.id} onDone={() => setShowNewPurpose(false)} onChange={onChange} />
          ) : (
            <button
              type="button"
              onClick={() => setShowNewPurpose(true)}
              className="flex h-10 items-center gap-2 rounded-2xl border border-dashed border-slate-300 px-4 text-sm font-semibold text-slate-500 hover:border-brand-300 hover:text-brand-600"
            >
              <Plus size={15} /> Add Purpose
            </button>
          )}
        </div>
      )}

      <ConfirmModal
        open={saveConfirm.open}
        busy={saveConfirm.busy}
        message={`Save changes to "${type.name}"?`}
        onConfirm={saveConfirm.confirm}
        onCancel={saveConfirm.cancel}
      />
      <ResultModal open={!!saveConfirm.complete} variant="success" message={saveConfirm.complete} onClose={saveConfirm.closeComplete} />

      <ConfirmModal
        open={toggleConfirm.open}
        busy={toggleConfirm.busy}
        message={`${type.active ? 'Deactivate' : 'Activate'} "${type.name}"?`}
        onConfirm={toggleConfirm.confirm}
        onCancel={toggleConfirm.cancel}
      />
      <ResultModal open={!!toggleConfirm.complete} variant="success" message={toggleConfirm.complete} onClose={toggleConfirm.closeComplete} />
    </div>
  );
}

export default function ContractTypeTab() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalDocs, setGlobalDocs] = useState({ documents: [] });
  const [showNewType, setShowNewType] = useState(false);
  const [newType, setNewType] = useState({ name: '', description: '', allowCustomPurpose: false });
  const newTypeConfirm = useConfirmAction();
  const [docNotice, setDocNotice] = useState(null); // { variant, message } | null

  const refresh = () => fetchAdminContractTypes().then(setTypes).catch(() => setTypes([]));
  const refreshGlobalDocs = () => fetchGlobalDocuments().then(setGlobalDocs).catch(() => {});
  const reportDocResult = (variant, message) => setDocNotice({ variant, message });

  useEffect(() => {
    refresh().finally(() => setLoading(false));
    refreshGlobalDocs();
  }, []);

  const openNewType = () => {
    setNewType({ name: '', description: '', allowCustomPurpose: false });
    setShowNewType(true);
  };

  const doAddType = async () => {
    await createContractType(newType);
    setShowNewType(false);
    await refresh();
  };

  return (
    <PageContainer>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">CONTRACT TYPE</h1>
          <p className="mt-1 text-sm text-slate-500">จัดการประเภทสัญญา วัตถุประสงค์ และไฟล์แบบฟอร์มที่แนบ</p>
        </div>
        {/* ml-auto (not the parent's justify-between) is what keeps this action group
            right-aligned even when it wraps to its own row on tablet/narrow widths —
            justify-between only anchors a lone wrapped item to the row's start. */}
        <div className="ml-auto flex flex-wrap items-start justify-end gap-3">
          <GlobalDocumentButton
            docKey="contract_procedure"
            label="Contract Procedure"
            doc={globalDocs.documents?.find(d => d.docKey === 'contract_procedure')}
            onChange={refreshGlobalDocs}
            onResult={reportDocResult}
          />
          <GlobalDocumentButton
            docKey="user_manual"
            label="User Manual"
            doc={globalDocs.documents?.find(d => d.docKey === 'user_manual')}
            onChange={refreshGlobalDocs}
            onResult={reportDocResult}
          />
          <GlobalDocumentButton
            docKey="check_sheet"
            label="Check Sheet"
            doc={globalDocs.documents?.find(d => d.docKey === 'check_sheet')}
            onChange={refreshGlobalDocs}
            onResult={reportDocResult}
          />
          <button
            type="button"
            onClick={() => (showNewType ? setShowNewType(false) : openNewType())}
            className="flex h-11 items-center gap-2 rounded-2xl bg-brand-600 px-5 text-sm font-semibold text-white shadow-soft hover:bg-brand-700"
          >
            <Plus size={16} /> Add Contract Type
          </button>
        </div>
      </div>

      {showNewType && (
        <div className="mb-5 space-y-3 rounded-xl2 border border-dashed border-slate-300 bg-white p-5 shadow-card">
          <input
            value={newType.name}
            onChange={e => setNewType(f => ({ ...f, name: e.target.value }))}
            className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm outline-none focus:border-brand-500"
            placeholder="Name"
            autoFocus
          />
          <textarea
            value={newType.description}
            onChange={e => setNewType(f => ({ ...f, description: e.target.value }))}
            className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            placeholder="Description (optional)"
            rows={3}
          />
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={newType.allowCustomPurpose}
              onChange={e => setNewType(f => ({ ...f, allowCustomPurpose: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            Allow custom purpose (free text instead of a dropdown on the New Request form)
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => newTypeConfirm.ask(doAddType, `Contract type "${newType.name}" created successfully.`)}
              disabled={!newType.name.trim()}
              className="flex h-10 items-center gap-1.5 rounded-2xl bg-brand-600 px-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              <Check size={15} /> Save
            </button>
            <button
              type="button"
              onClick={() => setShowNewType(false)}
              className="flex h-10 items-center gap-1.5 rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-600"
            >
              <X size={15} /> Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="rounded-xl2 border border-slate-200 bg-white py-16 text-center text-slate-400 shadow-card">กำลังโหลดข้อมูล...</div>
      ) : !types.length ? (
        <div className="rounded-xl2 border border-slate-200 bg-white py-16 text-center text-slate-400 shadow-card">ยังไม่มีประเภทสัญญาในระบบ</div>
      ) : (
        <div className="space-y-3">
          {types.map((t, index) => (
            <TypeCard key={t.id} type={t} index={index} onChange={refresh} />
          ))}
        </div>
      )}

      <ConfirmModal
        open={newTypeConfirm.open}
        busy={newTypeConfirm.busy}
        message={`Create a new contract type "${newType.name}"?`}
        onConfirm={newTypeConfirm.confirm}
        onCancel={newTypeConfirm.cancel}
      />
      <ResultModal open={!!newTypeConfirm.complete} variant="success" message={newTypeConfirm.complete} onClose={newTypeConfirm.closeComplete} />
      <ResultModal
        open={!!docNotice}
        variant={docNotice?.variant || 'success'}
        message={docNotice?.message}
        onClose={() => setDocNotice(null)}
      />
    </PageContainer>
  );
}
