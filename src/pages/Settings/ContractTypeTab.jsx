import { useEffect, useRef, useState } from 'react';
import Select from 'react-select';
import { Plus, Pencil, Check, X, FileText, UploadCloud, FileDown, Loader2, Trash2 } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import ConfirmModal from '../../components/ui/ConfirmModal';
import ResultModal from '../../components/ui/ResultModal';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime } from '../../lib/formatDate';
import { formatThousands, parseThousands } from '../../lib/formatNumber';
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
  downloadUploadFileFromPath,
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
  const Icon = active ? Check : X;
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-base font-semibold transition-colors ${
        active ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
      }`}
    >
      <Icon size={13} strokeWidth={3} /> {active ? 'Active' : 'Inactive'}
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
  // Replacing an already-attached file asks first — clicking "Replace X" opens this
  // confirm instead of the native file picker directly; the picker only opens once
  // the user says Yes (see confirmReplaceYes). Uploading the very first file (no doc
  // attached yet, button reads "Upload X") skips this and opens the picker right away.
  const [confirmReplace, setConfirmReplace] = useState(false);
  const fileInputRef = useRef(null);

  const handleButtonClick = () => {
    if (doc?.filePath) {
      setConfirmReplace(true);
    } else {
      fileInputRef.current?.click();
    }
  };

  const confirmReplaceYes = () => {
    setConfirmReplace(false);
    fileInputRef.current?.click();
  };

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

      <button
        type="button"
        onClick={handleButtonClick}
        disabled={busy}
        title={tooltip}
        className={`flex h-11 w-56 shrink-0 items-center justify-center gap-2 overflow-hidden rounded-2xl border border-slate-200 bg-white px-4 text-base font-semibold text-slate-600 shadow-card ${
          busy ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-slate-50'
        }`}
      >
        {busy ? <Loader2 size={16} className="shrink-0 animate-spin" /> : <UploadCloud size={16} className="shrink-0" />}
        <span className="truncate">{doc?.filePath ? `Replace ${label}` : `Upload ${label}`}</span>
      </button>
      <input ref={fileInputRef} type="file" className="hidden" disabled={busy} onChange={pickAndAttach} />

      <ConfirmModal
        open={confirmReplace}
        message={`Replace the current ${label}?`}
        onConfirm={confirmReplaceYes}
        onCancel={() => setConfirmReplace(false)}
      />
    </div>
  );
}

// One row per language (ENG / THA): shows a download link + Replace/Delete when a file
// is attached, or just a single "Attach" file picker when it isn't. Each language is
// fully independent — attaching or deleting one never touches the other.
function FormItemLangRow({ purpose, lang, label, onChange }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // Same "confirm before the native file picker opens" gate as GlobalDocumentButton
  // above — only when replacing an already-attached file (path truthy); the initial
  // "Attach" with nothing attached yet opens the picker immediately.
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileInputRef = useRef(null);
  const path = lang === 'eng' ? purpose.formItem?.fileEngPath : purpose.formItem?.fileThaPath;

  const handlePickClick = () => {
    if (path) {
      setConfirmReplace(true);
    } else {
      fileInputRef.current?.click();
    }
  };

  const confirmReplaceYes = () => {
    setConfirmReplace(false);
    fileInputRef.current?.click();
  };

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

  const confirmDeleteYes = async () => {
    setConfirmDelete(false);
    setBusy(true);
    try {
      await deleteFormItemLang(purpose.id, lang);
      onChange();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`rounded-xl border p-3 ${path ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-center gap-2">
        <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-base font-bold uppercase tracking-wide text-slate-500">{label}</span>
        {path ? (
          <button
            type="button"
            onClick={() => downloadUploadFileFromPath(path, `${purpose.purposeText} (${label})`)}
            className="flex min-w-0 flex-1 items-center gap-1.5 text-left text-base font-semibold text-brand-600 hover:underline"
          >
            <FileDown size={14} className="shrink-0" /> <span className="truncate">Download current file</span>
          </button>
        ) : (
          <span className="flex-1 text-base text-slate-400">No file attached</span>
        )}
      </div>

      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={handlePickClick}
          disabled={busy}
          className={`flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 text-base font-semibold text-slate-600 ${
            busy ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-slate-100'
          }`}
        >
          {busy ? <Loader2 size={13} className="animate-spin" /> : <UploadCloud size={13} />}
          {path ? 'Replace' : 'Attach'}
        </button>
        <input ref={fileInputRef} type="file" className="hidden" disabled={busy} onChange={pickAndAttach} />
        {path && (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            disabled={busy}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 disabled:opacity-50"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {error && <span className="mt-1.5 block text-base font-medium text-rose-500">{error}</span>}

      <ConfirmModal
        open={confirmReplace}
        message={`Replace the current ${label} file?`}
        onConfirm={confirmReplaceYes}
        onCancel={() => setConfirmReplace(false)}
      />
      <ConfirmModal
        open={confirmDelete}
        busy={busy}
        message={`Delete the current ${label} file?`}
        onConfirm={confirmDeleteYes}
        onCancel={() => setConfirmDelete(false)}
      />
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
            className="h-9 w-full rounded-lg border border-slate-200 px-3 text-base outline-none focus:border-brand-500"
            placeholder="Purpose text"
            autoFocus
          />
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base outline-none focus:border-brand-500"
            placeholder="Description (optional)"
            rows={3}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => saveConfirm.ask(doSave, 'Purpose updated successfully.')}
              disabled={!form.purposeText.trim()}
              className="flex h-8 items-center gap-1 rounded-lg bg-brand-600 px-3 text-base font-semibold text-white disabled:opacity-50"
            >
              <Check size={13} /> Save
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-3 text-base font-semibold text-slate-600"
            >
              <X size={13} /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-base font-bold text-slate-400">#{index + 1}</span>
              <span className="break-words font-semibold text-navy">{purpose.purposeText}</span>
              {!purpose.active && (
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-base font-bold uppercase text-slate-500">Inactive</span>
              )}
            </div>
            {purpose.description && <div className="mt-0.5 whitespace-pre-line break-words text-base text-slate-500">{purpose.description}</div>}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setForm({ purposeText: purpose.purposeText, description: purpose.description || '' });
                setEditing(true);
              }}
              className="flex h-8 items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 text-base font-semibold text-brand-600 hover:bg-brand-100"
            >
              <Pencil size={13} /> Edit
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

      <div className="mt-3 grid grid-cols-1 gap-2 border-t border-slate-100 pt-3 sm:grid-cols-2">
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
        className="h-9 w-full rounded-lg border border-slate-200 px-3 text-base outline-none focus:border-brand-500"
        placeholder="Purpose text"
        autoFocus
      />
      <textarea
        value={form.description}
        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base outline-none focus:border-brand-500"
        placeholder="Description (optional)"
        rows={3}
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={add}
          disabled={saving || !form.purposeText.trim()}
          className="flex h-8 items-center gap-1 rounded-lg bg-brand-600 px-3 text-base font-semibold text-white disabled:opacity-50"
        >
          <Check size={13} /> Add
        </button>
        <button type="button" onClick={onDone} className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-3 text-base font-semibold text-slate-600">
          <X size={13} /> Cancel
        </button>
      </div>
    </div>
  );
}

