import { useEffect, useState } from 'react';
import { X, Download, AlertTriangle } from 'lucide-react';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';
import { fetchUploadBlob, downloadUploadFile } from '../../lib/api';

// Full-screen PDF preview — same "true full-screen takeover" shape as
// UserManualModal.jsx (fixed inset-0, no padding/max-width/rounded corners), so a
// document opens to read in place instead of forcing a save-to-disk round trip just
// to see what's in it. Fetches the file as an authenticated blob (same
// apiClient-with-Bearer-token path as downloadUploadFile — a plain <iframe
// src="/api/uploads/:id/download"> can't carry that header) and hands the resulting
// object URL to an <iframe>, which every modern browser renders as a native PDF
// viewer (scroll, zoom, its own built-in print/download controls) with no extra
// dependency.
export default function PdfViewerModal({ open, onClose, title, fileId, fileName }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [error, setError] = useState(false);
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open || !fileId) return undefined;
    let cancelled = false;
    let url = null;
    setError(false);
    setBlobUrl(null);
    fetchUploadBlob(fileId)
      .then(({ blob }) => {
        if (cancelled) return;
        // The server's /uploads/:id/download has no extension to mime-sniff on disk
        // (uploads are stored under a bare UUID — see upload.js), so without an explicit
        // Content-Type it falls back to application/octet-stream; a Blob of that type
        // loaded into an <iframe> triggers a download instead of rendering inline. Force
        // it to application/pdf here regardless of what the server actually sent — this
        // modal is only ever used for PDFs, so re-typing the raw bytes is always correct.
        const pdfBlob = blob.type === 'application/pdf' ? blob : new Blob([blob], { type: 'application/pdf' });
        url = URL.createObjectURL(pdfBlob);
        setBlobUrl(url);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [open, fileId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-white">
      <div className="relative flex shrink-0 items-center justify-center border-b border-slate-200 px-6 py-4">
        <h2 className="text-lg font-bold text-navy">{title}</h2>

        <div className="absolute right-6 top-1/2 flex -translate-y-1/2 items-center gap-2">
          
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 bg-slate-100">
        {error ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-500">
            <AlertTriangle size={32} className="text-rose-400" />
            <p className="text-base font-semibold">ไม่สามารถเปิดไฟล์นี้ได้ — ไฟล์อาจถูกลบหรือไม่พบในระบบ</p>
          </div>
        ) : blobUrl ? (
          <iframe src={blobUrl} title={title} className="h-full w-full border-0" />
        ) : (
          <div className="flex h-full items-center justify-center text-base font-semibold text-slate-400">กำลังโหลด...</div>
        )}
      </div>
    </div>
  );
}
