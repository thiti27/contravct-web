import { useEffect, useMemo, useState } from 'react';
import { FileText, Save, Trash2, Upload, UploadCloud, X } from 'lucide-react';
import FormModal from '../ui/FormModal';
import ConfirmModal from '../ui/ConfirmModal';
import WaitingModal from '../ui/WaitingModal';
import ResultModal from '../ui/ResultModal';
import RadioGroup from '../ui/RadioGroup';
import DateField from '../ui/DateField';
import FieldShell from '../ui/FieldShell';
import NoteAlert from '../ui/NoteAlert';
import { useAuth } from '../../context/AuthContext';
import { uploadFiles, uploadSignedContract } from '../../lib/api';

// English-only labels/buttons/messages, matching the rest of the app (EditRequestModal's
// footer copy, RequestFormFields section titles, etc.) — Thai lives only as a smaller,
// muted secondary hint under a field's label (via FieldShell's `hint` prop) or next to a
// radio option (via RadioGroup's `description`), never inline in the same size/weight as
// the English. Keeps every label reading as one clear line instead of two scripts
// competing for attention.
const T = {
  // fileLabel: 'Signed Contract File',
  // fileHint: 'ไฟล์สัญญาที่ลงนามแล้ว',
  chooseFile: 'Choose the signed contract PDF',
  browse: 'Browse',
  fileNote: 'The file must contain all signed pages in a single document.',
  fileNoteHint: 'ไฟล์ต้องรวมหน้าสัญญาที่ลงนามครบถ้วนทั้งหมดไว้ในไฟล์เดียว',

  sectionExpiry: 'Expiry & Renewal',
  // conditionLabel: 'Condition',
  hasExpiry: 'Contract has an expiry date',
  hasExpiryHint: 'สัญญามีวันหมดอายุ',
  noExpiry: 'Contract has no expiry date',
  noExpiryHint: 'สัญญาไม่มีวันหมดอายุ',

  startDate: 'Contract Start Date',
  // startDateHint: 'วันที่เริ่มมีผลของสัญญา',
  endDate: 'Contract End Date',
  // endDateHint: 'วันสิ้นสุดสัญญา',

  renewal: 'Renewal',
  autoRenewal: 'Auto Renewal',
  autoRenewalHint: 'ต่ออายุอัตโนมัติ',
  noAutoRenewal: 'No Auto Renewal',
  noAutoRenewalHint: 'ไม่มีการต่ออายุอัตโนมัติ',
  // renewalPeriod: 'Renewal Period',
  // renewEveryHint: 'ต่ออายุอัตโนมัติทุก ____ ปี',
  reminder: 'Reminder Before Expiry',
  // reminderHint: 'แจ้งเตือนก่อนสัญญาหมดอายุ',

  noExpiryInfo: 'This contract has no expiry date.',
  noExpiryInfoHint: 'สัญญานี้ไม่มีวันหมดอายุ',

  modalTitle: 'Upload Sign Contract',
  save: 'Upload',
  cancel: 'Cancel',
  confirmTitle: 'Confirm Upload',
  confirmMessage: 'Are you sure you want to save this signed contract?',
  successMessage: 'Signed contract has been uploaded successfully.',
  errorMessage: 'Failed to upload the signed contract. Please try again.',
  errFileRequired: 'Please select the signed contract PDF file.',
  errOneFileOnly: 'You can upload only one file.',
  errPdfOnly: 'Only PDF (.pdf) files are supported.',
  errRequired: 'This field is required.',
  errEndAfterStart: 'Contract End Date must be after Contract Start Date.',
  errRenewalChoice: 'Select either Auto Renewal or No Auto Renewal.',
};

const EXPIRY_OPTIONS = [
  { value: 'has_expiry', label: T.hasExpiry, description: T.hasExpiryHint },
  { value: 'no_expiry', label: T.noExpiry, description: T.noExpiryHint },
];

const AUTO_RENEWAL_OPTIONS = [
  { value: 'auto', label: T.autoRenewal, description: T.autoRenewalHint },
  { value: 'none', label: T.noAutoRenewal, description: T.noAutoRenewalHint },
];

// Bold navy divider between the File and Expiry/Renewal groups — same weight/color
// ContractInfoSection uses for its section headers, scaled down for this compact modal.
function SectionTitle({ children }) {
  return <h3 className="border-b border-slate-100 pb-2 text-sm font-bold text-navy">{children}</h3>;
}

const REMINDER_OPTIONS = [
  { value: 15, label: '15 Days' },
  { value: 30, label: '30 Days' },
  { value: 45, label: '45 Days' },
  { value: 60, label: '60 Days' },
  { value: 90, label: '90 Days' },
];

function buildEmptyForm() {
  return {
    expiryChoice: 'has_expiry',
    contractStartDate: '',
    contractEndDate: '',
    autoRenewalChoice: null, // 'auto' | 'none' | null
    autoRenewalYears: '',
    reminderBeforeExpiryDays: '',
  };
}

