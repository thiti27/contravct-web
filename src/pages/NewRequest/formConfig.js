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
    supplierName: masterData.supplierName,
    requestDate: new Date().toISOString().slice(0, 10),
    deliveryDate: masterData.deliveryDate,
    location: masterData.location,
    warrantyPeriod: masterData.warrantyPeriod,
    referContractNo: masterData.contractNo,
    briefDescription: masterData.briefDescription,
    totalNetPrice: masterData.totalNetPrice,
    vat: masterData.vat,
    currency: masterData.currency,
    tradeTerm: masterData.tradeTerm,
    payments: { ...masterData.payments },
    paymentOther: masterData.paymentOther,
    documents: buildEmptyDocuments(),
    comment: '',
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

// Used by LinkedRequestModal's "Send Request" submit path. Deliberately narrower than
// validateRequest above: this modal only shows Contract Information + Approval (see
// buildInitialValuesFromMaster), so it only requires what's actually on screen —
// totalNetPrice/vat/currency/tradeTerm are carried over from the master unedited and
// have nowhere to be fixed here, so requiring them would block Send Request on fields
// the user can't see, let alone correct.
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

  const approvers = approverErrors(values.approvers);
  if (approvers) errors.approvers = approvers;

  return errors;
}
