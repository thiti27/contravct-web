import { Document, Page, View, Text, Image, Font, StyleSheet } from '@react-pdf/renderer';

// react-pdf renders with its own PDF text engine, not the browser — it can't use the
// CSS-loaded Google Font (Sarabun, see index.html's <link>) the rest of the app uses,
// only an actual font FILE registered up front. Same family the rest of the UI uses,
// so the PDF doesn't look like a different app — files copied from Google's own
// google/fonts repo into public/fonts/ (OFL-licensed, see that folder).
Font.register({
  family: 'Sarabun',
  fonts: [{ src: '/fonts/Sarabun-Regular.ttf' }, { src: '/fonts/Sarabun-Bold.ttf', fontWeight: 'bold' }],
});

// react-pdf's default line-wrapping hyphenates any "word" that doesn't fit on the
// current line — a rule built for Latin-script dictionaries. Thai script has no spaces
// between syllables, so its default algorithm has no real break point to use and just
// splits at an arbitrary spot instead, inserting a bare "-" mid-run (e.g. "Document
// (-" / "In-vestment" were showing up in this exact document). Returning the whole
// word as one unbreakable unit disables that: a long word just wraps at the next
// space instead, which is what every Thai/English-mixed label here actually needs.
Font.registerHyphenationCallback(word => [word]);

// ---------------------------------------------------------------------------
// Data mapping — Excel Template cell -> Form field -> React data field
// (public/Contract Requisition Form.xlsx, single worksheet "Sheet1", A4 portrait,
// print area A1:M56, one page — inspected via ExcelJS before writing this component,
// per the task's "no guessing the layout" requirement.)
//
//   A3/A4        Contract Type            -> contractTypeLabel (prop, from contractTypes list — see EditRequestModal.jsx's selectedTypeName)
//   K3/L3        DSST: (contract no.)     -> data.contractNo
//   K4/L4        DATE:                    -> data.approverSignatures[0].approvedAt (Manager/approver3's sign-off date — same field NewRequestHeader.jsx's own DATE: uses)
//   B7/C7        Supplier Name            -> data.supplierName
//   J7/K7        Date                     -> data.requestDate
//   B8/C8        Delivery Date            -> data.deliveryDate
//   J8/K8        Location                 -> data.location
//   B9/C9        Warranty Period          -> data.warrantyPeriod
//   J9/K9        Refer to Contract No.    -> data.referContractNo
//   B10/D10-12   Brief Description & Background -> data.briefDescription
//   B16/C16      Total Net Price          -> data.totalNetPrice
//   E16/F16      Vat                      -> data.vat
//   H16/I16      Currency                 -> data.currency
//   K16/L16      Trade Term (Incoterm)    -> data.tradeTerm
//   B18-21/J18-21 1st-8th Payment          -> data.payments.payment1..8
//   B22/D22      Other                    -> data.paymentOther
//   B28-34       Related Contract Document checkboxes -> data.documents.{drafted,quotation,specification,drawing,schedule,companyCertificate,other}.checked
//   H28-41       Requestor/Supervisor/LG/Others's Comment -> data.comments[] ({role, name, comment})
//   B47/C47      Requestor Name           -> data.requestorName
//   J47/K47      Section                  -> data.requestorSection
//   G50/G52/G54  Approver signature+date  -> data.approverSignatures[0..2] (Manager, Supervisor, Supervisor — approver3/approver2/approver1)
//   K50-55       Remark checkboxes        -> data.remark (New/Renew/Amend/Claim Note/Terminate/Cancel Contract)
//
// Renew/Amend/Terminate/Claim Note/Cancel's own newer "___ Information" fields
// (actionBackground/actionDetail/actionEffectiveDate/cancelReason/...) have no home on
// this physical form — the real template predates that feature — so they're
// intentionally left off, same call made for the LibreOffice-based PDF attempt earlier.
// ---------------------------------------------------------------------------

const YELLOW = '#FFFFCC';
const BLUE = '#0000FF';
const RED = '#FF0000';
const BORDER = '#000000';

