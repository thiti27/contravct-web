import { normalizeReferContractNo } from '../../lib/contractNo';
import { normalizeThousands } from '../../lib/formatNumber';

const REQUIRED_MESSAGE = 'This field is required.';

export const EMPTY_DOCUMENT = { checked: false, files: [] };

function buildEmptyDocuments() {
  return {
    drafted: { ...EMPTY_DOCUMENT },
    quotation: { ...EMPTY_DOCUMENT },
    specification: { ...EMPTY_DOCUMENT },
    drawing: { ...EMPTY_DOCUMENT },
    schedule: { ...EMPTY_DOCUMENT },
    companyCertificate: { ...EMPTY_DOCUMENT },
    other: { ...EMPTY_DOCUMENT },
  };
}

export function buildInitialValues(user) {
  return {
    confidentiality: false,
    contractTypeId: '',
    contractPurpose: '',
    otherSpecify: '',
    supplierName: '',
    requestDate: new Date().toISOString().slice(0, 10),
    deliveryDate: '',
    location: '',
    warrantyPeriod: '',
    referContractNo: '',
    linkedMasterId: null,
    briefDescription: '',
    totalNetPrice: '',
    vat: '7%',
    currency: '',
    tradeTerm: '',
    payments: {
      payment1: '',
      payment2: '',
      payment3: '',
      payment4: '',
      payment5: '',
      payment6: '',
      payment7: '',
      payment8: '',
    },
    paymentOther: '',
    documents: buildEmptyDocuments(),
    comment: '',
    // Only meaningful for a Renew/Amend/Claim Note/Terminate/Cancel request (see
    // buildInitialValuesFromMaster below) — always empty here since a brand new request
    // has no "___ Information" section at all. Which of these actually get used, and
    // under what on-screen label, depends on remark — see ActionInfoSection.jsx.
    actionBackground: '', // Renew: "Purpose". Amend/Terminate/Claim Note: "Brief Description & Background/Reason".
    actionDetail: '', // Amend: "Amended Detail". Terminate: "Terminate Detail". Claim Note: "Claim Detail".
    actionFiles: [], // Amend/Terminate/Claim Note only.
    actionEffectiveDate: '', // Amend/Terminate only.
    originalContractStartDate: '', // Renew only — read-only, derived server-side from the referenced contract.
    originalContractEndDate: '', // Renew only — read-only, derived server-side from the referenced contract.
    newContractStartDate: '', // Renew only.
    newContractEndDate: '', // Renew only.
    cancelReason: '', // Cancel only.
    requestorName: user?.name || '',
    requestorSection: user?.section || '',
    approvers: ['', '', ''],
    remark: 'new',
  };
}

// Used by LinkedRequestModal (Renew/Amend/Claim Note/Terminate, opened from a Signed or
// Drafted row's More menu) — prefills Contract Information from the master contract's
// full detail (`masterData`, from GET /requests/:id, same shape this file's own
// buildInitialValues produces) since that section stays editable in the new linked
// request. Payment/currency/documents carry over verbatim from the master instead: this
// modal doesn't show Payment Term/Documents (see validateLinkedRequest below), so there's
// nowhere for the user to review or change them, and POST /requests still expects a
// complete-enough payload. Approvers always start blank — a renewed/amended/claimed/
// terminated contract needs its own fresh approval chain, never the master's old one.
export function buildInitialValuesFromMaster(masterData, user, remark) {
  return {
    confidentiality: masterData.confidentiality,
    contractTypeId: masterData.contractTypeId,
    contractPurpose: masterData.contractPurpose,
    otherSpecify: masterData.otherSpecify,
    supplierName: (masterData.supplierName || '').toUpperCase(),
    requestDate: new Date().toISOString().slice(0, 10),
    deliveryDate: masterData.deliveryDate,
    location: masterData.location,
    warrantyPeriod: masterData.warrantyPeriod,
    // Renew/Amend/Claim Note/Terminate: normalized to the base contract number (e.g.
    // "DSST01-2026-01" -> "DSST01-2026") — see normalizeReferContractNo — so if the
    // master itself is already a revision, this new request still refers to the base,
    // keeping the revision counter continuous instead of nesting.
    //
    // Cancel is deliberately different: it targets whichever exact contract the user
    // clicked Cancel on, verbatim — cancelling a revision (e.g. "DSST01-2026-01", its
    // own independently-Signed agreement) must cancel THAT contract, not silently
    // redirect to its unrelated base ("DSST01-2026"). No normalization here at all.
    referContractNo: remark === 'cancel' ? masterData.contractNo : normalizeReferContractNo(masterData.contractNo),
    // The exact row (by id) this request was opened from — see linked_master_id in
    // schema.sql. Used server-side only when remark === 'cancel': once this Cancel
    // request finishes its own approval chain, THIS row (whichever one was actually
    // clicked) flips to 'Cancelled', matching referContractNo above.
    linkedMasterId: masterData.id,
    briefDescription: masterData.briefDescription,
    totalNetPrice: normalizeThousands(masterData.totalNetPrice),
    vat: masterData.vat,
    currency: masterData.currency,
    tradeTerm: masterData.tradeTerm,
    payments: { ...masterData.payments },
    paymentOther: masterData.paymentOther,
    documents: buildEmptyDocuments(),
    comment: '',
    // This request's own "___ Information" — never carried over from the master, it's
    // specific to this particular renewal/amendment/claim/termination/cancellation. See
    // buildInitialValues above for what each field means per remark.
    actionBackground: '',
    actionDetail: '',
    actionFiles: [],
    actionEffectiveDate: '',
    // Renew's read-only "Original Period" — this IS the referenced contract (masterData
    // is that contract's own detail), so its own signed period is what "Original Period"
    // shows. Once this new request later becomes its own row, re-fetching it goes
    // through getRequest's linked_master_id lookup instead (see requestController.js).
    originalContractStartDate: masterData.contractStartDate || '',
    originalContractEndDate: masterData.expireDate || '',
    newContractStartDate: '',
    newContractEndDate: '',
    cancelReason: '',
    requestorName: user?.name || '',
    requestorSection: user?.section || '',
    approvers: ['', '', ''],
    remark,
  };
}

