import { useState } from 'react';
import { FileText, Save, Trash2, UploadCloud, X } from 'lucide-react';
import FormModal from '../ui/FormModal';
import ConfirmModal from '../ui/ConfirmModal';
import WaitingModal from '../ui/WaitingModal';
import ResultModal from '../ui/ResultModal';
import RadioGroup from '../ui/RadioGroup';
import DateField from '../ui/DateField';
import FormSelect from '../ui/FormSelect';
import TextField from '../ui/TextField';
import NoteAlert from '../ui/NoteAlert';
import { useAuth } from '../../context/AuthContext';
import { uploadFiles, uploadSignedContract } from '../../lib/api';

// English first, Thai in parentheses after every label/placeholder/note — per the
// bilingual UI convention for this modal (users skim the English, read the Thai
// when they need to double-check).
const T = {
  signedContractFile: 'Signed Contract File (ไฟล์สัญญาที่ลงนามแล้ว)',
  chooseFile: 'Choose the signed contract PDF ',
  browse: 'Browse (เลือกไฟล์)',
  contractType: 'Contract Type (ประเภทสัญญา)',
  hasExpiry: 'Contract has an expiry date (สัญญามีวันหมดอายุ)',
  noExpiry: 'Contract has no expiry date (สัญญาไม่มีวันหมดอายุ)',
  startDate: 'Contract Start Date (วันที่เริ่มมีผลของสัญญา)',
  endDate: 'Contract End Date (วันสิ้นสุดสัญญา)',
  reminder: 'Reminder Before Expiry (แจ้งเตือนก่อนสัญญาหมดอายุ)',
  selectReminder: 'Select reminder ',
  renewal: 'Renewal (การต่ออายุสัญญา)',
  autoRenewal: 'Auto Renewal (ต่ออายุอัตโนมัติ)',
  noAutoRenewal: 'No Auto Renewal (ไม่มีการต่ออายุอัตโนมัติ)',
  renewEvery: 'Renew automatically every ____ year(s) (ต่ออายุอัตโนมัติทุก ____ ปี)',
  noExpiryInfo: 'This contract has no expiry date. (สัญญานี้ไม่มีวันหมดอายุ)',
  modalTitle: 'Upload Sign Contract  ',
  save: 'Save ',
  cancel: 'Cancel  ',
  confirmTitle: 'Confirm Save ',
  confirmMessage: 'Are you sure you want to save this signed contract?  ',
  successMessage: 'Signed contract has been uploaded successfully. ',
  errorMessage: 'Failed to upload the signed contract. Please try again.  ',
  errFileRequired: 'Please select the signed contract PDF file.  ',
  errOneFileOnly: 'You can upload only one file. (สามารถอัปโหลดได้เพียง 1 ไฟล์เท่านั้น)',
  errPdfOnly: 'Only PDF (.pdf) files are supported. (รองรับเฉพาะไฟล์ PDF (.pdf) เท่านั้น)',
  errRequired: 'This field is required.  ',
  errEndAfterStart: 'Contract End Date must be after Contract Start Date. (วันสิ้นสุดสัญญาต้องอยู่หลังวันที่เริ่มมีผลของสัญญา)',
  errRenewalChoice: 'Select either Auto Renewal or No Auto Renewal. (กรุณาเลือกต่ออายุอัตโนมัติ หรือ ไม่มีการต่ออายุอัตโนมัติ)',
  yearsPlaceholder: 'e.g. 1 (เช่น 1)',
};

const EXPIRY_OPTIONS = [
  { value: 'has_expiry', label: T.hasExpiry },
  { value: 'no_expiry', label: T.noExpiry },
];

const AUTO_RENEWAL_OPTIONS = [
  { value: 'auto', label: T.autoRenewal },
  { value: 'none', label: T.noAutoRenewal },
];

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
        <Save size={16} /> {T.save}
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
      <FormModal open title={T.modalTitle} footer={footer} onClose={onClose} closeDisabled={saving}>
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="text-sm text-slate-500">
            <span className="font-semibold text-navy">{contract.supplier}</span>
            {contract.contractNo && contract.contractNo !== '-' && <span> — {contract.contractNo}</span>}
          </div>

          <div>
            <span className="mb-2 block text-xs font-semibold tracking-wide text-slate-500">
              {T.signedContractFile} <span className="text-rose-500">*</span>
            </span>
            {file ? (
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                <FileText size={17} className="shrink-0 text-brand-600" />
                <span className="flex-1 truncate text-slate-700">{file.name}</span>
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
                <span className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100">
                  {T.browse}
                </span>
                <input type="file" accept=".pdf,application/pdf" multiple className="hidden" onChange={handleFileChange} />
              </label>
            )}
            {(fileError || errors.file) && <p className="mt-1 text-xs font-medium text-rose-500">{fileError || errors.file}</p>}

            <div className="mt-3">
              <NoteAlert>
                Note: Upload only one signed contract file in PDF (.pdf) format. The file must contain all signed pages in a single document.
                <br />
                (หมายเหตุ: สามารถอัปโหลดได้เพียง 1 ไฟล์ในรูปแบบ PDF (.pdf) เท่านั้น
                และไฟล์ต้องรวมหน้าสัญญาที่ลงนามครบถ้วนทั้งหมดไว้ในไฟล์เดียว)
              </NoteAlert>
            </div>
          </div>

          <RadioGroup
            label={T.contractType}
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
                  required
                  value={form.contractStartDate}
                  onChange={e => setField('contractStartDate', e.target.value)}
                  error={errors.contractStartDate}
                />
                <DateField
                  label={T.endDate}
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
                  <TextField
                    label={T.renewEvery}
                    required
                    type="number"
                    min="1"
                    value={form.autoRenewalYears}
                    onChange={e => setField('autoRenewalYears', e.target.value)}
                    error={errors.autoRenewalYears}
                    placeholder={T.yearsPlaceholder}
                  />

                  <FormSelect
                    label={T.reminder}
                    required
                    options={REMINDER_OPTIONS}
                    value={form.reminderBeforeExpiryDays}
                    onChange={v => setField('reminderBeforeExpiryDays', v)}
                    error={errors.reminderBeforeExpiryDays}
                    placeholder={T.selectReminder}
                  />
                </>
              )}
            </div>
          ) : (
            <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">{T.noExpiryInfo}</p>
          )}
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
