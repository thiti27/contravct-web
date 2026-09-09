import { pdf } from '@react-pdf/renderer';
import ContractRequisitionFormPDF from './ContractRequisitionFormPDF';

// Renders the PDF entirely client-side (no backend call, no new data fetch — `data` is
// exactly what the caller already has on screen, e.g. EditRequestModal's formik.values).
// Split out from downloadContractRequisitionFormPdf below so a Drafted-status download
// (see ContractListPage.jsx's handleDownloadPdf) can bundle this same blob into a zip
// instead of saving it straight to disk.
export async function generateContractRequisitionFormPdfBlob(data, contractTypeLabel) {
  const blob = await pdf(<ContractRequisitionFormPDF data={data} contractTypeLabel={contractTypeLabel} />).toBlob();
  const fileName = data.contractNo ? `Contract Requisition Form - ${data.contractNo}.pdf` : 'Contract Requisition Form.pdf';
  return { blob, fileName };
}

// Triggers a browser download of the PDF above. Same throwaway-blob-URL pattern used
// elsewhere in this app for authenticated file downloads (see lib/api.js's
// downloadUploadFile), even though no auth header is involved here — kept identical so
// there's one download idiom in the codebase, not two.
export async function downloadContractRequisitionFormPdf(data, contractTypeLabel) {
  const { blob, fileName } = await generateContractRequisitionFormPdfBlob(data, contractTypeLabel);

  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(blobUrl);
}