const styles = StyleSheet.create({
  // paddingBottom is bigger than the other 3 sides on purpose — it reserves room for
  // the fixed footer (Page number + form code) so flowing content's own natural bottom
  // edge stops above the footer instead of ever rendering underneath it. Every height
  // calculation below (docSection's flexGrow, wrap={false} fit-checks) is automatically
  // resolved against this smaller content box, since Yoga sees the reserved space as
  // outside the box to begin with — no separate "subtract footer height" arithmetic
  // needed anywhere else.
  page: { fontFamily: 'Sarabun', fontSize: 8.5, paddingTop: 24, paddingLeft: 24, paddingRight: 24, paddingBottom: 40, color: '#000000' },
  footer: {
    position: 'absolute',
    bottom: 16,
    left: 24,
    right: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  footerPageNumber: { fontSize: 8, color: '#444444' },
  footerCode: { fontSize: 6.5, color: '#444444' },

  headerRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: BORDER, padding: 6 },
  contractTypeBox: { width: 90 },
  contractTypeLabel: { fontWeight: 'bold', fontSize: 9 },
  contractTypeValue: { marginTop: 10, borderBottomWidth: 1, borderColor: BORDER, fontSize: 9, minHeight: 12 },
  logo: { width: 46, height: 26, marginRight: 8 },
  titleBox: { flex: 1, alignItems: 'center' },
  titleText: { fontWeight: 'bold', fontSize: 12 },
  titleSubText: { fontSize: 9 },
  metaBox: { width: 130, alignItems: 'flex-end' },
  confidentialText: { fontWeight: 'bold', fontSize: 11, color: RED },
  metaLine: { flexDirection: 'row', marginTop: 2 },
  metaLabel: { fontSize: 8 },
  metaValue: { fontSize: 8, fontWeight: 'bold', marginLeft: 3, borderBottomWidth: 1, borderColor: BORDER, borderStyle: 'dotted', minWidth: 60, textAlign: 'center' },

  infoBox: { borderWidth: 1, borderTopWidth: 0, borderColor: BORDER, padding: 6 },
  // alignItems: 'flex-start' — Yoga's default for a row is 'stretch', which pads a
  // short single-line label out to match its multi-line-wrapped sibling's height, and
  // a stretched Text's own content then sits vertically centered in that taller box.
  // flex-start pins every Label + ":" field to the top of its row instead, regardless
  // of how many lines the value next to it wraps to.
  infoRow: { flexDirection: 'row', marginBottom: 2, alignItems: 'flex-start' },
  infoHalf: { flex: 1, flexDirection: 'row' },
  fieldLabel: { fontWeight: 'bold', width: 92 },
  fieldValue: { flex: 1, color: BLUE, borderBottomWidth: 0.5, borderColor: BORDER },

  // Brief Description & Background is a full-width paragraph field, not a Label|Value
  // row like every other field in infoBox — the label sits on its own line above the
  // text instead of beside it, so there's no column split for a page break to ever
  // fall across. Plain default wrap (react-pdf's normal Text pagination) lets long
  // text flow onto however many pages it needs, each continuation page still full
  // width, since this is a column stack rather than a row with a fixed side column.
  briefDescriptionBox: { marginBottom: 2 },
  briefDescriptionLabel: { fontWeight: 'bold', marginBottom: 2 },
  briefDescriptionValue: { color: BLUE },

  // No top border — the box immediately above (infoBox / paymentBox / cautionBox) already
  // supplies that line via its own bottom border; adding one here too just doubles it
  // into a thick/doubled-looking line at the seam.
  sectionHeader: { backgroundColor: YELLOW, borderBottomWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: BORDER, paddingVertical: 2, alignItems: 'center' },
  sectionHeaderText: { fontWeight: 'bold', fontSize: 9, textAlign: 'center' },

  paymentBox: { borderWidth: 1, borderTopWidth: 0, borderColor: BORDER, padding: 6 },
  installmentLabel: { fontWeight: 'bold', marginTop: 2, marginBottom: 2 },
  installmentGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  installmentCell: { width: '50%', flexDirection: 'row', marginBottom: 2 },
  installmentLabelText: { width: 110 },
  installmentValueText: { flex: 1, color: BLUE, borderBottomWidth: 0.5, borderColor: BORDER },

  // Same reasoning as sectionHeader above — no top border, paymentBox right above it
  // already supplies that line.
  twoColHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: BORDER },
  docColHeader: { width: '42%', backgroundColor: YELLOW, borderRightWidth: 1, borderColor: BORDER, paddingVertical: 2, alignItems: 'center' },
  commentColHeader: { flex: 1, backgroundColor: YELLOW, paddingVertical: 2, alignItems: 'center' },
  // flexGrow: 1 on both this wrapper and twoColBox below is the whole "push Section
  // pproval to the bottom of the page" mechanism — no hardcoded height anywhere. Page
  // has a fixed height (size="A4"), so Yoga (react-pdf's flexbox engine) resolves this
  // View's grow against whatever's actually left over after every other section's real,
  // just-measured content height — shrinking to nothing when there's no room (e.g. long
  // comments already fill the page) and expanding to fill blank space when there's
  // little content, exactly the dynamic behavior asked for. See docSection/twoColBox.
  docSection: { flexGrow: 1, flexDirection: 'column' },
  twoColBox: { flexGrow: 1, flexDirection: 'row', borderWidth: 1, borderTopWidth: 0, borderColor: BORDER },
  docCol: { width: '42%', padding: 6, borderRightWidth: 1, borderColor: BORDER },
  commentCol: { flex: 1, padding: 6 },
  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 3 },
  checkbox: { width: 8, height: 8, marginTop: 1, borderWidth: 1, borderColor: BORDER, marginRight: 5, padding: 1 },
  checkboxMarkFilled: { flex: 1, backgroundColor: BORDER },
  checkboxLabel: { flex: 1, fontSize: 8.5 },
  commentLine: { fontSize: 8, marginBottom: 6, paddingBottom: 2, borderBottomWidth: 0.5, borderColor: BORDER },
  commentEntry: { marginBottom: 6, paddingBottom: 2, borderBottomWidth: 0.5, borderColor: BORDER },
  commentText: { fontSize: 8 },
  commentMeta: { fontSize: 7, color: '#555555', marginTop: 2 },

  cautionBox: { borderWidth: 1, borderTopWidth: 0, borderColor: BORDER, padding: 6 },
  cautionEn: { color: BLUE, fontWeight: 'bold', fontSize: 8.5 },
  cautionTh: { fontWeight: 'bold', fontSize: 8.5, marginTop: 2 },

  approvalMetaRow: { flexDirection: 'row', borderWidth: 1, borderTopWidth: 0, borderColor: BORDER, padding: 6, alignItems: 'flex-start' },

  approverTable: { flexDirection: 'row', borderWidth: 1, borderTopWidth: 0, borderColor: BORDER },
  approverLabelCol: { width: 60, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderColor: BORDER, padding: 4 },
  approverLabelText: { fontWeight: 'bold', fontSize: 8, textAlign: 'center' },
  approverBody: { flex: 1 },
  // No border on the row container itself — Remark (approverRemarkCell) must read as
  // one unbroken list of 6 checkboxes, not divided per approver row, so the row-to-row
  // divider line only goes on the role/signature cells below, never on the remark cell.
  approverRow: { flexDirection: 'row' },
  approverRoleCell: { width: 110, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderTopWidth: 0.5, borderColor: BORDER, padding: 4 },
  approverSignCell: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderTopWidth: 0.5, borderColor: BORDER, padding: 4, minHeight: 28 },
  approverRemarkCell: { width: 100, padding: 4, justifyContent: 'center' },
});

