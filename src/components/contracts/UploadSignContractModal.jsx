import { useEffect, useMemo, useState } from 'react';
import { Check, CheckCircle2, FileText, Infinity as InfinityIcon, Info, Save, Trash2, UploadCloud, X } from 'lucide-react';
import FormModal from '../ui/FormModal';
import ConfirmModal from '../ui/ConfirmModal';
import WaitingModal from '../ui/WaitingModal';
import ResultModal from '../ui/ResultModal';
import DateField from '../ui/DateField';
import { useAuth } from '../../context/AuthContext';
import { uploadFiles, uploadSignedContract } from '../../lib/api';
import { scrollToField } from '../../lib/formScroll';

// Thai-primary copy in this modal specifically (unlike the rest of the app's
// English-primary convention) — matches the design mockup this was redesigned from
// verbatim, since it was supplied with Thai as the actual UI text, not a translation
// hint.
const T = {
  chooseFile: 'Choose the signed contract PDF',
  browse: 'Browse',
  fileHint: 'ไฟล์สัญญาที่ลงนามแล้ว (PDF)',

 

  step1Title: 'สัญญาเริ่มต้น',
  step1Placeholder: 'เลือกวันที่เริ่มต้น เช่น 1-Jan-26',
  step1Info: 'วันที่สัญญาเริ่มมีผลบังคับใช้',

  step2Title: 'สัญญาสิ้นสุด',
  hasExpiryTitle: '1. มีกำหนดเวลา',
  hasExpiryDesc: 'สัญญาจะสิ้นสุดในวันที่ที่กำหนด',
  endDateLabel: 'วันที่สิ้นสุดสัญญา',
  endDatePlaceholder: 'เลือกวันที่ เช่น 1-Jan-27',
  noExpiryTitle: '2. ไม่มีกำหนดเวลา',
  noExpiryDesc: 'สัญญาจะไม่มีวันสิ้นสุดแน่นอน',
  noExpiryConfirm: 'สัญญาจะไม่มีวันสิ้นสุด',

  step21Title: 'การต่ออายุสัญญา',
  step21Subtitle: '(สำหรับสัญญามีกำหนดเวลา)',
  autoRenewal: 'สัญญาต่ออายุอัตโนมัติ',
  autoRenewalUnit: 'ปี',
  autoRenewalExample: 'เช่น ต่ออายุครั้งละ 1 ปี, ต่ออายุครั้งละ 2 ปี',
  noAutoRenewal: 'สัญญาไม่มีต่ออายุอัตโนมัติ',
  renewalConditionLabel: 'ระบุเงื่อนไขการต่ออายุ (ถ้ามี)',
  renewalConditionPlaceholder: 'เช่น ต่ออายุครั้งละ 1 ปี, ต้องได้รับการอนุมัติจากผู้บริหาร',

  step22Title: 'การแจ้งเตือนก่อนหมดอายุสัญญา',
  step22Subtitle: 'เลือกเวลาที่ต้องการให้ระบบแจ้งเตือนล่วงหน้า',

  footerNote: 'อัปโหลดเอกสารสัญญาที่ลงนามเรียบร้อยแล้ว เพื่อเปลี่ยนสถานะเป็น Signed',
  save: 'Upload',
  cancel: 'Close',
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

// Screen order top to bottom — handleSaveClick walks this to find the first field to
// scroll to, same "first" a person reading down the form would hit.
const FIELD_ORDER = ['file', 'contractStartDate', 'contractEndDate', 'autoRenewalChoice', 'autoRenewalYears', 'reminderBeforeExpiryDays'];

const REMINDER_OPTIONS = [
  { value: 15, label: '15 วัน' },
  { value: 30, label: '30 วัน' },
  { value: 45, label: '45 วัน' },
  { value: 60, label: '60 วัน' },
  { value: 90, label: '90 วัน' },
];

function StepBadge({ children, small }) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full bg-brand-600 font-bold text-white ${
        small ? 'h-6 w-6 text-base' : 'h-8 w-8 text-base'
      }`}
    >
      {children}
    </span>
  );
}

function buildEmptyForm() {
  return {
    expiryChoice: 'has_expiry',
    contractStartDate: '',
    contractEndDate: '',
    autoRenewalChoice: null, // 'auto' | 'none' | null
    autoRenewalYears: '',
    renewalCondition: '',
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

  // Clears that field's own error the moment it changes, so the red required state
  // disappears as soon as the user fixes it instead of waiting for the next Save
  // click to re-run validate() and recompute the whole errors object.
  const setField = (key, value) => {
    setForm(f => ({ ...f, [key]: value }));
    setErrors(prev => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  // Switching to "no expiry" hides every expiry/renewal field below — also clear
  // whatever was entered so stale values can't resurface if the user switches back,
  // and can't leak into Save (handleConfirmYes already nulls these when !hasExpiry,
  // but an empty form is also just more honest about "nothing decided yet").
  const chooseExpiry = choice => {
    if (choice === 'no_expiry') {
      setForm(f => ({
        ...f,
        expiryChoice: choice,
        contractStartDate: f.contractStartDate,
        contractEndDate: '',
        autoRenewalChoice: null,
        autoRenewalYears: '',
        renewalCondition: '',
        reminderBeforeExpiryDays: '',
      }));
      setErrors({});
    } else {
      setField('expiryChoice', choice);
    }
  };

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
  // Save — file.name alone isn't proof, and the file hasn't reached the server yet at
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
    // Step 2 (Contract Start) is required regardless of the Step 3 has-expiry/
    // no-expiry choice — it's its own standalone step, not nested under either.
    if (!form.contractStartDate) next.contractStartDate = T.errRequired;

    if (hasExpiry) {
      if (!form.contractEndDate) next.contractEndDate = T.errRequired;
      if (form.contractStartDate && form.contractEndDate && form.contractEndDate <= form.contractStartDate) {
        next.contractEndDate = T.errEndAfterStart;
      }
      if (!form.autoRenewalChoice) {
        next.autoRenewalChoice = T.errRenewalChoice;
      } else if (form.autoRenewalChoice === 'auto') {
        // Renew Every only matters (and is only shown) once Auto Renewal is chosen —
        // validating it any other time would block Save on a field the user can't
        // even see.
        if (!form.autoRenewalYears) next.autoRenewalYears = T.errRequired;
      }
      // Reminder Before Expiry (Step 3.2) is always visible once the contract has an
      // end date — required regardless of the Auto Renewal choice, unlike Renew Every
      // above.
      if (!form.reminderBeforeExpiryDays) next.reminderBeforeExpiryDays = T.errRequired;
    }

    setErrors(next);
    return next;
  };

  // validate() returns the freshly-computed errors object directly (not just a
  // boolean) so this can find the first invalid field and scroll to it without
  // waiting on the next render's now-stale `errors` state — same reasoning
  // validateAndScrollOnError (New Request form) has for reading formik's own
  // validateForm() result directly instead of its state.
  const handleSaveClick = () => {
    const next = validate();
    if (Object.keys(next).length === 0) {
      setConfirmOpen(true);
      return;
    }
    const firstInvalidField = FIELD_ORDER.find(key => next[key]);
    if (firstInvalidField) scrollToField(firstInvalidField);
  };

  const handleConfirmYes = async () => {
    setSaving(true);
    try {
      const [uploaded] = await uploadFiles([file]);
      await uploadSignedContract(contract.id, {
        fileId: uploaded.id,
        hasExpiry,
        // Contract Start is required (and collected) regardless of hasExpiry — unlike
        // the rest of these fields, it's never nulled out based on that choice.
        contractStartDate: form.contractStartDate,
        contractEndDate: hasExpiry ? form.contractEndDate : null,
        autoRenewal: hasExpiry ? form.autoRenewalChoice === 'auto' : null,
        autoRenewalYears: hasExpiry && form.autoRenewalChoice === 'auto' ? Number(form.autoRenewalYears) : null,
        renewalCondition: hasExpiry ? form.renewalCondition : null,
        // Required (and collected) whenever hasExpiry, regardless of the Auto Renewal
        // choice — unlike autoRenewalYears above, which only applies to 'auto'.
        reminderBeforeExpiryDays: hasExpiry ? Number(form.reminderBeforeExpiryDays) : null,
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
    <div className="flex w-full flex-wrap items-center justify-end gap-3">
      {/* <div className="flex min-w-0 items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-base text-slate-400">
        <Info size={14} className="shrink-0" />
        <span>{T.footerNote}</span>
      </div> */}
      <div className="flex shrink-0 gap-3">
        <button
          type="button"
          onClick={handleSaveClick}
          disabled={saving}
          className="flex h-11 items-center gap-2 rounded-2xl bg-brand-600 px-6 text-base font-semibold text-white shadow-soft hover:bg-brand-700 disabled:opacity-60"
        >
          <Save size={16} /> {T.save}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="flex h-11 items-center gap-2 rounded-2xl border border-slate-200 px-6 text-base font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-60"
        >
          <X size={16} /> {T.cancel}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <FormModal
        open
        centerTitle
        title={`Upload Signed Contract${contract.contractNo && contract.contractNo !== '-' ? ` - ${contract.contractNo}` : ''}`}
        footer={footer}
        onClose={onClose}
        closeDisabled={saving}
      >
        <div className="space-y-6">
          {/* Step 1 — Signed contract file, required by the backend. Not part of the
              supplied mockup (which started at what's now Step 2), given its own
              numbered step here so the whole flow reads as one continuous sequence. */}
          <div data-field="file" className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center gap-3">
              <StepBadge>1</StepBadge>
              <h3 className="text-base font-bold text-navy">{T.fileHint}</h3>
            </div>
            <div className="w-1/2 min-w-0">
              {file ? (
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base">
                  <FileText size={17} className="shrink-0 text-brand-600" />
                  <a href={fileUrl} download={file.name} className="flex-1 truncate text-blue-600 underline hover:text-blue-700">
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
                  <span className="flex-1 text-base text-slate-500">{T.chooseFile}</span>
                  <span className="shrink-0 rounded-2xl bg-brand-600 px-4 py-2 text-base font-semibold text-white shadow-soft hover:bg-brand-700">
                    {T.browse}
                  </span>
                  <input type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleFileChange} />
                </label>
              )}
              {(fileError || errors.file) && <p className="mt-1 text-base font-medium text-rose-500">{fileError || errors.file}</p>}
            </div>
          </div>

          {/* Step 2 — Contract Start (required regardless of Step 3's choice) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center gap-3">
              <StepBadge>2</StepBadge>
              <h3 className="text-base font-bold text-navy">
                {T.step1Title}
                <span className="text-rose-500"> *</span>
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1/2 min-w-0">
                <DateField
                  name="contractStartDate"
                  required
                  value={form.contractStartDate}
                  onChange={e => setField('contractStartDate', e.target.value)}
                  error={errors.contractStartDate}
                />
              </div>
              <span
                title={T.step1Info}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <Info size={17} />
              </span>
            </div>
          </div>

          {/* Step 3 — Contract End: has-expiry vs no-expiry, as two selectable cards */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-3">
              <StepBadge>3</StepBadge>
              <h3 className="text-base font-bold text-navy">{T.step2Title}</h3>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div
                role="button"
                tabIndex={0}
                onClick={() => chooseExpiry('has_expiry')}
                onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && chooseExpiry('has_expiry')}
                className={`cursor-pointer rounded-2xl border-2 p-4 text-left transition-colors ${
                  hasExpiry ? 'border-brand-500 bg-brand-50/40' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${
                      hasExpiry ? 'border-brand-600' : 'border-slate-300'
                    }`}
                  >
                    {hasExpiry && <span className="h-2.5 w-2.5 rounded-full bg-brand-600" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-navy">{T.hasExpiryTitle}</p>
                    <p className="mt-0.5 text-base text-slate-400">{T.hasExpiryDesc}</p>
                  </div>
                </div>
                {hasExpiry && (
                  <div className="mt-4" onClick={e => e.stopPropagation()}>
                    <DateField
                      name="contractEndDate"
                      label={T.endDateLabel}
                      required
                      value={form.contractEndDate}
                      onChange={e => setField('contractEndDate', e.target.value)}
                      error={errors.contractEndDate}
                    />
                  </div>
                )}
              </div>

              <div
                role="button"
                tabIndex={0}
                onClick={() => chooseExpiry('no_expiry')}
                onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && chooseExpiry('no_expiry')}
                className={`cursor-pointer rounded-2xl border-2 p-4 text-left transition-colors ${
                  !hasExpiry ? 'border-brand-500 bg-brand-50/40' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${
                      !hasExpiry ? 'border-brand-600' : 'border-slate-300'
                    }`}
                  >
                    {!hasExpiry && <span className="h-2.5 w-2.5 rounded-full bg-brand-600" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-navy">{T.noExpiryTitle}</p>
                    <p className="mt-0.5 text-base text-slate-400">{T.noExpiryDesc}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-col items-center gap-3">
                  <InfinityIcon size={30} className="text-brand-400" />
                  {!hasExpiry && (
                    <div className="flex items-start gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-base text-emerald-700">
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                      <span>{T.noExpiryConfirm}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {hasExpiry && (
              <div className="mt-5 border-t border-slate-100 pt-5">
                {/* Step 2.1 — Renewal, only relevant while the contract has an end date */}
                <div className="mb-2 flex items-center gap-2">
                  <StepBadge small>3.1</StepBadge>
                  <h4 className="text-base font-bold text-navy">
                    {T.step21Title} <span className="font-normal text-slate-400">{T.step21Subtitle}</span>
                  </h4>
                </div>

                <div data-field="autoRenewalChoice" className="ml-8 space-y-3">
                  <div data-field="autoRenewalYears">
                    <label className="flex flex-wrap items-center gap-2 text-base text-slate-700">
                      <input
                        type="radio"
                        name="autoRenewalChoice"
                        checked={form.autoRenewalChoice === 'auto'}
                        onChange={() => setField('autoRenewalChoice', 'auto')}
                        className="h-4 w-4 border-slate-300 text-brand-600 focus:ring-brand-500"
                      />
                      <span>{T.autoRenewal}</span>
                      <input
                        type="number"
                        min="1"
                        value={form.autoRenewalYears}
                        onChange={e => setField('autoRenewalYears', e.target.value)}
                        className={`h-9 w-16 shrink-0 rounded-xl border px-2 text-center text-base outline-none transition-colors focus:bg-white focus:ring-4 ${
                          errors.autoRenewalYears
                            ? 'border-rose-300 bg-rose-50/40 focus:border-rose-400 focus:ring-rose-500/10'
                            : 'border-slate-200 bg-slate-50 focus:border-brand-500 focus:ring-brand-500/10'
                        }`}
                      />
                      <span className="shrink-0 text-slate-500">{T.autoRenewalUnit}</span>
                      <span className="text-base text-slate-400">{T.autoRenewalExample}</span>
                    </label>
                    {errors.autoRenewalYears && <p className="ml-6 mt-1 text-base font-medium text-rose-500">{errors.autoRenewalYears}</p>}
                  </div>

                  <label className="flex items-center gap-2 text-base text-slate-700">
                    <input
                      type="radio"
                      name="autoRenewalChoice"
                      checked={form.autoRenewalChoice === 'none'}
                      onChange={() => setField('autoRenewalChoice', 'none')}
                      className="h-4 w-4 border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span>{T.noAutoRenewal}</span>
                  </label>
                  {errors.autoRenewalChoice && <p className="text-base font-medium text-rose-500">{errors.autoRenewalChoice}</p>}

                  <div className="pt-1">
                    <label className="mb-2 block text-base font-semibold tracking-wide text-violet-600">{T.renewalConditionLabel}</label>
                    <textarea
                      rows={2}
                      value={form.renewalCondition}
                      onChange={e => setField('renewalCondition', e.target.value)}
                      placeholder={T.renewalConditionPlaceholder}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700 outline-none transition-colors focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10"
                    />
                  </div>
                </div>

                {/* Step 2.2 — Reminder before expiry: single-select, styled as checkboxes
                    per the supplied design (still one value under the hood, same as the
                    radio group it replaces — see the DB column comment). */}
                <div data-field="reminderBeforeExpiryDays" className="mt-5">
                  <div className="mb-1 flex items-center gap-2">
                    <StepBadge small>3.2</StepBadge>
                    <h4 className="text-base font-bold text-navy">
                      {T.step22Title}
                      <span className="text-rose-500"> *</span>
                    </h4>
                  </div>
                  <p className="ml-8 mb-3 text-base text-slate-400">{T.step22Subtitle}</p>
                  <div className="ml-8 flex flex-wrap gap-x-6 gap-y-3">
                    {REMINDER_OPTIONS.map(opt => {
                      const checked = Number(form.reminderBeforeExpiryDays) === opt.value;
                      return (
                        <label key={opt.value} className="flex cursor-pointer items-center gap-2 text-base text-slate-700">
                          <span
                            onClick={() => setField('reminderBeforeExpiryDays', opt.value)}
                            className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 ${
                              checked ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white'
                            }`}
                          >
                            {checked && <Check size={13} strokeWidth={3} />}
                          </span>
                          <span onClick={() => setField('reminderBeforeExpiryDays', opt.value)}>{opt.label}</span>
                        </label>
                      );
                    })}
                  </div>
                  {errors.reminderBeforeExpiryDays && (
                    <p className="ml-8 mt-2 text-base font-medium text-rose-500">{errors.reminderBeforeExpiryDays}</p>
                  )}
                </div>
              </div>
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
