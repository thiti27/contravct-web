import JSZip from 'jszip';
import { generateContractRequisitionFormPdfBlob } from '../pdf/downloadContractRequisitionFormPdf';
import { fetchUploadBlob } from './api';
import { safeZipEntryName as safeName, triggerZipDownload } from './zipDownload';

// Signed/Terminated-status Download button (My Job/All Job/Contract Making — see
// ContractListPage.jsx's handleDownloadPdf): the contract is finalized by this point,
// so there's no "Related Contract Document"/ENG-THA-Check Sheet package left to gather
// (that's Drafted's own zip, see downloadDraftedContractZip.js) — just the
// system-generated Contract Requisition Form PDF plus the actual signed contract PDF
// the requester uploaded (Upload Sign Contract — see signedContractController.js),
// bundled together instead of the bare form alone.
export async function downloadSignedContractZip(data, contractTypeLabel) {
  const zip = new JSZip();

  const { blob: pdfBlob, fileName: pdfFileName } = await generateContractRequisitionFormPdfBlob(data, contractTypeLabel);
  zip.file(safeName(`1_${pdfFileName}`), pdfBlob);

  if (data.signedFile) {
    const { blob } = await fetchUploadBlob(data.signedFile.id);
    zip.file(safeName(`2_Signed Contract_${data.signedFile.fileName}${data.signedFile.extension}`), blob);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const zipFileName = data.contractNo ? `Contract Documents - ${data.contractNo}.zip` : 'Contract Documents.zip';
  triggerZipDownload(zipBlob, zipFileName);
}
