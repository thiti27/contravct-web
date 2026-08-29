import { useState } from 'react';
import { Paperclip, UploadCloud, Trash2, Loader2 } from 'lucide-react';
import { DOCUMENT_TYPES } from '../constants';
import { uploadFiles, deleteUpload, downloadUploadFile } from '../../../lib/api';

// Drawing/Plan and Specification are shared with non-requester collaborators (e.g. an
// engineer opening someone else's request via All Job): they can still add new files,
// but can't download/delete ones the requester already attached. Every other document
// type keeps the plain readOnly-only behavior.
const OWNER_RESTRICTED_KEYS = ['drawing', 'specification'];

export default function DocumentsSection({ formik, readOnly = false, isOwner = true, strictRestriction = false }) {
  const { values, setFieldValue } = formik;
  const [uploadingKeys, setUploadingKeys] = useState({});
  const [uploadErrors, setUploadErrors] = useState({});

  const addFiles = async (key, fileList) => {
    setUploadingKeys(u => ({ ...u, [key]: true }));
    setUploadErrors(e => ({ ...e, [key]: null }));
    try {
      const records = await uploadFiles(fileList);
      setFieldValue(`documents.${key}.files`, [...values.documents[key].files, ...records]);
    } catch {
      setUploadErrors(e => ({ ...e, [key]: 'อัปโหลดไฟล์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง' }));
    } finally {
      setUploadingKeys(u => ({ ...u, [key]: false }));
    }
  };

  const removeFile = async (key, fileId) => {
    try {
      await deleteUpload(fileId);
      setFieldValue(
        `documents.${key}.files`,
        values.documents[key].files.filter(f => f.id !== fileId)
      );
    } catch {
      setUploadErrors(e => ({ ...e, [key]: 'ลบไฟล์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง' }));
    }
  };

  const downloadFile = async (key, file) => {
    setUploadErrors(e => ({ ...e, [key]: null }));
    try {
      await downloadUploadFile(file.id, `${file.fileName}${file.extension}`);
    } catch {
      setUploadErrors(e => ({ ...e, [key]: 'ดาวน์โหลดไฟล์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง' }));
    }
  };

  return (
    <section>
      <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-6 py-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-brand-600 shadow-sm">
          <Paperclip size={19} />
        </span>
        <div>
          <div className="font-bold text-navy">Related Contract Document</div>
          <div className="text-sm text-slate-500">เอกสารประกอบการพิจารณา — ติ๊กถูกเพื่อแนบไฟล์</div>
        </div>
      </div>

      <div className="space-y-3 p-6">
        {DOCUMENT_TYPES.map(doc => {
          const entry = values.documents[doc.key];
          const uploading = !!uploadingKeys[doc.key];
          const isRestrictedKey = OWNER_RESTRICTED_KEYS.includes(doc.key);
          // Two independent restriction levels, never both relevant to the same caller
          // (see RequestFormFields.jsx): strictRestriction (All Job, viewer fails the
          // creator/approver/`view` permission check) masks the filename entirely and
          // blocks attach/download/delete outright. Otherwise, plain !isOwner (any other
          // page's non-owner) can still see the real filename and upload new files, just
          // not download/delete what's already there.
          const restrictedFiles = isRestrictedKey && (strictRestriction || !isOwner);
          const blockAttach = isRestrictedKey && strictRestriction;
          return (
            <div key={doc.key} className={`rounded-2xl border p-4 ${entry.checked ? 'border-brand-100 bg-brand-50/30' : 'border-slate-200 bg-slate-50/40'}`}>
              <label className={`flex items-center gap-2 text-sm font-semibold text-slate-600 ${readOnly ? 'opacity-60' : ''}`}>
                <input
                  type="checkbox"
                  checked={entry.checked}
                  disabled={readOnly}
                  onChange={e => setFieldValue(`documents.${doc.key}.checked`, e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 disabled:cursor-not-allowed"
                />
                {doc.label}
              </label>

              {entry.checked && (
                <div className="mt-3 space-y-3 pl-6">
                  {!readOnly && !blockAttach && (
                    <div className="flex min-w-[220px] max-w-md items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-3 py-2.5">
                      {uploading ? (
                        <Loader2 size={17} className="shrink-0 animate-spin text-brand-500" />
                      ) : (
                        <UploadCloud size={17} className="shrink-0 text-slate-400" />
                      )}
                      <span className="flex-1 text-xs text-slate-500">{uploading ? 'กำลังอัปโหลด...' : 'แนบไฟล์ได้หลายไฟล์'}</span>
                      <label
                        className={`shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 ${
                          uploading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-slate-100'
                        }`}
                      >
                        เลือกไฟล์
                        <input
                          type="file"
                          multiple
                          disabled={uploading}
                          className="hidden"
                          onChange={e => {
                            if (e.target.files.length) addFiles(doc.key, e.target.files);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </div>
                  )}

                  {uploadErrors[doc.key] && <p className="text-xs font-medium text-rose-500">{uploadErrors[doc.key]}</p>}

                  {entry.files.length > 0 && (
                    <ul className="space-y-1.5">
                      {entry.files.map(file => (
                        <li key={file.id} className="flex items-center gap-2 text-sm">
                          {restrictedFiles ? (
                            // strictRestriction: real filename never reaches the DOM at
                            // all, not just visually hidden — "xxxxx" is the only text
                            // rendered. Plain !isOwner (other pages): filename still
                            // shows, just not clickable/downloadable (existing behavior).
                            <span className={`select-none ${strictRestriction ? 'text-slate-400' : 'text-slate-600'}`}>
                              {strictRestriction ? 'xxxxx' : `${file.fileName}${file.extension}`}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => downloadFile(doc.key, file)}
                              className="text-left text-brand-600 underline underline-offset-2 hover:text-brand-700"
                            >
                              {file.fileName}
                              {file.extension}
                            </button>
                          )}
                          {!readOnly && !restrictedFiles && (
                            <button
                              type="button"
                              onClick={() => removeFile(doc.key, file.id)}
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
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
