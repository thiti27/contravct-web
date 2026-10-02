import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { FileText, ShieldAlert, Download, Loader2, Lock } from 'lucide-react';
import { fetchContractDocumentsInfo } from '../../lib/api';
import { downloadContractDocuments } from '../../lib/downloadContractDocuments';
import { PATHS } from '../../routes/paths';

// Public page behind the "Download Contract Documents" link in contract emails (see
// contract-server's approvedContract.template.js) — reachable by a logged-out
// visitor, unlike every other page in this app. GET /api/contract-documents/:contractNo
// (contractDocumentsController.js) is the one endpoint that answers for that: it never
// 401s/403s itself, it comes back with {authorized, requiresLogin} so this page can
// render the right state instead of a blank error screen. The actual download reuses
// downloadContractDocuments (shared with ContractListPage's row-level button) — the
// backend routes it calls (GET /requests/:id, GET /uploads/:id/download) are
// optionally authenticated too, gated by that same contract's own confidentiality
// rather than by a login wall, so this works for an anonymous visitor exactly the same
// way it already works for a logged-in one on every other page.
export default function ContractDocumentsPage() {
  const { contractNo } = useParams();
  const location = useLocation();
  const [info, setInfo] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setInfo(null);
    setLoadError(false);
    fetchContractDocumentsInfo(contractNo)
      .then(data => {
        if (!cancelled) setInfo(data);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [contractNo]);

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadError('');
    try {
      await downloadContractDocuments(info);
    } catch {
      setDownloadError('Download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const Shell = ({ children }) => (
    <div className="flex min-h-screen items-center justify-center bg-sky-50 px-4">
      <div className="w-full max-w-md rounded-xl2 border border-slate-200 bg-white p-8 text-center shadow-card">{children}</div>
    </div>
  );

  if (loadError) {
    return (
      <Shell>
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-rose-50 text-rose-500">
          <ShieldAlert size={32} />
        </div>
        <h1 className="text-xl font-bold text-navy">Contract Not Found</h1>
        <p className="mt-2 text-base text-slate-500">No contract matches "{contractNo}". Please check the link and try again.</p>
        <Link to={PATHS.HOME} className="mt-6 inline-flex h-11 items-center rounded-2xl bg-brand-600 px-6 text-base font-semibold text-white shadow-soft hover:bg-brand-700">
          Back to Home
        </Link>
      </Shell>
    );
  }

  if (!info) {
    return (
      <Shell>
        <Loader2 size={28} className="mx-auto animate-spin text-brand-500" />
        <p className="mt-3 text-base text-slate-500">Loading contract documents…</p>
      </Shell>
    );
  }

  // Sends the visitor to Login, then straight back here on success — same
  // `state={{ from: location }}` handoff RequireAuth/LoginPage already use for every
  // other protected page in this app.
  if (info.requiresLogin) {
    return <Navigate to={PATHS.LOGIN} replace state={{ from: location }} />;
  }

  if (!info.authorized) {
    return (
      <Shell>
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-rose-50 text-rose-500">
          <Lock size={32} />
        </div>
        <h1 className="text-xl font-bold text-navy">Access Denied</h1>
        <p className="mt-2 text-base text-slate-500">You do not have permission to access this document.</p>
        <Link to={PATHS.HOME} className="mt-6 inline-flex h-11 items-center rounded-2xl bg-brand-600 px-6 text-base font-semibold text-white shadow-soft hover:bg-brand-700">
          Back to Home
        </Link>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-brand-50 text-brand-600">
        <FileText size={32} />
      </div>
      <h1 className="text-xl font-bold text-navy">Contract Documents - {info.contractNo}</h1>

      <div className="mt-6 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left text-base">
        <div className="flex items-center justify-between gap-3">
          <span className="font-semibold text-slate-500">Contract No.</span>
          <span className="font-medium text-navy">{info.contractNo}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="font-semibold text-slate-500">Document Type</span>
          <span className="font-medium text-navy">{info.type || '-'}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="font-semibold text-slate-500">Confidentiality Level</span>
          <span className={`font-medium ${info.confidentiality ? 'text-rose-600' : 'text-navy'}`}>
            {info.confidentiality ? 'HIGH CONFIDENTIAL' : 'Normal'}
          </span>
        </div>
      </div>

      {downloadError && <p className="mt-4 text-base font-medium text-rose-500">{downloadError}</p>}

      <button
        type="button"
        onClick={handleDownload}
        disabled={downloading}
        className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 text-base font-semibold text-white shadow-soft hover:bg-brand-700 disabled:opacity-60"
      >
        {downloading ? <Loader2 size={17} className="animate-spin" /> : <Download size={17} />}
        {downloading ? 'Preparing download…' : 'Download Contract Documents'}
      </button>
    </Shell>
  );
}