function formatDateSlash(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = n => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

// Comment timestamps (createdAt) need the time too, unlike every other date-only field
// on this form — "20/08/2026 13:11:00".
function formatDateTimeSlash(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = n => String(n).padStart(2, '0');
  return `${formatDateSlash(value)} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// Drawn as a bordered square with a solid-fill inner square when checked — no glyph/
// font dependency at all (a checkmark character risked the same "tofu box" problem a
// font substitution caused in the LibreOffice-based PDF attempt; a plain filled
// rectangle sidesteps needing any particular glyph to exist in the registered font).
function Checkbox({ checked, label }) {
  return (
    <View style={styles.checkboxRow}>
      <View style={styles.checkbox}>{checked && <View style={styles.checkboxMarkFilled} />}</View>
      <Text style={styles.checkboxLabel}>{label}</Text>
    </View>
  );
}

const DOCUMENT_ITEMS = [
  { key: 'drafted', label: 'Drafted Contract (ร่างสัญญา)' },
  { key: 'quotation', label: 'Quotation (ใบเสนอราคา)' },
  { key: 'specification', label: 'Specification (ข้อกำหนด)' },
  { key: 'drawing', label: 'Drawing / Plan (แบบร่าง)' },
  { key: 'schedule', label: 'Schedule (แผนงาน)' },
  { key: 'companyCertificate', label: 'Company Certificate (หนังสือรับรองบริษัท)' },
  {
    key: 'other',
    label:
      'Other (โปรดระบุ เช่น ADF, เอกสารที่นำเสนอต่อ MCM, Investment Review Approval, หนังสือแจ้งปรับอัตราค่าบริการ รายงานการประชุม เป็นต้น)',
  },
];

const REMARK_ITEMS = [
  { key: 'new', label: 'New Contract' },
  { key: 'renew', label: 'Renew Contract' },
  { key: 'amend', label: 'Amend Contract' },
  { key: 'claim', label: 'Claim Note' },
  { key: 'terminate', label: 'Terminate' },
  { key: 'cancel', label: 'Cancel Contract' },
];

const PAYMENT_LABELS = [
  ['1st Payment (งวดที่ 1)', 'payment1'],
  ['2nd Payment (งวดที่ 2)', 'payment2'],
  ['3rd Payment (งวดที่ 3)', 'payment3'],
  ['4th Payment (งวดที่ 4)', 'payment4'],
  ['5th Payment (งวดที่ 5)', 'payment5'],
  ['6th Payment (งวดที่ 6)', 'payment6'],
  ['7th Payment (งวดที่ 7)', 'payment7'],
  ['8th Payment (งวดที่ 8)', 'payment8'],
];

// Manager (approver3, the final/top sign-off) then two Supervisor rows (approver2,
// approver1) — same bottom-up indexing/labels used throughout the app (see
// ApprovalSection.jsx, approverSignatures' own doc comment in requestController.js).
const APPROVER_ROWS = [
  { role: 'Manager or level up', signatureIndex: 0 },
  { role: 'Supervisor or level up', signatureIndex: 1 },
  { role: 'Supervisor or level up', signatureIndex: 2 },
];

export default function ContractRequisitionFormPDF({ data, contractTypeLabel }) {
  const documents = data.documents || {};
  const payments = data.payments || {};
  const comments = data.comments || [];
  const approverSignatures = data.approverSignatures || [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.contractTypeBox}>
            <Text style={styles.contractTypeLabel}>Contract Type :</Text>
            <Text style={styles.contractTypeValue}>{contractTypeLabel || ''}</Text>
          </View>
          <Image src="/company.png" style={styles.logo} />
          <View style={styles.titleBox}>
            <Text style={styles.titleText}>Contract Requisition Form</Text>
            <Text style={styles.titleSubText}>(แบบฟอร์มร้องขอทำสัญญา)</Text>
          </View>
          <View style={styles.metaBox}>
            <Text style={styles.confidentialText}>{data.confidentiality ? 'HIGH CONFIDENTIAL' : 'CONFIDENTIAL'}</Text>
            <View style={styles.metaLine}>
              <Text style={styles.metaLabel}>DSST:</Text>
              <Text style={styles.metaValue}>{data.contractNo || '-'}</Text>
            </View>
            <View style={styles.metaLine}>
              <Text style={styles.metaLabel}>DATE:</Text>
              <Text style={styles.metaValue}>{formatDateSlash(approverSignatures[0]?.approvedAt) || '-'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <View style={styles.infoHalf}>
              <Text style={styles.fieldLabel}>Supplier Name :</Text>
              <Text style={styles.fieldValue}>{data.supplierName}</Text>
            </View>
            <View style={styles.infoHalf}>
              <Text style={styles.fieldLabel}>Date :</Text>
              <Text style={styles.fieldValue}>{formatDateSlash(data.requestDate)}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoHalf}>
              <Text style={styles.fieldLabel}>Delivery Date :</Text>
              <Text style={styles.fieldValue}>{formatDateSlash(data.deliveryDate)}</Text>
            </View>
            <View style={styles.infoHalf}>
              <Text style={styles.fieldLabel}>Location :</Text>
              <Text style={styles.fieldValue}>{data.location}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoHalf}>
              <Text style={styles.fieldLabel}>Warranty Period :</Text>
              <Text style={styles.fieldValue}>{data.warrantyPeriod}</Text>
            </View>
            <View style={styles.infoHalf}>
              <Text style={styles.fieldLabel}>Refer to Contract No. :</Text>
              <Text style={styles.fieldValue}>{data.referContractNo}</Text>
            </View>
          </View>
          {/* Full width, default wrap (react-pdf paginates a Text node's own content
              across pages on its own) — label stacked above the value instead of
              beside it, so there's no side column for a page break to ever split. */}
          <View style={styles.briefDescriptionBox}>
            <Text style={styles.briefDescriptionLabel}>Brief Description & Background :</Text>
            <Text style={styles.briefDescriptionValue}>{data.briefDescription}</Text>
          </View>
        </View>

        {/* wrap={false}: Payment Term (header + all its fields, including the 8
            installment slots) must move together as one atomic unit — same
            page-break-inside: avoid mechanism as Section pproval below, so it can never
            end up with its header on one page and its details on the next. */}
        <View wrap={false}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>Payment Term (เงื่อนไขการจ่ายเงิน)</Text>
          </View>
          <View style={styles.paymentBox}>
            <View style={styles.infoRow}>
              <View style={styles.infoHalf}>
                <Text style={styles.fieldLabel}>Total Net Price :</Text>
                <Text style={styles.fieldValue}>{data.totalNetPrice}</Text>
              </View>
              <View style={styles.infoHalf}>
                <Text style={styles.fieldLabel}>Vat :</Text>
                <Text style={styles.fieldValue}>{data.vat}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoHalf}>
                <Text style={styles.fieldLabel}>Currency :</Text>
                <Text style={styles.fieldValue}>{data.currency}</Text>
              </View>
              <View style={styles.infoHalf}>
                <Text style={styles.fieldLabel}>Trade Term (Incoterm) :</Text>
                <Text style={styles.fieldValue}>{data.tradeTerm}</Text>
              </View>
            </View>
            <Text style={styles.installmentLabel}>
              Installment Payment (การจ่ายเงินแบ่งออกเป็นกี่งวด โปรดระบุรายละเอียดเงื่อนไขและความสำเร็จในแต่ละงวดงานให้ชัดเจน):
            </Text>
            <View style={styles.installmentGrid}>
              {PAYMENT_LABELS.map(([label, key]) => (
                <View key={key} style={styles.installmentCell}>
                  <Text style={styles.installmentLabelText}>{label}</Text>
                  <Text style={styles.installmentValueText}>{payments[key]}</Text>
                </View>
              ))}
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.fieldLabel}>Other (อื่นๆ เพิ่มเติม โปรดระบุ) :</Text>
              <Text style={styles.fieldValue}>{data.paymentOther}</Text>
            </View>
          </View>
        </View>

        {/* flexGrow: 1 — this section (Related Contract Document + Comment) is the row
            that absorbs whatever leftover space is on the page so Section pproval ends
            up flush with the bottom — see docSection's style comment.
            Deliberately NOT wrap={false} here, unlike Payment Term/Section pproval:
            those two always have a fixed, bounded content size (a set number of fields/
            rows) that's guaranteed to fit on one page, so "never split" is always
            honorable. This section's comments list has no upper bound — tested with 40
            long comments and confirmed react-pdf has no graceful fallback for a
            wrap={false} node whose content is taller than a full page: it renders
            everything collapsed/overlapping instead of falling back to a normal split.
            Letting it wrap (react-pdf's default) is what keeps arbitrarily-long comment
            lists safe — the section still never splits in the common case where it
            fits, since flexGrow only ever expands it, never shrinks it below its content. */}
        <View style={styles.docSection}>
          <View style={styles.twoColHeaderRow}>
            <View style={styles.docColHeader}>
              <Text style={styles.sectionHeaderText}>Related Contract Document{'\n'}(เอกสารประกอบการพิจารณา)</Text>
            </View>
            <View style={styles.commentColHeader}>
              <Text style={styles.sectionHeaderText}>Requestor/Supervisor/LG/Others's Comment (If any)</Text>
            </View>
          </View>
          <View style={styles.twoColBox}>
            <View style={styles.docCol}>
              {DOCUMENT_ITEMS.map(item => (
                <Checkbox key={item.key} checked={!!documents[item.key]?.checked} label={item.label} />
              ))}
            </View>
            <View style={styles.commentCol}>
              {comments.length === 0 ? (
                <Text style={styles.commentLine}>-</Text>
              ) : (
                comments.map((comment, index) => (
                  <View key={index} style={styles.commentEntry}>
                    <Text style={styles.commentText}>{comment.comment}</Text>
                    <Text style={styles.commentMeta}>
                      {[comment.role, comment.name].filter(Boolean).join(' - ')} {formatDateTimeSlash(comment.createdAt)}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </View>
        </View>

        <View style={styles.cautionBox}>
          <Text style={styles.cautionEn}>CAUTION : Do not submit the contract for signature before Purchase Order (PO), if any, has been officially issued.</Text>
          <Text style={styles.cautionTh}>ข้อควรระวัง : ห้ามไม่ให้เสนอลงนามสัญญาก่อนรับอนุมัติให้จัดซื้อจัดจ้างภายในบริษัทโดยออกใบสั่งซื้อ (ถ้ามี) เรียบร้อยแล้ว</Text>
        </View>

        {/* wrap={false}: this entire Section pproval block (header + requestor/section
            row + approver table) must move together as one atomic unit — if it doesn't
            fit in whatever space is left on the current page, react-pdf pushes the
            WHOLE thing onto a new page instead of splitting it mid-section (the
            page-break-inside: avoid equivalent for this library). No manual page-break
            math needed: this is what actually guarantees requirement #6 (never split
            across 2 pages) regardless of how long the content above ends up being. */}
        <View wrap={false}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>Section pproval (การอนุมัติภายในแผนก)</Text>
          </View>
          <View style={styles.approvalMetaRow}>
            <View style={styles.infoHalf}>
              <Text style={styles.fieldLabel}>Requestor Name:</Text>
              <Text style={styles.fieldValue}>{data.requestorName}</Text>
            </View>
            <View style={styles.infoHalf}>
              <Text style={styles.fieldLabel}>Section:</Text>
              <Text style={styles.fieldValue}>{data.requestorSection}</Text>
            </View>
          </View>

          <View style={styles.approverTable}>
            <View style={styles.approverLabelCol}>
              <Text style={styles.approverLabelText}>Approver{'\n'}(ผู้อนุมัติ)</Text>
            </View>
            <View style={styles.approverBody}>
              {APPROVER_ROWS.map((row, rowIndex) => {
                const signature = approverSignatures[row.signatureIndex];
                const noTopBorder = rowIndex === 0 ? { borderTopWidth: 0 } : null;
                return (
                  <View key={rowIndex} style={styles.approverRow}>
                    <View style={[styles.approverRoleCell, noTopBorder]}>
                      <Text style={{ fontSize: 8, textAlign: 'center' }}>{row.role}</Text>
                    </View>
                    <View style={[styles.approverSignCell, noTopBorder]}>
                      {signature?.name ? (
                        <>
                          <Text style={{ fontSize: 8, textAlign: 'center' }}>{signature.name}</Text>
                          <Text style={{ fontSize: 7, textAlign: 'center', color: '#555555' }}>{formatDateSlash(signature.approvedAt)}</Text>
                        </>
                      ) : (
                        <Text style={{ fontSize: 8, textAlign: 'center' }}>-</Text>
                      )}
                    </View>
                    <View style={styles.approverRemarkCell}>
                      {REMARK_ITEMS.slice(rowIndex * 2, rowIndex * 2 + 2).map(item => (
                        <Checkbox key={item.key} checked={data.remark === item.key} label={item.label} />
                      ))}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* fixed: renders at this same absolute position on every page react-pdf ends
            up generating (see the "reserved paddingBottom" note on styles.page above) —
            the render prop's (pageNumber, totalPages) args are supplied by react-pdf
            itself per page, already accounting for however many pages the document
            actually paginates into; nothing here is computed manually. */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerPageNumber} render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} />
          <Text style={styles.footerCode}>FOPI-S35-LEG-001-001-02 (1-Jun-2026)</Text>
        </View>
      </Page>
    </Document>
  );
}
