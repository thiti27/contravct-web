// Source: Construction Risk.xlsx (FOPI-S35-LEG-001-014), rows 16-30 of its single
// sheet — transcribed verbatim (bilingual EN/TH text as one string, "\n"-joined,
// exactly as the workbook's own cells hold it) so the popup and any later Excel
// export both trace back to the same source of truth. Each item scores 1 point for
// "low" and 2 for "high" (see CONSTRUCTION_RISK_SCORE below); the workbook's own
// M32 = SUM(M17:M30) and M15/M33 = IF(M32>=15,"HIGH RISK","LOW RISK") are reproduced
// by scoreConstructionRisk() below.
export const CONSTRUCTION_RISK_ITEMS = [
  {
    no: 1,
    criteria: 'Construction Contract Value\nมูลค่าของงาน',
    low: 'Contract Value ≥ 5MTHB with Proven Contractor Performance\nงานมูลค่า ≤5 ล้านบาท โดยผู้รับเหมามีประวัติรับงานกับบริษัทมาหลายงานแล้วและผลงานที่มาผ่านไม่มีปัญหา',
    high: 'Contract Value ≥ 1MTHB with a First-Time Contractor\nงานมูลค่า ≥ 1 ล้านบาท โดยผู้รับเหมารับงานนี้เป็นครั้งแรก',
  },
  {
    no: 2,
    criteria: 'Nature of Work\nลักษณะงาน',
    low: 'General construction or repair works that are straightforward and non-complex\nงานก่อสร้าง/ซ่อมแซมทั่วไปที่ไม่ซับซ้อน',
    high: 'Complex construction works or works involving specialized construction methods\nงานก่อสร้างที่ซับซ้อน หรือมีวิธีการก่อสร้างพิเศษ',
  },
  {
    no: 3,
    criteria: 'Demolition\nการรื้อถอน',
    low: 'No demolition works\nไม่มีงานรื้อถอน',
    high: 'Demolition, dismantling, or removal works\nมีงานรื้อถอน/ทุบทำลาย',
  },
  {
    no: 4,
    criteria: 'Structural Work\nงานโครงสร้าง',
    low: 'Decorative, finishing, or repair works that do not affect the structural integrity of the building\nงานตกแต่ง/ซ่อมแซมที่ไม่กระทบโครงสร้าง',
    high: 'Construction, modification, strengthening, or removal of structural elements\nก่อสร้าง ดัดแปลง เสริม หรือรื้อโครงสร้าง',
  },
  {
    no: 5,
    criteria: 'Excavation\nงานขุด',
    low: 'No excavation, or minor excavation with no material impact\nไม่มีงานขุด หรือขุดตื้นที่ไม่มีผลกระทบ',
    high: 'Deep excavation or excavation that may affect structures, utilities, or adjacent areas/property\nขุดลึก/อาจกระทบโครงสร้าง สาธารณูปโภค หรือพื้นที่ข้างเคียง',
  },
  {
    no: 6,
    criteria: 'Work at Height\nงานบนที่สูง',
    low: 'No work at height, or work involving low fall risk\nไม่มีหรือมีความเสี่ยงต่ำ',
    high: 'Work at height involving a material risk of falls\nมีงานบนที่สูงที่มีความเสี่ยงต่อการตกอย่างมีนัยสำคัญ',
  },
  {
    no: 7,
    // A plain space inserted at a natural word break (invisible in normal reading) —
    // this is the single longest unbroken Thai run of all 14 criteria labels, and
    // without any space to wrap at, ConstructionRiskChecklistPDF.jsx's disabled
    // hyphenation (see that file's own note on why) has nowhere to break it, so it
    // overflows its table column instead of wrapping like every other label does.
    criteria: 'Hot Work\nงานที่ก่อให้เกิด ความร้อนหรือประกายไฟ',
    low:
      '- Assembly methods that do not require welding or cutting.\n' +
      '- Minor welding works carried out in a designated and controlled area.\n' +
      '- Welding works carried out within a construction area that is segregated from buildings or critical property.\n' +
      '- ใช้วิธีประกอบโดยไม่ต้องเชื่อม/ตัด\n' +
      '- มีงานเชื่อมเล็กน้อยในพื้นที่ที่จัดเตรียมและควบคุมได้\n' +
      '- มีงานเชื่อมในพื้นที่ก่อสร้างที่แยกจากอาคาร/ทรัพย์สินสำคัญ',
    high:
      '- Extensive Hot Work or Hot Work that constitutes a significant part of the works and presents a material risk to property or operations.\n' +
      '- Hot Work carried out in or near areas containing flammable materials, fuels, chemicals, or operating systems.\n' +
      '- Hot Work carried out within an Operating Facility or in close proximity to Critical Equipment.\n' +
      '- มี Hot Work จำนวนมากหรือเป็นส่วนสำคัญของงานที่มีความเสี่ยงต่อทรัพย์สิน/การดำเนินงานอย่างมีนัยสำคัญ\n' +
      '- อยู่ใน/ใกล้พื้นที่ที่มีวัสดุไวไฟ เชื้อเพลิง สารเคมี หรือระบบที่ยังดำเนินงาน\n' +
      '- อยู่ภายใน Operating Facility หรือใกล้ Critical Equipment',
  },
  {
    no: 8,
    criteria: 'Heavy Lifting\nงานยกของหนัก / เครื่องจักร',
    low:
      '- Use of ordinary tools or equipment.\n' +
      '- Lifting operations carried out within a controlled construction area.\n' +
      '- No lifting operations over critical areas or facilities.\n' +
      '- ใช้เครื่องมือทั่วไป\n' +
      '- ยกในพื้นที่ก่อสร้างที่ควบคุมได้\n' +
      '- ไม่มีการยกเหนือพื้นที่สำคัญ',
    high:
      '- Heavy lifting involving loads of significant weight or size, or involving complex lifting operations.\n' +
      '- Lifting operations carried out near an Operating Facility or Critical Equipment.\n' +
      '- Heavy lifting over buildings, systems, or operational areas.\n' +
      '- Heavy lifting ที่มีน้ำหนัก/ขนาดมากหรือมีความซับซ้อน\n' +
      '- ยกใกล้ Operating Facility หรือ Critical Equipment\n' +
      '- ยกของหนักเหนืออาคาร ระบบ หรือพื้นที่ปฏิบัติงาน',
  },
  {
    no: 9,
    criteria: 'Electrical/Mechanical\nงานระบบไฟฟ้า / เครื่องกล',
    low:
      '- Installation of general electrical outlets and switches.\n' +
      '- General building electrical systems.\n' +
      '- General lighting systems.\n' +
      '- ติดตั้งปลั๊ก/สวิตช์ทั่วไป\n' +
      '- ระบบไฟฟ้าภายในอาคารทั่วไป\n' +
      '- ระบบ Lighting ทั่วไป',
    high:
      '- High-voltage electrical works.\n' +
      '- Critical substations, transformers, or switchgear.\n' +
      '- Electrical systems where failure or disruption could materially affect critical operations.\n' +
      '- งานระบบไฟฟ้าแรงสูง\n' +
      '- Substation / Transformer / Switchgear สำคัญ\n' +
      '- ระบบไฟฟ้าที่หากขัดข้องจะกระทบ Operation สำคัญ',
  },
  {
    no: 10,
    criteria: 'Operating Facility\nสถานที่ที่ยังดำเนินงานอยู่',
    low: 'Work in an unoccupied/non-operating area or in an area that can be clearly isolated from ongoing operations\nทำงานในพื้นที่ที่ไม่มีการดำเนินงาน หรือแยกพื้นที่ได้ชัดเจน',
    high: 'Work within a factory, building, or facility that remains operational during the works\nทำงานในโรงงาน/อาคาร/Facility ที่ยังดำเนินงานอยู่',
  },
  {
    no: 11,
    criteria: 'Existing Property/Utility\nทรัพย์สิน / สาธารณูปโภคเดิม',
    low: 'No material impact on existing property, structures, or utilities\nไม่กระทบทรัพย์สินหรือระบบเดิมอย่างมีนัยสำคัญ',
    high: 'Work that may materially affect existing structures, electrical systems, water, gas, piping, utilities, or other existing facilities\nอาจกระทบโครงสร้าง ระบบไฟฟ้า น้ำ Gas Piping หรือ Utility เดิม',
  },
  {
    no: 12,
    criteria: 'Third Party Exposure\nความเสี่ยงต่อบุคคลภายนอก',
    low: 'Low risk of injury to third parties or damage to third-party property\nความเสี่ยงต่อบุคคล/ทรัพย์สินภายนอกต่ำ',
    high: 'Potential for material injury to third parties or damage to third-party property\nอาจเกิดความเสียหายต่อบุคคลหรือทรัพย์สินของบุคคลภายนอกอย่างมีนัยสำคัญ',
  },
  {
    no: 13,
    criteria: 'Business Interruption\nผลกระทบต่อการดำเนินงาน',
    low: "An incident is not expected to materially affect the Owner's operations\nหากเกิดเหตุไม่คาดว่าจะกระทบ Operation อย่างมีนัยสำคัญ",
    high: "An incident may materially disrupt or adversely affect the Owner's operations\nหากเกิดเหตุอาจทำให้ Operation หยุดชะงัก/เสียหายอย่างมีนัยสำคัญ",
  },
  {
    no: 14,
    criteria: 'Potential Loss\nความเสียหายที่อาจเกิดขึ้น',
    low: 'Potential loss or damage is expected to be limited in nature and extent\nความเสียหายที่คาดว่าจะเกิดขึ้นอยู่ในวงจำกัด',
    high: 'An incident may result in significant loss or damage to persons, property, or business operations\nหากเกิดเหตุอาจมีความเสียหายสูงต่อบุคคล ทรัพย์สิน หรือธุรกิจ',
  },
];

