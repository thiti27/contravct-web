import { fetchContractRequest } from './api';
import { downloadContractRequisitionFormPdf } from '../pdf/downloadContractRequisitionFormPdf';
import { downloadDraftedContractZip } from './downloadDraftedContractZip';
import { downloadSignedContractZip } from './downloadSignedContractZip';
import { normalizeThousands } from './formatNumber';

// Shared by ContractListPage's row-level Download button and the public Contract
// Documents page (ContractDocumentsPage.jsx) — same "which bundle does this status
// get" branching either way, so it only needs writing once. `contract` only needs
// {id, status, type}; fetchContractRequest(id) is what actually makes the row PDF-
// shaped (documents, payments, comments, approverSignatures, ...) — the summary shape
// GET /api/contracts or GET /api/contract-documents/:contractNo returns isn't enough
// on its own. Works for a logged-out visitor exactly the same as a logged-in one:
// fetchContractRequest and every file fetch it triggers are optionally authenticated
// on the backend (request.routes.js/upload.routes.js), gated by that contract's own
// confidentiality rather than by a hard login requirement.
export async function downloadContractDocuments(contract) {
  const data = await fetchContractRequest(contract.id);
  // totalNetPrice comes back from the API as a plain numeric string ("22222.00") —
  // EditRequestModal.jsx's own loadContractData applies this exact same
  // normalizeThousands step before the data ever reaches its formik values, so the
  // PDF's number formatting stays identical regardless of which page triggered it.
  const pdfData = { ...data, totalNetPrice: normalizeThousands(data.totalNetPrice) };

  if (contract.status === 'Drafted') {
    // Not signed yet — a reviewer needs the full package (generated form + every
    // attached document) in one go, not just the bare form.
    await downloadDraftedContractZip(pdfData, contract.type);
  } else if (contract.status === 'Signed' || contract.status === 'Terminated') {
    // Finalized — just the generated form plus the actual signed contract PDF the
    // requester uploaded.
    await downloadSignedContractZip(pdfData, contract.type);
  } else {
    await downloadContractRequisitionFormPdf(pdfData, contract.type);
  }
}
