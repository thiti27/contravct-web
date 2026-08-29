import { useState } from 'react';
import { FileText, Loader2, MessageSquare, Trash2, UploadCloud } from 'lucide-react';
import TextAreaField from '../ui/TextAreaField';
import DateField from '../ui/DateField';
import { uploadFiles, deleteUpload, downloadUploadFile } from '../../lib/api';

// Short action word for the "___ Information" section title — distinct from
// RemarkBadge's REMARK_LABELS (e.g. "Renew Contract"), which is for modal titles/
// badges, not mid-sentence use like "___ Information".
const ACTION_LABELS = { renew: 'Renew', amend: 'Amend', claim: 'Claim Note', terminate: 'Terminate', cancel: 'Cancel' };

const SECTION_SUBTITLE = {
  renew: 'Purpose and the requested renewal period.',
  amend: 'Background, detail, effective date, and supporting attachments.',
  terminate: 'Background, detail, effective date, and supporting attachments.',
  claim: 'Background, detail, and supporting attachments.',
  cancel: 'Reason for cancellation.',
};

// The shared `actionBackground` column's on-screen label — what it actually captures
// differs by remark (see schema.sql's comment above action_background/action_detail).
const BACKGROUND_LABEL = {
  renew: 'Purpose',
  amend: 'Brief Description & Background/Reason',
  terminate: 'Brief Description & Background/Reason',
  claim: 'Brief Description & Background/Reason',
};

// The shared `actionDetail` column's on-screen label — Terminate reads "Terminate
// Detail" rather than "Amended Detail" per spec, even though it's the exact same
// column/storage as Amend's, since renaming just the label (not the data shape) is
// enough to fit the business language without introducing a redundant column.
const DETAIL_LABEL = {
  amend: 'Amended Detail',
  terminate: 'Terminate Detail',
  claim: 'Claim Detail',
};

const HAS_EFFECTIVE_DATE = { amend: true, terminate: true };
const HAS_ATTACHMENTS = { amend: true, terminate: true, claim: true };