// Opened from a "Drafted" contract row's More menu — lets the requestor attach the
// counter-signed PDF and its expiry/renewal policy, which flips the row to "Signed".
// Self-contained and reusable: only needs the row's {id, supplier, contractNo}.
export default function UploadSignContractModal({ contract, onClose, onSaved }) {
  const { user } = useAuth();
  const [form, setForm] = useState(buildEmptyForm);
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [errors, setErrors] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  if (!contract) return null;

  const hasExpiry = form.expiryChoice === 'has_expiry';

  const setField = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const handleFileChange = e => {
    const fileList = e.target.files;
    const count = fileList ? fileList.length : 0;
    // Read everything needed from fileList before clearing .value — on some
    // browsers that reset also empties the same live FileList this still
    // references, not just the input's own .files going forward.
    const picked = count > 0 ? fileList[0] : null;
    e.target.value = ''; // allow re-selecting the same file after removing it

    if (count === 0) return;

    if (count > 1) {
      setFileError(T.errOneFileOnly);
      return;
    }
    if (picked.type !== 'application/pdf' && !picked.name.toLowerCase().endsWith('.pdf')) {
      setFileError(T.errPdfOnly);
      return;
    }
    setFileError('');
    setErrors(prev => (prev.file ? { ...prev, file: undefined } : prev));
    setFile(picked);
  };

  const removeFile = () => setFile(null);

  // Lets the user open/download the exact file they picked, to double-check it before
  // Upload — file.name alone isn't proof, and the file hasn't reached the server yet at
  // this point so there's nothing else to link to. Revoked on every change so picking a
  // new file (or closing the modal) doesn't leak the previous blob URL.
  const fileUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
    };
  }, [fileUrl]);

  const validate = () => {
    const next = {};
    if (!file) next.file = T.errFileRequired;

    if (hasExpiry) {
      if (!form.contractStartDate) next.contractStartDate = T.errRequired;
      if (!form.contractEndDate) next.contractEndDate = T.errRequired;
      if (form.contractStartDate && form.contractEndDate && form.contractEndDate <= form.contractStartDate) {
        next.contractEndDate = T.errEndAfterStart;
      }
      if (!form.autoRenewalChoice) {
        next.autoRenewalChoice = T.errRenewalChoice;
      } else if (form.autoRenewalChoice === 'auto') {
        // Renew Every and Reminder Before Expiry only matter (and are only shown)
        // once Auto Renewal is chosen — validating them any other time would block
        // Save on fields the user can't even see.
        if (!form.autoRenewalYears) next.autoRenewalYears = T.errRequired;
        if (!form.reminderBeforeExpiryDays) next.reminderBeforeExpiryDays = T.errRequired;
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSaveClick = () => {
    if (validate()) setConfirmOpen(true);
  };

  const handleConfirmYes = async () => {
    setSaving(true);
    try {
      const [uploaded] = await uploadFiles([file]);
      await uploadSignedContract(contract.id, {
        fileId: uploaded.id,
        hasExpiry,
        contractStartDate: hasExpiry ? form.contractStartDate : null,
        contractEndDate: hasExpiry ? form.contractEndDate : null,
        autoRenewal: hasExpiry ? form.autoRenewalChoice === 'auto' : null,
        autoRenewalYears: hasExpiry && form.autoRenewalChoice === 'auto' ? Number(form.autoRenewalYears) : null,
        reminderBeforeExpiryDays: hasExpiry && form.autoRenewalChoice === 'auto' ? Number(form.reminderBeforeExpiryDays) : null,
        emId: user?.em_id,
        updatedName: user?.name,
      });
      setConfirmOpen(false);
      setResult({ variant: 'success', message: T.successMessage });
    } catch (err) {
      setConfirmOpen(false);
      setResult({ variant: 'error', message: err.response?.data?.message || T.errorMessage });
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

  const footer = (
    <>
      <button
        type="button"
        onClick={handleSaveClick}
        disabled={saving}
        className="flex h-11 items-center gap-2 rounded-2xl bg-brand-600 px-6 text-sm font-semibold text-white shadow-soft hover:bg-brand-700 disabled:opacity-60"
      >
        
        <Upload  size={16} /> {T.save}
      </button>
      <button
        type="button"
        onClick={onClose}
        disabled={saving}
        className="flex h-11 items-center gap-2 rounded-2xl border border-slate-200 px-6 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-60"
      >
        <X size={16} /> {T.cancel}
      </button>
    </>
  );

  return (
    <>
      <FormModal open size="boxed" title={T.modalTitle +' : ' +contract.contractNo} footer={footer} onClose={onClose} closeDisabled={saving}>
        <div className="space-y-6">
          {/* <div className="text-sm text-slate-500">
            <span className="font-semibold text-navy">{contract.supplier}</span>
            {contract.contractNo && contract.contractNo !== '-' && <span> — {contract.contractNo}</span>}
          </div> */}

          <div>
 
            {file ? (
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                <FileText size={17} className="shrink-0 text-brand-600" />
                <a
                  href={fileUrl}
                  download={file.name}
                  className="flex-1 truncate text-blue-600 underline hover:text-blue-700"
                >
                  {file.name}
                </a>
                <button
                  type="button"
                  onClick={removeFile}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3">
                <UploadCloud size={18} className="shrink-0 text-slate-400" />
                <span className="flex-1 text-sm text-slate-500">{T.chooseFile}</span>
                <span className="shrink-0 rounded-2xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-soft hover:bg-brand-700">
                  {T.browse}
                </span>
                <input type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleFileChange} />
              </label>
            )}
            {fileError || errors.file ? (
              <p className="mt-1 text-xs font-medium text-rose-500">{fileError || errors.file}</p>
            ) : (
              <p className="mt-1 text-xs text-slate-400">{T.fileHint}</p>
            )}

            {/* <div className="mt-3">
              <NoteAlert>
                {T.fileNote}
                <span className="mt-0.5 block text-xs text-amber-600/80">{T.fileNoteHint}</span>
              </NoteAlert>
            </div> */}
          </div>

          <div className="space-y-5">
            <SectionTitle>{T.sectionExpiry}</SectionTitle>

            <RadioGroup
              label={T.conditionLabel}
              options={EXPIRY_OPTIONS}
              value={form.expiryChoice}
              onChange={v => {
                // Switching to "no expiry" hides every expiry/renewal field below —
                // also clear whatever was entered so stale values can't resurface if
                // the user switches back, and can't leak into Save (handleConfirmYes
                // already nulls these when !hasExpiry, but an empty form is also just
                // more honest about "nothing decided yet" if they reconsider).
                if (v === 'no_expiry') {
                  setForm(f => ({
                    ...f,
                    expiryChoice: v,
                    contractStartDate: '',
                    contractEndDate: '',
                    autoRenewalChoice: null,
                    autoRenewalYears: '',
                    reminderBeforeExpiryDays: '',
                  }));
                  setErrors({});
                } else {
                  setField('expiryChoice', v);
                }
              }}
              name="expiryChoice"
            />

            {hasExpiry ? (
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <DateField
                    label={T.startDate}
                    hint={T.startDateHint}
                    required
                    value={form.contractStartDate}
                    onChange={e => setField('contractStartDate', e.target.value)}
                    error={errors.contractStartDate}
                  />
                  <DateField
                    label={T.endDate}
                    hint={T.endDateHint}
                    required
                    value={form.contractEndDate}
                    onChange={e => setField('contractEndDate', e.target.value)}
                    error={errors.contractEndDate}
                  />
                </div>

                <RadioGroup
                  label={T.renewal}
                  required
                  options={AUTO_RENEWAL_OPTIONS}
                  value={form.autoRenewalChoice}
                  onChange={v => setField('autoRenewalChoice', v)}
                  name="autoRenewalChoice"
                  error={errors.autoRenewalChoice}
                />

                {form.autoRenewalChoice === 'auto' && (
                  <>
                   <RadioGroup
                      label={T.reminder}
                      required
                      options={REMINDER_OPTIONS}
                      value={form.reminderBeforeExpiryDays}
                      onChange={v => setField('reminderBeforeExpiryDays', v)}
                      name="reminderBeforeExpiryDays"
                      error={errors.reminderBeforeExpiryDays}
                    />
                    
                    <FieldShell label={T.renewalPeriod} hint={T.renewEveryHint} required error={errors.autoRenewalYears}>
                      <div className="flex items-center gap-2">
                        <span className="shrink-0 text-sm text-slate-600">Renew automatically every</span>
                        <input
                          type="number"
                          min="1"
                          value={form.autoRenewalYears}
                          onChange={e => setField('autoRenewalYears', e.target.value)}
                          placeholder="1"
                          className={`h-11 w-20 shrink-0 rounded-2xl border px-3 text-center text-sm text-slate-700 outline-none transition-colors focus:bg-white focus:ring-4 ${
                            errors.autoRenewalYears
                              ? 'border-rose-300 bg-rose-50/40 focus:border-rose-400 focus:ring-rose-500/10'
                              : 'border-slate-200 bg-slate-50 focus:border-brand-500 focus:ring-brand-500/10'
                          }`}
                        />
                        <span className="shrink-0 text-sm text-slate-600">year(s)</span>
                      </div>
                    </FieldShell>

                   
                  </>
                )}
              </div>
            ) : (
              <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                {T.noExpiryInfo}
                <span className="mt-0.5 block text-xs text-slate-400">{T.noExpiryInfoHint}</span>
              </p>
            )}
          </div>
        </div>
      </FormModal>

      <ConfirmModal
        open={confirmOpen}
        title={T.confirmTitle}
        message={T.confirmMessage}
        busy={saving}
        onConfirm={handleConfirmYes}
        onCancel={() => setConfirmOpen(false)}
      />
      <WaitingModal open={saving} />
      <ResultModal open={!!result} variant={result?.variant} message={result?.message} onClose={handleResultClose} />
    </>
  );
}
