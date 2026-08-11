import { useEffect, useRef, useState } from 'react';
import { useFormik } from 'formik';
import { FileText, MessageSquare, Save, Send, Trash2, UploadCloud, X } from 'lucide-react';
import FormModal from '../ui/FormModal';
import ConfirmModal from '../ui/ConfirmModal';
import WaitingModal from '../ui/WaitingModal';
import ResultModal from '../ui/ResultModal';
import TextAreaField from '../ui/TextAreaField';
import ContractInfoSection from '../../pages/NewRequest/sections/ContractInfoSection';
import ApprovalSection from '../../pages/NewRequest/sections/ApprovalSection';
import { REMARK_LABELS } from '../ui/RemarkBadge';
import { useAuth } from '../../context/AuthContext';
import { fetchContractTypes, fetchContractRequest, submitContractRequest } from '../../lib/api';
import { parseThousands } from '../../lib/formatNumber';
import { buildInitialValues, buildInitialValuesFromMaster, validateLinkedRequest } from '../../pages/NewRequest/formConfig';

const CONFIRM_MESSAGE = {
  draft: 'Save this contract request as a draft?',
  submitted: 'Submit this contract request for approval?',
};

const RESULT_MESSAGE = {
  draft: 'Your draft has been saved successfully.',
  submitted: 'Your contract request has been submitted successfully.',
};

// Short action word for the "___ Information" section + field labels below — distinct
// from REMARK_LABELS above (e.g. "Renew Contract"), which is for the modal title/badges,
// not mid-sentence use like "Background of ___".
const ACTION_LABELS = { renew: 'Renew', amend: 'Amend', claim: 'Claim Note', terminate: 'Terminate' };

