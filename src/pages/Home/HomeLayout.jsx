import { useEffect, useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { FileText, BookOpen } from 'lucide-react';
import StepsNav from './StepsNav';
import { PATHS } from '../../routes/paths';
import { fetchGlobalDocuments, downloadUploadFile } from '../../lib/api';

const toolClass =
  'flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-navy shadow-card';

export default function HomeLayout() {
  const [globalDocs, setGlobalDocs] = useState({ documents: [] });

  useEffect(() => {
    fetchGlobalDocuments()
      .then(setGlobalDocs)
      .catch(() => setGlobalDocs({ documents: [] }));
  }, []);

  // Every /api route requires a Bearer token now, which a plain <a href> navigation
  // can't attach — download through downloadUploadFile (authenticated blob fetch)
  // instead, same fix as Related Document / Settings > Contract Type.
  const contractProcedure = globalDocs.documents?.find(d => d.docKey === 'contract_procedure');
  const userManual = globalDocs.documents?.find(d => d.docKey === 'user_manual');

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-gradient-to-b from-sky-50 via-sky-50 to-slate-50">
      <div className="mx-auto w-full max-w-[1500px] px-6 pt-7">
        <div className="mb-6 flex flex-wrap justify-end gap-3">
          <Link to={PATHS.DOWNLOAD_FORM} className={toolClass}>
            <FileText size={18} className="text-brand-500" />
            DOWNLOAD FORM
          </Link>

          {contractProcedure?.fileId ? (
            <button
              type="button"
              onClick={() => downloadUploadFile(contractProcedure.fileId, contractProcedure.fileName)}
              className={toolClass}
            >
              <FileText size={18} className="text-brand-500" />
              CONTRACT PROCEDURE
            </button>
          ) : (
            <button type="button" disabled className={`${toolClass} cursor-not-allowed opacity-50`}>
              <FileText size={18} className="text-brand-500" />
              CONTRACT PROCEDURE
            </button>
          )}

          {userManual?.fileId ? (
            <button type="button" onClick={() => downloadUploadFile(userManual.fileId, userManual.fileName)} className={toolClass}>
              <BookOpen size={18} className="text-brand-500" />
              USER MANUAL
            </button>
          ) : (
            <button type="button" disabled className={`${toolClass} cursor-not-allowed opacity-50`}>
              <BookOpen size={18} className="text-brand-500" />
              USER MANUAL
            </button>
          )}
        </div>

        {/* Negative margin on purpose: PageContainer (rendered inside Outlet below,
            shared by every page so it's left alone) always adds its own py-7 (1.75rem)
            top padding, so this needs to be negative to close some of that gap. Net
            gap = -0.25rem + 1.75rem = 1.5rem (eased back up from an earlier -0.75rem/
            1rem pairing that read as too tight). */}
        <div className="-mb-1">
          <StepsNav />
        </div>
      </div>

      <Outlet />
    </div>
  );
}
