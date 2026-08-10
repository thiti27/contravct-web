const REQUIRED_MESSAGE = 'This field is required.';

export const EMPTY_DOCUMENT = { checked: false, files: [] };

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
    documents: {
      drafted: { ...EMPTY_DOCUMENT },
      quotation: { ...EMPTY_DOCUMENT },
      specification: { ...EMPTY_DOCUMENT },
      drawing: { ...EMPTY_DOCUMENT },
      schedule: { ...EMPTY_DOCUMENT },
      companyCertificate: { ...EMPTY_DOCUMENT },
      other: { ...EMPTY_DOCUMENT },
    },
    comment: '',
    requestorName: user?.name || '',
    requestorSection: user?.section || '',
    approvers: ['', '', ''],
    remark: 'new',
  };
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

  // "Manager or level up" (index 0) and the bottom Supervisor slot (index 2) are required;
  // only the middle Supervisor slot (index 1) is optional.
  const approverErrors = values.approvers.map((a, index) => (!a && index !== 1 ? REQUIRED_MESSAGE : undefined));
  if (approverErrors.some(Boolean)) errors.approvers = approverErrors;

  if (!values.remark) errors.remark = REQUIRED_MESSAGE;

  return errors;
}