// Shown for a Renew/Amend/Claim Note/Terminate/Cancel request — both when first
// creating one (LinkedRequestModal) and when editing one later (EditRequestModal).
// Bound straight to formik the same way every other section is, so Save Draft/Send
// Request/Save Change persist and reload it like any other field. Each remark shows a
// different field set (see the label maps above) since Renew/Cancel have nothing in
// common with Amend/Terminate/Claim Note's shared Background+Detail+attachments shape.
// Files upload immediately on selection (same pattern as DocumentsSection) rather than
// staying local until submit — actionFiles only ever holds {id, fileName, extension}
// records, never raw browser File objects.
export default function ActionInfoSection({ formik, remark, readOnly = false }) {
  const { values, errors, touched, handleChange, handleBlur, setFieldValue } = formik;
  const actionLabel = ACTION_LABELS[remark] || 'Request';
  const err = key => (touched[key] ? errors[key] : undefined);

  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState(null);

  const addFiles = async fileList => {
    setUploading(true);
    setFileError(null);
    try {
      const records = await uploadFiles(fileList);
      setFieldValue('actionFiles', [...(values.actionFiles || []), ...records]);
    } catch {
      setFileError('อัปโหลดไฟล์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = async fileId => {
    setFileError(null);
    try {
      await deleteUpload(fileId);
      setFieldValue(
        'actionFiles',
        (values.actionFiles || []).filter(f => f.id !== fileId)
      );
    } catch {
      setFileError('ลบไฟล์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    }
  };

  const downloadFile = async file => {
    setFileError(null);
    try {
      await downloadUploadFile(file.id, `${file.fileName}${file.extension}`);
    } catch {
      setFileError('ดาวน์โหลดไฟล์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    }
  };

  return (
    <section>
      <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-6 py-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-brand-600 shadow-sm">
          <MessageSquare size={19} />
        </span>
        <div>
          <div className="font-bold text-navy">{actionLabel} Information</div>
          <div className="text-sm text-slate-500">{SECTION_SUBTITLE[remark] || 'Background, detail, and supporting attachments.'}</div>
        </div>
      </div>

      <div className="space-y-5 p-6">
        {remark === 'cancel' ? (
          // Cancel has no Background/Detail/attachments at all — just a single Reason
          // textarea (see cancel_reason in schema.sql).
          <TextAreaField
            label="Reason"
            required
            name="cancelReason"
            value={values.cancelReason}
            onChange={handleChange}
            onBlur={handleBlur}
            error={err('cancelReason')}
            rows={5}
            className="!border-brand-200 !bg-brand-50/40"
            disabled={readOnly}
          />
        ) : remark === 'renew' ? (
          <>
            <TextAreaField
              label={BACKGROUND_LABEL.renew}
              required
              name="actionBackground"
              value={values.actionBackground}
              onChange={handleChange}
              onBlur={handleBlur}
              error={err('actionBackground')}
              rows={3}
              className="!border-brand-200 !bg-brand-50/40"
              disabled={readOnly}
            />

            <div>
              <div className="mb-2 text-sm font-semibold text-navy">Original Period</div>
              {/* Read-only, always disabled — pulled from the referenced contract
                  (linked_master_id) server-side, never editable here. */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <DateField
                  label="Contract Start Date"
                  name="originalContractStartDate"
                  value={values.originalContractStartDate}
                  onChange={handleChange}
                  disabled
                />
                <DateField
                  label="Contract End Date"
                  name="originalContractEndDate"
                  value={values.originalContractEndDate}
                  onChange={handleChange}
                  disabled
                />
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm font-semibold text-navy">New Period</div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <DateField
                  label="Contract Start Date"
                  required
                  name="newContractStartDate"
                  value={values.newContractStartDate}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={err('newContractStartDate')}
                  disabled={readOnly}
                />
                <DateField
                  label="Contract End Date"
                  required
                  name="newContractEndDate"
                  value={values.newContractEndDate}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={err('newContractEndDate')}
                  disabled={readOnly}
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <TextAreaField
                label={BACKGROUND_LABEL[remark] || 'Background'}
                required
                name="actionBackground"
                value={values.actionBackground}
                onChange={handleChange}
                onBlur={handleBlur}
                error={err('actionBackground')}
                className="!border-brand-200 !bg-brand-50/40"
                disabled={readOnly}
              />
              <TextAreaField
                label={DETAIL_LABEL[remark] || 'Detail'}
                required
                name="actionDetail"
                value={values.actionDetail}
                onChange={handleChange}
                onBlur={handleBlur}
                error={err('actionDetail')}
                className="!border-brand-200 !bg-brand-50/40"
                disabled={readOnly}
              />
            </div>

            {HAS_EFFECTIVE_DATE[remark] && (
              <DateField
                label="Effective Date"
                required
                name="actionEffectiveDate"
                value={values.actionEffectiveDate}
                onChange={handleChange}
                onBlur={handleBlur}
                error={err('actionEffectiveDate')}
                disabled={readOnly}
              />
            )}

            {HAS_ATTACHMENTS[remark] && (
              <div className="rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-navy">Attach file</div>
                    <div className="text-xs text-slate-500">Upload supporting files for this {actionLabel}.</div>
                  </div>
                  {!readOnly && (
                    <label
                      className={`flex shrink-0 items-center gap-2 rounded-xl border border-brand-200 bg-white px-3 py-2 text-xs font-semibold text-brand-600 ${
                        uploading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-brand-50'
                      }`}
                    >
                      {uploading ? <Loader2 size={15} className="animate-spin" /> : <UploadCloud size={15} />}
                      {uploading ? 'Uploading...' : 'Attach file'}
                      <input
                        type="file"
                        multiple
                        disabled={uploading}
                        className="hidden"
                        onChange={e => {
                          if (e.target.files.length) addFiles(e.target.files);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  )}
                </div>

                {fileError && <p className="mt-2 text-xs font-medium text-rose-500">{fileError}</p>}

                <div className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                  {(values.actionFiles || []).length === 0 ? (
                    <p className="text-sm text-slate-400">No files attached.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {values.actionFiles.map(file => (
                        <li key={file.id} className="flex items-center gap-2 text-sm">
                          <FileText size={15} className="shrink-0 text-brand-600" />
                          <button
                            type="button"
                            onClick={() => downloadFile(file)}
                            className="flex-1 truncate text-left text-blue-600 underline hover:text-blue-700"
                          >
                            {file.fileName}
                            {file.extension}
                          </button>
                          {!readOnly && (
                            <button
                              type="button"
                              onClick={() => removeFile(file.id)}
                              className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
