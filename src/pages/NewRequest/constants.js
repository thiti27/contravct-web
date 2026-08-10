export const DOCUMENT_TYPES = [
  { key: 'drafted', label: 'Drafted Contract (ร่างสัญญา)' },
  { key: 'quotation', label: 'Quotation (ใบเสนอราคา)' },
  { key: 'specification', label: 'Specification (ข้อกำหนด)' },
  { key: 'drawing', label: 'Drawing / Plan (แบบร่าง)' },
  { key: 'schedule', label: 'Schedule (แผนงาน)' },
  { key: 'companyCertificate', label: 'Company Certificate (หนังสือรับรองบริษัท)' },
  { key: 'other', label: 'Other (โปรดระบุ เช่น ADF, เอกสารที่นำเสนอต่อ MCM)' },
];

export const PAYMENT_INSTALLMENTS = [
  { key: 'payment1', label: '1st Payment (งวดที่ 1)' },
  { key: 'payment2', label: '2nd Payment (งวดที่ 2)' },
  { key: 'payment3', label: '3rd Payment (งวดที่ 3)' },
  { key: 'payment4', label: '4th Payment (งวดที่ 4)' },
  { key: 'payment5', label: '5th Payment (งวดที่ 5)' },
  { key: 'payment6', label: '6th Payment (งวดที่ 6)' },
  { key: 'payment7', label: '7th Payment (งวดที่ 7)' },
  { key: 'payment8', label: '8th Payment (งวดที่ 8)' },
];

export const REMARK_OPTIONS = [
  { value: 'new', label: 'New Contract' },
  { value: 'renew', label: 'Renew Contract' },
  { value: 'amend', label: 'Amend Contract' },
  { value: 'claim', label: 'Claim Note' },
  { value: 'terminate', label: 'Terminate' },
];

export const CURRENCY_OPTIONS = ['THB', 'USD', 'EUR', 'JPY', 'CNY'];

export const APPROVER_ROLES = ['Manager or level up', 'Supervisor or level up', 'Supervisor or level up'];
