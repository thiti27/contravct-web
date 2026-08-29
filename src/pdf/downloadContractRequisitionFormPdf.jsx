import { pdf } from '@react-pdf/renderer';
import ContractRequisitionFormPDF from './ContractRequisitionFormPDF';

// Renders the PDF entirely client-side (no backend call, no new data fetch — `data` is
// exactly what the caller already has on screen, e.g. EditRequestModal's formik.values)
// and triggers a browser download. Same throwaway-blob-URL pattern used elsewhere in
// this app for authenticated file downloads (see lib/api.js's downloadUploadFile), even
// though no auth header is involved here — kept identical so there's one download idiom
// in the codebase, not two.
export async function downloadContractRequisitionFormPdf(data, contractTypeLabel) {
  const blob = await pdf(<ContractRequisitionFormPDF data={data} contractTypeLabel={contractTypeLabel} />).toBlob();
  const fileName = data.contractNo ? `Contract Requisition Form - ${data.contractNo}.pdf` : 'Contract Requisition Form.pdf';

  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(blobUrl);
}
