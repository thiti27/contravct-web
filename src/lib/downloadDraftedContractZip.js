import JSZip from 'jszip';
import { generateContractRequisitionFormPdfBlob } from '../pdf/downloadContractRequisitionFormPdf';
import { fetchContractTypes, fetchGlobalDocuments, fetchUploadBlob, fetchUploadBlobFromPath } from './api';
import { safeZipEntryName as safeName, triggerZipDownload } from './zipDownload';

// Only these 5 of the 7 "Related Contract Document" categories go into the zip —
// Specification and Drawing/Plan are deliberately left out (see DocumentsSection.jsx's
// OWNER_RESTRICTED_KEYS — the same two categories with extra confidentiality-style
// access restrictions). Each file's zip entry is prefixed with the label on the left,
// e.g. "Drafted Contract_quotation.pdf" — matching the category heading text, not the
// full bilingual label DOCUMENT_TYPES uses on screen (constants.js).
const ZIP_DOCUMENT_CATEGORIES = [
  { key: 'drafted', label: 'Drafted Contract' },
  { key: 'quotation', label: 'Quotation' },
  { key: 'schedule', label: 'Schedule' },
  { key: 'companyCertificate', label: 'Company Certificate' },
  { key: 'other', label: 'Other' },
];

// Drafted-status Download button (My Job/All Job/Contract Making — see
// ContractListPage.jsx's handleDownloadPdf): bundles the system-generated Contract
// Requisition Form PDF together with every attached file that's actually relevant to a
// signer — the 5 "Related Contract Document" categories above, the contract type's own
// purpose-specific ENG/THA procedure files (Settings > Contract Type's form_items —
// see contractTypeController.js), and the single global Check Sheet document — into one
// zip, instead of the single bare PDF a Signed contract still downloads.
export async function downloadDraftedContractZip(data, contractTypeLabel) {
  const zip = new JSZip();

  // Every entry is numbered by group (1 = the form itself, 2 = Related Contract
  // Document attachments, 3 = ENG/THA/Check Sheet templates) so a plain alphabetical
  // file-explorer sort clusters related files together instead of scattering PDFs/
  // spreadsheets in random order — deliberately flat, not subfolders, since a subfolder
  // is easy to miss/skip past when someone's just skimming an extracted zip.
  const { blob: pdfBlob, fileName: pdfFileName } = await generateContractRequisitionFormPdfBlob(data, contractTypeLabel);
  zip.file(safeName(`1_${pdfFileName}`), pdfBlob);

  const categoryFiles = ZIP_DOCUMENT_CATEGORIES.flatMap(({ key, label }) =>
    (data.documents?.[key]?.files || []).map(file => ({ label, file }))
  );
  await Promise.all(
    categoryFiles.map(async ({ label, file }) => {
      const { blob } = await fetchUploadBlob(file.id);
      zip.file(safeName(`2_Documents_${label}_${file.fileName}${file.extension}`), blob);
    })
  );

  const [contractTypes, globalDocuments] = await Promise.all([fetchContractTypes(), fetchGlobalDocuments()]);
  const purposeDocs = contractTypes.find(t => t.id === data.contractTypeId)?.purposeDocuments?.[data.contractPurpose];

  // "{purpose}_ENG"/"{purpose}_THA" — the purpose text identifies which procedure
  // template this is (a contract type can have several purposes, each with its own
  // attached ENG/THA form_item), since "ENG"/"THA" alone would be ambiguous.
  const extraDocs = [];
  if (purposeDocs?.fileEngPath) extraDocs.push({ label: `${data.contractPurpose}_ENG`, path: purposeDocs.fileEngPath });
  if (purposeDocs?.fileThaPath) extraDocs.push({ label: `${data.contractPurpose}_THA`, path: purposeDocs.fileThaPath });
  if (globalDocuments?.checkSheetPath) extraDocs.push({ label: 'Check Sheet', path: globalDocuments.checkSheetPath });

  await Promise.all(
    extraDocs.map(async ({ label, path }) => {
      const { blob, extension } = await fetchUploadBlobFromPath(path);
      zip.file(safeName(`3_Forms_${label}${extension}`), blob);
    })
  );

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const zipFileName = data.contractNo ? `Contract Documents - ${data.contractNo}.zip` : 'Contract Documents.zip';
  triggerZipDownload(zipBlob, zipFileName);
}