// UI only for now, per request — background/detail/attachments aren't wired into the
// submit payload or persisted anywhere yet (no contract_requests columns for them yet).
// Local state here, not formik: keeping it out of `values` means it can't accidentally
// leak into submitContractRequest until there's a real field to send it as.
function ActionInfoSection({ remark, background, onBackgroundChange, detail, onDetailChange, files, onAttachFiles, onRemoveFile }) {
  const actionLabel = ACTION_LABELS[remark] || 'Request';

  return (
    <section>
      <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-6 py-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-brand-600 shadow-sm">
          <MessageSquare size={19} />
        </span>
        <div>
          <div className="font-bold text-navy">{actionLabel} Information</div>
          <div className="text-sm text-slate-500">Background, detail, and supporting attachments</div>
        </div>
      </div>

      <div className="space-y-5 p-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <TextAreaField label="Background" required value={background} onChange={e => onBackgroundChange(e.target.value)} />
          <TextAreaField label="Detail" required value={detail} onChange={e => onDetailChange(e.target.value)} />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-navy">Attach file</div>
              <div className="text-xs text-slate-500">Upload supporting files for this {actionLabel}.</div>
            </div>
            <label className="flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-brand-200 bg-white px-3 py-2 text-xs font-semibold text-brand-600 hover:bg-brand-50">
              <UploadCloud size={15} /> Attach file
              <input
                type="file"
                multiple
                className="hidden"
                onChange={e => {
                  // Selecting again after already having files attached adds to the list
                  // instead of replacing it (see onAttachFiles) — the OS picker's own
                  // multi-select handles picking several at once in a single go.
                  if (e.target.files.length) onAttachFiles(e.target.files);
                  e.target.value = '';
                }}
              />
            </label>
          </div>

          <div className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
            {files.length === 0 ? (
              <p className="text-sm text-slate-400">No files attached.</p>
            ) : (
              <ul className="space-y-1.5">
                {files.map((entry, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <FileText size={15} className="shrink-0 text-brand-600" />
                    <a
                      href={entry.url}
                      download={entry.file.name}
                      className="flex-1 truncate text-blue-600 underline hover:text-blue-700"
                    >
                      {entry.file.name}
                    </a>
                    <button
                      type="button"
                      onClick={() => onRemoveFile(index)}
                      className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// Opened from a Signed or Drafted row's More menu (Renew/Amend/Claim Note/Terminate) —
// creates a new, separate contract_requests row linked back to that row via
// referContractNo, going through the same draft/send-for-approval lifecycle as a brand
// new request. Only Contract Information + Approval are shown (Payment Term/Documents/
// Comment carry over from the master unedited, see buildInitialValuesFromMaster) since
// those don't change for a renewal/amendment/claim/termination — only what's being
// requested and who approves it do.
export default function LinkedRequestModal({ masterContract, remark, onClose, onSaved }) {
  const { user } = useAuth();
  const [contractTypes, setContractTypes] = useState([]);
  const [initialValues, setInitialValues] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [pendingSave, setPendingSave] = useState(null); // { status, values } | null
  const [background, setBackground] = useState('');
  const [detail, setDetail] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);

  useEffect(() => {
    if (!masterContract) return;
    setInitialValues(null);
    setLoadError(false);
    setBackground('');
    setDetail('');
    // Functional form so this revokes whatever was actually attached before this
    // reset, not a value captured in the effect's own closure.
    setAttachedFiles(prev => {
      prev.forEach(f => URL.revokeObjectURL(f.url));
      return [];
    });
    Promise.all([fetchContractTypes(), fetchContractRequest(masterContract.id)])
      .then(([types, masterData]) => {
        setContractTypes(types);
        setInitialValues(buildInitialValuesFromMaster(masterData, user, remark));
      })
      .catch(() => setLoadError(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [masterContract?.id, remark]);

  // Kept in sync every render (no effect needed) purely so the unmount-only cleanup
  // below can reach whatever was attached most recently without re-subscribing on
  // every attach/remove — an effect keyed on attachedFiles itself would revoke the
  // still-in-use URLs of the old array each time a file is added or removed.
  const attachedFilesRef = useRef(attachedFiles);
  attachedFilesRef.current = attachedFiles;

  useEffect(() => {
    return () => attachedFilesRef.current.forEach(f => URL.revokeObjectURL(f.url));
  }, []);

  const formik = useFormik({
    // Falls back to a fully-shaped empty form (not {}) even before the master data
    // loads — ApprovalSection's effect reads values.approvers unconditionally on mount,
    // and it can mount before enableReinitialize's own effect has swapped in the real
    // data (child effects run before this component's), so approvers must never be
    // undefined even for that first transient render.
    initialValues: initialValues || buildInitialValues(user),
    enableReinitialize: true,
    validate: validateLinkedRequest,
    onSubmit: values => setPendingSave({ status: 'submitted', values }),
  });

  if (!masterContract) return null;

  const handleAttachFiles = fileList =>
    setAttachedFiles(f => [...f, ...Array.from(fileList).map(file => ({ file, url: URL.createObjectURL(file) }))]);
  const handleRemoveFile = index =>
    setAttachedFiles(f => {
      URL.revokeObjectURL(f[index].url);
      return f.filter((_, i) => i !== index);
    });

  const handleSaveDraftClick = () => setPendingSave({ status: 'draft', values: formik.values });

  const handleConfirmYes = async () => {
    const pending = pendingSave;
    setPendingSave(null);
    setSaving(true);
    try {
      await submitContractRequest({
        ...pending.values,
        status: pending.status,
        totalNetPrice: parseThousands(pending.values.totalNetPrice),
        emId: user?.em_id,
        updatedName: user?.name,
      });
      setResult({ variant: 'success', message: RESULT_MESSAGE[pending.status] });
    } catch (err) {
      setResult({ variant: 'error', message: err.response?.data?.message || 'Failed to save data. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleResultClose = () => {
    const wasSuccess = result?.variant === 'success';
    setResult(null);
    if (wasSuccess) {
      onSaved?.();
      onClose();
    }
  };

  const footer = initialValues && !loadError && (
    <>
      <button
        type="button"
        onClick={handleSaveDraftClick}
        disabled={saving}
        className="flex h-11 items-center gap-2 rounded-2xl border border-slate-200 px-6 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-60"
      >
        <Save size={16} /> Save Draft
      </button>
      <button
        type="button"
        onClick={() => formik.submitForm()}
        disabled={saving}
        className="flex h-11 items-center gap-2 rounded-2xl bg-brand-600 px-6 text-sm font-semibold text-white shadow-soft hover:bg-brand-700 disabled:opacity-60"
      >
        <Send size={16} /> Send Request
      </button>
      <button
        type="button"
        onClick={onClose}
        disabled={saving}
        className="flex h-11 items-center gap-2 rounded-2xl border border-slate-200 px-6 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-60"
      >
        <X size={16} /> Cancel
      </button>
    </>
  );

  return (
    <>
      <FormModal
        open
        centerTitle
        title={`${REMARK_LABELS[remark] || remark}${masterContract.contractNo ? ` - ${masterContract.contractNo}` : ''}`}
        footer={footer}
        onClose={onClose}
        closeDisabled={saving}
      >
        {loadError && <div className="py-16 text-center text-rose-500">Failed to load contract data. Please try again.</div>}
        {!loadError && !initialValues && <div className="py-16 text-center text-slate-400">กำลังโหลดข้อมูล...</div>}
        {!loadError && initialValues && (
          <div className="divide-y-2 divide-slate-200 overflow-hidden rounded-xl2 border border-slate-200 bg-white shadow-card">
            {/* Contract Information carries over from the master contract as read-only
                context for Renew/Amend/Claim Note/Terminate — only what's specific to
                this action (Background/Detail/attachments below, and who approves it)
                is actually editable here. */}
            <ContractInfoSection formik={formik} contractTypes={contractTypes} readOnly />
            <ActionInfoSection
              remark={remark}
              background={background}
              onBackgroundChange={setBackground}
              detail={detail}
              onDetailChange={setDetail}
              files={attachedFiles}
              onAttachFiles={handleAttachFiles}
              onRemoveFile={handleRemoveFile}
            />
            <ApprovalSection formik={formik} />
          </div>
        )}
      </FormModal>

      <ConfirmModal
        open={!!pendingSave}
        message={pendingSave ? CONFIRM_MESSAGE[pendingSave.status] : undefined}
        busy={saving}
        onConfirm={handleConfirmYes}
        onCancel={() => setPendingSave(null)}
      />
      <WaitingModal open={saving} />
      <ResultModal open={!!result} variant={result?.variant} message={result?.message} onClose={handleResultClose} />
    </>
  );
}