// "Manager or level up" (index 0) and the bottom Supervisor slot (index 2) are required;
// only the middle Supervisor slot (index 1) is optional. Shared by both validators below —
// the approval chain rules are the same regardless of which sections the rest of the form shows.
function approverErrors(approvers) {
  const errors = approvers.map((a, index) => (!a && index !== 1 ? REQUIRED_MESSAGE : undefined));
  return errors.some(Boolean) ? errors : undefined;
}

// Used by the "Send Request" submit path only — Save Draft skips validation entirely.
export function validateRequest(values) {
  const errors = {};
  const requireText = key => {
    if (!String(values[key] ?? '').trim()) errors[key] = REQUIRED_MESSAGE;
  };

  requireText('contractTypeId');
  requireText('contractPurpose');
  requireText('supplierName');
  requireText('requestDate');
  requireText('deliveryDate');
  requireText('location');
  requireText('warrantyPeriod');
  requireText('briefDescription');
  requireText('totalNetPrice');
  requireText('vat');
  requireText('currency');
  requireText('tradeTerm');
  requireText('requestorName');
  requireText('requestorSection');

  const approvers = approverErrors(values.approvers);
  if (approvers) errors.approvers = approvers;

  if (!values.remark) errors.remark = REQUIRED_MESSAGE;

  return errors;
}

// Used by LinkedRequestModal's "Send Request" submit path (and EditRequestModal's, when
// editing a Renew/Amend/Claim Note/Terminate request). Deliberately narrower than
// validateRequest above: Contract Information is read-only there (fixed at creation) and
// Payment Term/Documents aren't shown at all — totalNetPrice/vat/currency/tradeTerm are
// carried over from the master unedited and have nowhere to be fixed here, so requiring
// them would block Send Request on fields the user can't see, let alone correct.
export function validateLinkedRequest(values) {
  const errors = {};
  const requireText = key => {
    if (!String(values[key] ?? '').trim()) errors[key] = REQUIRED_MESSAGE;
  };

  requireText('contractTypeId');
  requireText('contractPurpose');
  requireText('supplierName');
  requireText('requestDate');
  requireText('deliveryDate');
  requireText('location');
  requireText('warrantyPeriod');
  requireText('briefDescription');
  requireText('requestorName');
  requireText('requestorSection');

  // "___ Information" requirements are remark-specific — each action collects a
  // different shape of data (see ActionInfoSection.jsx), unlike the single shared
  // Background/Detail/Attach file fields this used to require for every remark.
  if (values.remark === 'renew') {
    requireText('actionBackground'); // Purpose
    requireText('newContractStartDate');
    requireText('newContractEndDate');
    if (values.newContractStartDate && values.newContractEndDate && values.newContractStartDate > values.newContractEndDate) {
      errors.newContractEndDate = 'End Date must not be earlier than Start Date.';
    }
  } else if (values.remark === 'amend' || values.remark === 'terminate') {
    requireText('actionBackground');
    requireText('actionDetail');
    requireText('actionEffectiveDate');
  } else if (values.remark === 'claim') {
    requireText('actionBackground');
    requireText('actionDetail');
  } else if (values.remark === 'cancel') {
    requireText('cancelReason');
  }

  const approvers = approverErrors(values.approvers);
  if (approvers) errors.approvers = approvers;

  return errors;
}