// Left column (see ContractTypeTab below) — plain selectable row, same visual
// language as DownloadFormPage.jsx's own type list (border-l-4 + bg-brand-50/60 for
// the selected one) so this page matches that one's layout exactly. No inline
// edit/toggle controls here on purpose — those live in TypeDetailPanel's header
// instead, where there's room for them; this list stays a clean selector.
function TypeListItem({ type, active, onSelect }) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={`block w-full border-l-4 px-5 py-4 text-left transition-colors ${
          active ? 'border-brand-600 bg-brand-50/60' : 'border-transparent hover:bg-slate-50'
        }`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-base font-semibold ${active ? 'text-brand-700' : 'text-navy'}`}>{type.name}</span>
          {!type.active && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-base font-bold uppercase text-slate-500">Inactive</span>}
        </div>
        {type.description && <div className="mt-1 truncate text-base text-slate-400">{type.description}</div>}
      </button>
    </li>
  );
}

// Right column — the selected type's full detail: header (name/description, Edit +
// Active/Inactive toggle) same as DownloadFormPage.jsx's own header row but with
// mutation controls added, then its purposes (each still a full PurposeRow with its
// ENG/THA file rows, unchanged) plus Add Purpose. Replaces TypeCard's old expand/
// collapse accordion — the left list's selection IS the expand mechanism now, so this
// always renders full detail for whichever type is currently selected.
function TypeDetailPanel({ type, onChange }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: type.name,
    description: type.description || '',
    allowCustomPurpose: type.allowCustomPurpose,
    checkConstructionRisk: !!type.checkConstructionRisk,
    constructionRiskExemptAbove: formatThousands(type.constructionRiskExemptAbove ?? ''),
  });
  // Construction Risk Classification grouping — which single purpose of this type
  // counts as High vs Low risk (see risk_level on contract_type_purposes). Kept here
  // rather than on each PurposeRow since both pickers need to see each other's
  // selection to enforce "a purpose can only be picked once" (see the options
  // filtering below) — that cross-checking is easiest done from one shared parent.
  const [highId, setHighId] = useState(type.purposes.find(p => p.riskLevel === 'high')?.id ?? null);
  const [lowId, setLowId] = useState(type.purposes.find(p => p.riskLevel === 'low')?.id ?? null);
  const [showNewPurpose, setShowNewPurpose] = useState(false);
  const saveConfirm = useConfirmAction();
  const toggleConfirm = useConfirmAction();

  // Switching the selected type in the left list while mid-edit (or mid Add Purpose)
  // on the previous one shouldn't carry that stale form state into the newly
  // selected type's panel.
  useEffect(() => {
    setForm({
      name: type.name,
      description: type.description || '',
      allowCustomPurpose: type.allowCustomPurpose,
      checkConstructionRisk: !!type.checkConstructionRisk,
      constructionRiskExemptAbove: formatThousands(type.constructionRiskExemptAbove ?? ''),
    });
    setHighId(type.purposes.find(p => p.riskLevel === 'high')?.id ?? null);
    setLowId(type.purposes.find(p => p.riskLevel === 'low')?.id ?? null);
    setEditing(false);
    setShowNewPurpose(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type.id]);

  const purposeOptions = type.purposes.map(p => ({ value: p.id, label: p.purposeText }));

  const doSave = async () => {
    await updateContractType(type.id, { ...form, constructionRiskExemptAbove: parseThousands(form.constructionRiskExemptAbove) });

    // Only purposes whose classification actually changed get an update call —
    // most saves touch none of them (the High/Low pickers are usually untouched
    // while editing name/description).
    const riskUpdates = type.purposes
      .map(p => {
        const nextLevel = p.id === highId ? 'high' : p.id === lowId ? 'low' : null;
        return nextLevel !== (p.riskLevel || null) ? updatePurpose(p.id, { riskLevel: nextLevel }) : null;
      })
      .filter(Boolean);
    await Promise.all(riskUpdates);

    setEditing(false);
    onChange();
  };

  const doToggleActive = async () => {
    await updateContractType(type.id, { active: !type.active });
    onChange();
  };

  return (
    <section className="overflow-hidden rounded-xl2 border border-slate-200 bg-white shadow-card">
      {editing ? (
        <div className="space-y-3 border-b border-slate-100 bg-slate-50 p-6">
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-base outline-none focus:border-brand-500"
            placeholder="Name"
            autoFocus
          />
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base outline-none focus:border-brand-500"
            placeholder="Description (optional)"
            rows={3}
          />
          <label className="flex items-center gap-2 text-base text-slate-600">
            <input
              type="checkbox"
              checked={form.allowCustomPurpose}
              onChange={e => setForm(f => ({ ...f, allowCustomPurpose: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            อนุญาตให้กรอกวัตถุประสงค์เอง (พิมพ์ข้อความอิสระแทนการเลือกจากดรอปดาวน์ในหน้า New Request)
          </label>
          <label className="flex cursor-pointer items-start gap-2.5 pt-1">
            <input
              type="checkbox"
              checked={form.checkConstructionRisk}
              onChange={e => setForm(f => ({ ...f, checkConstructionRisk: e.target.checked }))}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-2 border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-base text-slate-600">สัญญานี้ต้องประเมิน Construction Risk Classification Checklist</span>
          </label>

          {form.checkConstructionRisk && (
            <label className="block pl-[1.625rem]">
              <span className="mb-1.5 block text-base text-slate-500">
                ไม่ต้องทำแบบประเมิน ถ้ามูลค่าสัญญา (Total Net Price) มากกว่า (บาท) — เว้นว่างไว้ถ้าต้องประเมินทุกมูลค่า
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={form.constructionRiskExemptAbove}
                onChange={e => setForm(f => ({ ...f, constructionRiskExemptAbove: formatThousands(e.target.value) }))}
                className="h-10 w-full max-w-xs rounded-xl border border-slate-200 px-3 text-base outline-none focus:border-brand-500"
                placeholder="เช่น 5,000,000"
              />
            </label>
          )}

          {form.checkConstructionRisk && (
            <div className="grid grid-cols-1 gap-3 rounded-xl border border-amber-200 bg-amber-50/50 p-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-base font-bold uppercase tracking-wide text-amber-700">High</span>
                <Select
                  classNamePrefix="rs"
                  isClearable
                  placeholder="เลือก purpose..."
                  options={purposeOptions.filter(o => o.value !== lowId)}
                  value={purposeOptions.find(o => o.value === highId) || null}
                  onChange={option => setHighId(option?.value ?? null)}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-base font-bold uppercase tracking-wide text-emerald-700">Low</span>
                <Select
                  classNamePrefix="rs"
                  isClearable
                  placeholder="เลือก purpose..."
                  options={purposeOptions.filter(o => o.value !== highId)}
                  value={purposeOptions.find(o => o.value === lowId) || null}
                  onChange={option => setLowId(option?.value ?? null)}
                />
              </label>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => saveConfirm.ask(doSave, 'Contract type updated successfully.')}
              disabled={!form.name.trim()}
              className="flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-4 text-base font-semibold text-white disabled:opacity-50"
            >
              <Check size={14} /> Save
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 px-4 text-base font-semibold text-slate-600"
            >
              <X size={14} /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <header className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-6 py-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand-600 text-white">
            <FileText size={19} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="break-words font-bold text-navy">{type.name}</span>
              {!type.active && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-base font-bold uppercase text-slate-500">Inactive</span>}
              {type.checkConstructionRisk && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-base font-bold uppercase text-amber-700">Risk Checklist</span>
              )}
            </div>
            {type.description && <div className="mt-0.5 break-words text-base text-slate-500">{type.description}</div>}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowNewPurpose(true)}
              className="flex h-9 items-center gap-1.5 rounded-xl bg-teal-600 px-3 text-base font-semibold text-white shadow-soft hover:bg-teal-700"
            >
              <Plus size={14} /> Add Purpose
            </button>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="flex h-9 items-center gap-1.5 rounded-xl bg-brand-50 px-3 text-base font-semibold text-brand-600 hover:bg-brand-100"
            >
              <Pencil size={14} /> Edit
            </button>
            <ActiveToggle
              active={type.active}
              onToggle={() => toggleConfirm.ask(doToggleActive, `"${type.name}" has been ${type.active ? 'deactivated' : 'activated'}.`)}
            />
          </div>
        </header>
      )}

      <div className="space-y-3 p-6">
        {type.purposes.map((p, pIndex) => (
          <PurposeRow key={p.id} purpose={p} index={pIndex} onChange={onChange} />
        ))}

        {showNewPurpose && <NewPurposeForm typeId={type.id} onDone={() => setShowNewPurpose(false)} onChange={onChange} />}
      </div>

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
    </section>
  );
}

export default function ContractTypeTab() {
  const [types, setTypes] = useState([]);
  const [activeTypeId, setActiveTypeId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [globalDocs, setGlobalDocs] = useState({ documents: [] });
  const [showNewType, setShowNewType] = useState(false);
  const [newType, setNewType] = useState({
    name: '',
    description: '',
    allowCustomPurpose: false,
    checkConstructionRisk: false,
    constructionRiskExemptAbove: '',
  });
  const newTypeConfirm = useConfirmAction();
  const [docNotice, setDocNotice] = useState(null); // { variant, message } | null

  const refresh = () =>
    fetchAdminContractTypes()
      .then(data => {
        setTypes(data);
        // Keeps whatever's currently selected in the left list if it's still present
        // after the refresh; falls back to the first type otherwise (first load, or
        // the previously-selected one somehow no longer exists) — activeTypeId never
        // ends up pointing at nothing while types.length > 0.
        setActiveTypeId(prev => (data.some(t => t.id === prev) ? prev : (data[0]?.id ?? null)));
      })
      .catch(() => setTypes([]));
  const refreshGlobalDocs = () => fetchGlobalDocuments().then(setGlobalDocs).catch(() => {});
  const reportDocResult = (variant, message) => setDocNotice({ variant, message });

  useEffect(() => {
    refresh().finally(() => setLoading(false));
    refreshGlobalDocs();
  }, []);

  const openNewType = () => {
    setNewType({
      name: '',
      description: '',
      allowCustomPurpose: false,
      checkConstructionRisk: false,
      constructionRiskExemptAbove: '',
    });
    setShowNewType(true);
  };

  const doAddType = async () => {
    const created = await createContractType({ ...newType, constructionRiskExemptAbove: parseThousands(newType.constructionRiskExemptAbove) });
    setShowNewType(false);
    await refresh();
    // Jump straight to the new type in the right panel instead of leaving whatever
    // was selected before — refresh() above would otherwise keep that old selection.
    setActiveTypeId(created.id);
  };

  const activeType = types.find(t => t.id === activeTypeId);

  return (
    <PageContainer>
      <div className="mb-5  flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">CONTRACT TYPE</h1>
          <p className="mt-1 text-base text-black">จัดการประเภทสัญญา วัตถุประสงค์ และไฟล์แบบฟอร์มที่แนบ</p>
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
        </div>
      </div>

      {showNewType && (
        <div className="mb-5 space-y-3 rounded-xl2 border border-dashed border-slate-300 bg-white p-5 shadow-card">
          <input
            value={newType.name}
            onChange={e => setNewType(f => ({ ...f, name: e.target.value }))}
            className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-base outline-none focus:border-brand-500"
            placeholder="Name"
            autoFocus
          />
          <textarea
            value={newType.description}
            onChange={e => setNewType(f => ({ ...f, description: e.target.value }))}
            className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-base outline-none focus:border-brand-500"
            placeholder="Description (optional)"
            rows={3}
          />
          <label className="flex items-center gap-2 text-base text-slate-600">
            <input
              type="checkbox"
              checked={newType.allowCustomPurpose}
              onChange={e => setNewType(f => ({ ...f, allowCustomPurpose: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            อนุญาตให้กรอกวัตถุประสงค์เอง (พิมพ์ข้อความอิสระแทนการเลือกจากดรอปดาวน์ในหน้า New Request)
          </label>
          <label className="flex cursor-pointer items-start gap-2.5 pt-1">
            <input
              type="checkbox"
              checked={newType.checkConstructionRisk}
              onChange={e => setNewType(f => ({ ...f, checkConstructionRisk: e.target.checked }))}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-2 border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-base text-slate-600">สัญญานี้ต้องประเมิน Construction Risk Classification Checklist</span>
          </label>

          {newType.checkConstructionRisk && (
            <label className="block pl-[1.625rem]">
              <span className="mb-1.5 block text-base text-slate-500">
                ไม่ต้องทำแบบประเมิน ถ้ามูลค่าสัญญา (Total Net Price) มากกว่า (บาท) — เว้นว่างไว้ถ้าต้องประเมินทุกมูลค่า
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={newType.constructionRiskExemptAbove}
                onChange={e => setNewType(f => ({ ...f, constructionRiskExemptAbove: formatThousands(e.target.value) }))}
                className="h-10 w-full max-w-xs rounded-2xl border border-slate-200 px-3 text-base outline-none focus:border-brand-500"
                placeholder="เช่น 5,000,000"
              />
            </label>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => newTypeConfirm.ask(doAddType, `Contract type "${newType.name}" created successfully.`)}
              disabled={!newType.name.trim()}
              className="flex h-10 items-center gap-1.5 rounded-2xl bg-brand-600 px-4 text-base font-semibold text-white disabled:opacity-50"
            >
              <Check size={15} /> Save
            </button>
            <button
              type="button"
              onClick={() => setShowNewType(false)}
              className="flex h-10 items-center gap-1.5 rounded-2xl border border-slate-200 px-4 text-base font-semibold text-slate-600"
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
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr] lg:items-start">
          {/* Left: contract type list — same layout as DownloadFormPage.jsx */}
          <aside className="overflow-hidden rounded-xl2 border border-slate-200 bg-white shadow-card">
            <div className="border-b border-slate-100 p-3">
              <button
                type="button"
                onClick={() => (showNewType ? setShowNewType(false) : openNewType())}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-teal-600 text-base font-semibold text-white shadow-soft hover:bg-teal-700"
              >
                <Plus size={16} /> Add Contract Type
              </button>
            </div>
            <ul className="divide-y divide-slate-100">
              {types.map(t => (
                <TypeListItem key={t.id} type={t} active={t.id === activeTypeId} onSelect={() => setActiveTypeId(t.id)} />
              ))}
            </ul>
          </aside>

          {/* Right: selected type's purposes + form files */}
          {!activeType ? (
            <section className="rounded-xl2 border border-slate-200 bg-white py-16 text-center text-slate-400 shadow-card">
              เลือกประเภทสัญญาเพื่อดูรายละเอียด
            </section>
          ) : (
            <TypeDetailPanel type={activeType} onChange={refresh} />
          )}
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