export const CONSTRUCTION_RISK_SCORE = { low: 1, high: 2 };

// Mirrors the workbook's own D36-39 — shown only once the live classification is
// HIGH RISK, same trigger as the workbook's D15 conditional text.
export const HIGH_RISK_REQUIREMENTS = [
  'Use the correct HIGH RISK contract template, as it requires the contractor to provide a Performance Bond and maintain the required insurance coverage.\nเลือกใช้แบบฟอร์มสัญญาที่ระบุ HIGH RISK ให้ถูกต้อง เนื่องจากสัญญาระบุให้ผู้รับเหมามีการวางหลักประกันการปฏิบัติตามสัญญา (Performance Bond) และทำประกันภัย (Insurance)',
  'Notify the contractor in writing as soon as possible, and in any event before issuing the PO (Purchase Order).\nแจ้งผู้รับเหมาให้ทราบเป็นลายลักษณ์อักษรโดยเร็วหรือก่อนออก PO',
];

// Settings > Contract Type's own exemption field (constructionRiskExemptAbove) — above
// that Total Net Price, the checklist popup isn't required at all, even for a type with
// checkConstructionRisk on. Until a numeric Total Net Price is actually entered, the
// checklist stays required (the safe default) rather than assumed exempt — it only
// becomes exempt once a real value is confirmed to exceed the threshold. Shared by
// ContractInfoSection.jsx (to show/hide the popup trigger) and formConfig.js's
// validateRequest (to gate Send Request) so both apply the exact same rule.
export function requiresConstructionRiskAssessment(type, totalNetPrice) {
  if (!type?.checkConstructionRisk) return false;
  const exemptAbove = type.constructionRiskExemptAbove;
  if (exemptAbove == null) return true;
  const value = Number(String(totalNetPrice ?? '').replace(/,/g, ''));
  if (!Number.isFinite(value) || !totalNetPrice) return true;
  return value <= exemptAbove;
}

// Mirrors the workbook's own M32 (SUM) and M15/M33 (IF(>=15,"HIGH RISK","LOW RISK")).
// `answers` is { [itemNo]: 'low' | 'high' }; an item missing from it contributes 0,
// same as an unanswered L-column cell in the source workbook.
export function scoreConstructionRisk(answers) {
  const score = CONSTRUCTION_RISK_ITEMS.reduce((sum, item) => sum + (CONSTRUCTION_RISK_SCORE[answers[item.no]] || 0), 0);
  const complete = CONSTRUCTION_RISK_ITEMS.every(item => answers[item.no] === 'low' || answers[item.no] === 'high');
  const level = score >= 15 ? 'high' : 'low';
  return { score, level, complete };
}
