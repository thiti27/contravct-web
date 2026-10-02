import { pdf } from '@react-pdf/renderer';
import ConstructionRiskChecklistPDF from './ConstructionRiskChecklistPDF';

// Same "render client-side, hand back a blob" split as
// downloadContractRequisitionFormPdf.jsx's own generateContractRequisitionFormPdfBlob,
// and same "take the whole contract row" calling convention — used by
// downloadDraftedContractZip.js/downloadSignedContractZip.js to bundle this PDF into the
// zip instead of saving it straight to disk. `data` is the full fetchContractRequest
// result; supplierName/confidentiality are read live off it rather than off
// data.constructionRiskAnswers (the frozen assessment snapshot), so the report always
// reflects the contract as it stands now, not as it stood when the assessment was done.
export async function generateConstructionRiskChecklistPdfBlob(data) {
  const blob = await pdf(
    <ConstructionRiskChecklistPDF
      snapshot={data.constructionRiskAnswers}
      contractNo={data.contractNo}
      approvedDate={data.approverSignatures?.[0]?.approvedAt}
      supplierName={data.supplierName}
      confidential={data.confidentiality}
    />
  ).toBlob();
  const fileName = data.contractNo ? `Construction Risk Checklist - ${data.contractNo}.pdf` : 'Construction Risk Checklist.pdf';
  return { blob, fileName };
}
