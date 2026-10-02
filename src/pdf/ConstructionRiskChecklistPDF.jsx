import { Document, Page, View, Text, Font, StyleSheet } from '@react-pdf/renderer';
import { CONSTRUCTION_RISK_ITEMS, HIGH_RISK_REQUIREMENTS } from '../lib/constructionRiskChecklist';

// Same registered font/hyphenation setup as ContractRequisitionFormPDF.jsx — react-pdf
// can't use the CSS-loaded Google Font, only a registered font file, and Thai script
// needs the hyphenation callback disabled (see that file's own comment for why).
Font.register({
  family: 'Sarabun',
  fonts: [{ src: '/fonts/Sarabun-Regular.ttf' }, { src: '/fonts/Sarabun-Bold.ttf', fontWeight: 'bold' }],
});
Font.registerHyphenationCallback(word => [word]);

const BORDER = '#000000';
const GRAY = '#D9D9D9';
const AMBER = '#B45309';
const EMERALD = '#047857';
const RED = '#FF0000';
const LIGHT_RED = '#FEE2E2';
const BLUE = '#0000FF';

// Every criteria/description string in constructionRiskChecklist.js is English text
// then its Thai translation, line by line (\n-separated, sometimes several bullet
// lines per language for the longer items) — this is how the Excel source itself
// writes them, not a delimiter this file invents. Each \n-line becomes its own block
// (BilingualText below), and within a line, THAI_OR_HIGH_RISK_RE further tags which
// runs need their own color: a Thai-script run (used everywhere Thai text appears,
// including a line that mixes both languages in one sentence, like the HIGH RISK
// requirements title/lines) goes blue, and the literal phrase "HIGH RISK" goes red
// wherever it occurs — react-pdf renders a <Text> nested inside another <Text> as an
// inline span sharing the same line/wrap, unlike a <Text> under a <View> (always its
// own block), which is what lets a single line mix plain, blue and red runs.
const THAI_CHARS = /[฀-๿]/;
const THAI_OR_HIGH_RISK_RE = /(HIGH RISK|[฀-๿]+)/g;

function BilingualLine({ line, style }) {
  const segments = line.split(THAI_OR_HIGH_RISK_RE).filter(seg => seg !== '');
  return (
    <Text style={style}>
      {segments.map((seg, i) => {
        if (seg === 'HIGH RISK') return (
          <Text key={i} style={{ color: RED }}>
            {seg}
          </Text>
        );
        if (THAI_CHARS.test(seg)) return (
          <Text key={i} style={{ color: BLUE }}>
            {seg}
          </Text>
        );
        return seg;
      })}
    </Text>
  );
}

function BilingualText({ text, style }) {
  return String(text || '')
    .split('\n')
    .map((line, i) => <BilingualLine key={i} line={line} style={style} />);
}

// ---------------------------------------------------------------------------
// Layout copied cell-for-cell from the real FOPI-S35-LEG-001-014 print (single A4
// portrait page — Construction Risk.pdf, inspected directly) rather than designed
// from scratch: title + CONFIDENTIAL/DSST/DATE corner, a Supplier/Date/Assessor/
// Section/Remark info box, Classification line above the table, the 14-row table
// (Result/Score are the only cells that vary by selection — Low/High Description text
// itself is NOT re-colored or bolded when selected, same as the source), Total Score/
// Classification again below the table, and the HIGH RISK requirements notice printed
// unconditionally (it's boilerplate instructions on the form itself, not something
// that only appears when the result actually is HIGH RISK — confirmed on the
// reference PDF, which shows it despite being a LOW RISK example).
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  page: { fontFamily: 'Sarabun', fontSize: 6.5, paddingTop: 18, paddingLeft: 18, paddingRight: 18, paddingBottom: 22, color: '#000000' },
  footer: { position: 'absolute', bottom: 10, left: 18, right: 18 },
  footerCode: { fontSize: 6, color: '#444444', textAlign: 'right' },

  titleRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  titleSpacer: { width: 90 },
  titleBox: { flex: 1, alignItems: 'center' },
  titleText: { fontWeight: 'bold', fontSize: 11 },
  titleSubText: { fontSize: 8, marginTop: 1 },
  metaBox: { width: 90, alignItems: 'flex-end' },
  confidentialText: { fontWeight: 'bold', fontSize: 8, color: RED },
  metaLine: { flexDirection: 'row', marginTop: 1 },
  metaLabel: { fontSize: 6.5 },
  metaValue: { fontSize: 6.5, fontWeight: 'bold', marginLeft: 2, borderBottomWidth: 0.5, borderColor: BORDER, borderStyle: 'dotted', minWidth: 45, textAlign: 'center' },

  infoBox: { borderWidth: 1, borderColor: BORDER, padding: 4, marginBottom: 4 },
  infoRow: { flexDirection: 'row', marginBottom: 2, alignItems: 'flex-start' },
  infoHalf: { flex: 1, flexDirection: 'row' },
  fieldLabel: { fontWeight: 'bold', fontSize: 7 },
  fieldValue: { flex: 1, fontSize: 7, marginLeft: 3, borderBottomWidth: 0.5, borderColor: BORDER },
  noteLabel: { fontWeight: 'bold', fontSize: 7 },
  noteValue: { fontSize: 7, marginLeft: 3, borderBottomWidth: 0.5, borderColor: BORDER, minHeight: 10 },

  // D15's conditional notice (see proceedNotice below) sits on this same row, to the
  // left of Classification — space-between with nothing on the left (LOW RISK) still
  // leaves Classification flush right, same as before this row could hold two things.
  classificationLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  classificationLabelGroup: { flexDirection: 'row', alignItems: 'center' },
  classificationLabel: { fontWeight: 'bold', fontSize: 7.5, marginRight: 4 },
  classificationValue: { fontWeight: 'bold', fontSize: 8 },

  table: { borderWidth: 1, borderColor: BORDER },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: GRAY, borderBottomWidth: 1, borderColor: BORDER },
  tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderColor: BORDER },
  colNo: { width: 14, padding: 2, borderRightWidth: 0.5, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },
  // Wide enough (plus the criteria label's own reduced font below) that even the
  // longest Thai criteria labels never overflow into High Risk Description next to
  // them — most Thai labels here have no inter-word spaces for react-pdf's disabled-
  // hyphenation Text to break on (see the Font.registerHyphenationCallback note
  // above), so unlike English text they can't fall back to breaking mid-phrase.
  colCriteria: { width: 115, padding: 2, borderRightWidth: 0.5, borderColor: BORDER },
  colDesc: { flex: 1, padding: 2, borderRightWidth: 0.5, borderColor: BORDER },
  colResult: { width: 34, padding: 2, borderRightWidth: 0.5, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },
  colScore: { width: 20, padding: 2, alignItems: 'center', justifyContent: 'center' },
  headerCellText: { fontSize: 6.5, fontWeight: 'bold', textAlign: 'center' },
  criteriaText: { fontSize: 6, fontWeight: 'bold' },
  descText: { fontSize: 6 },
  resultText: { fontSize: 6.5, fontWeight: 'bold', textAlign: 'center' },
  scoreText: { fontSize: 6.5, fontWeight: 'bold', textAlign: 'center' },

  totalsBox: { alignItems: 'flex-end', marginTop: 4, marginBottom: 4 },
  totalsLine: { flexDirection: 'row', fontSize: 7.5 },
  totalsLabel: { fontWeight: 'bold' },
  totalsValue: { fontWeight: 'bold', marginLeft: 4 },

  // D15 in the source Excel: =IF(M15="HIGH RISK", "Please proceed...", "") — sits on
  // the classificationLine row (above the table, left of Classification), solid red
  // (not the usual bilingual blue/red split — the whole line is red here), only
  // printed when the classification actually is HIGH RISK. Unlike requirementsBox
  // further down (that box's own boilerplate list is unconditional — see its own comment).
  proceedNotice: { fontSize: 7, fontWeight: 'bold', color: RED, flexShrink: 1, marginRight: 6 },
  requirementsBox: { borderWidth: 1, borderColor: BORDER, backgroundColor: LIGHT_RED, padding: 4 },
  requirementsTitle: { fontSize: 7, fontWeight: 'bold', marginBottom: 2 },
  requirementsItem: { fontSize: 6.5, marginBottom: 1 },
});

function formatDateSlash(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const pad = n => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

// Renders the completed Construction Risk Classification Checklist (FOPI-S35-LEG-001-
// 014, see src/lib/constructionRiskChecklist.js) as a standalone PDF report — the
// Drafted/Signed zip download's own record of the assessment that decided this
// contract's Purpose, included whenever data.constructionRiskAnswers is present (i.e.
// this contract actually went through the popup — see downloadDraftedContractZip.js/
// downloadSignedContractZip.js). `snapshot` is exactly the shape
// ConstructionRiskModal.jsx's onConfirm hands to contractPurpose/constructionRiskAnswers:
// { supplierName, date, assessorName, section, note, totalScore, classification,
//   rows: [{no, criteria, low, high, selected, score}] }. `contractNo`/`approvedDate`
// are the contract's own DSST:/DATE: (this contract's minted number and Approver 3's
// sign-off date) — same fields ContractRequisitionFormPDF.jsx's own metaBox uses, not
// the date the assessment itself was filled in (that's snapshot.date, shown in the
// info box below).
// Falls back to the static CONSTRUCTION_RISK_ITEMS text for criteria/low/high whenever
// an older snapshot doesn't carry its own copy, so a contract assessed before this
// still prints a complete table instead of blank description cells.
// `supplierName`/`confidential` are read live off contract_requests (data.supplierName/
// data.confidentiality) rather than snapshot.supplierName — the assessment could have
// been done before a later edit changed the supplier name or confidentiality, and this
// report should always reflect the contract as it stands now, not as it stood at
// assessment time.
export default function ConstructionRiskChecklistPDF({ snapshot, contractNo, approvedDate, supplierName, confidential }) {
  const rows = (snapshot.rows || []).map(row => {
    const fallback = CONSTRUCTION_RISK_ITEMS.find(item => item.no === row.no);
    return {
      no: row.no,
      criteria: row.criteria || fallback?.criteria || '',
      low: row.low || fallback?.low || '',
      high: row.high || fallback?.high || '',
      selected: row.selected,
      score: row.score,
    };
  });
  const isHigh = snapshot.classification === 'HIGH RISK';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.titleRow}>
          <View style={styles.titleSpacer} />
          <View style={styles.titleBox}>
            <Text style={styles.titleText}>Construction Risk Classification Checklist</Text>
            <Text style={styles.titleSubText}>(แบบตรวจสอบและจัดระดับความเสี่ยงงานก่อสร้าง)</Text>
          </View>
          <View style={styles.metaBox}>
            <Text style={styles.confidentialText}>{confidential ? 'HIGH CONFIDENTIAL' : 'CONFIDENTIAL'}</Text>
            <View style={styles.metaLine}>
              <Text style={styles.metaLabel}>DSST:</Text>
              <Text style={styles.metaValue}>{contractNo || '-'}</Text>
            </View>
            <View style={styles.metaLine}>
              <Text style={styles.metaLabel}>DATE:</Text>
              <Text style={styles.metaValue}>{formatDateSlash(approvedDate) || '-'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <View style={styles.infoHalf}>
              <Text style={styles.fieldLabel}>Supplier Name :</Text>
              <Text style={styles.fieldValue}>{supplierName || ''}</Text>
            </View>
            <View style={styles.infoHalf}>
              <Text style={styles.fieldLabel}>Date :</Text>
              <Text style={styles.fieldValue}>{formatDateSlash(snapshot.date)}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoHalf}>
              <Text style={styles.fieldLabel}>Assessor/Requestor Name:</Text>
              <Text style={styles.fieldValue}>{snapshot.assessorName || ''}</Text>
            </View>
            <View style={styles.infoHalf}>
              <Text style={styles.fieldLabel}>Section:</Text>
              <Text style={styles.fieldValue}>{snapshot.section || ''}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.noteLabel}>
              Remark/Note for Checklist/More Details (หมายเหตุ หรือรายละเอียดเพิ่มเติมเกี่ยวกับการประเมินความเสี่ยงนี้)
            </Text>
          </View>
          <Text style={styles.noteValue}>{snapshot.note || ''}</Text>
        </View>

        <View style={styles.classificationLine}>
          {isHigh ? (
            <Text style={styles.proceedNotice}>
              Please proceed in accordance with the requirements specified below กรุณาดำเนินการตามเงื่อนไขที่ระบุไว้ด้านล่าง
            </Text>
          ) : (
            <View />
          )}
          <View style={styles.classificationLabelGroup}>
            <Text style={styles.classificationLabel}>Classification</Text>
            <Text style={[styles.classificationValue, { color: isHigh ? AMBER : EMERALD }]}>{snapshot.classification}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <View style={styles.colNo}>
              <Text style={styles.headerCellText}>No</Text>
            </View>
            <View style={styles.colCriteria}>
              <Text style={styles.headerCellText}>Criteria</Text>
            </View>
            <View style={styles.colDesc}>
              <Text style={styles.headerCellText}>Low Risk Description</Text>
            </View>
            <View style={styles.colDesc}>
              <Text style={styles.headerCellText}>High Risk Description</Text>
            </View>
            <View style={styles.colResult}>
              <Text style={styles.headerCellText}>Result</Text>
            </View>
            <View style={styles.colScore}>
              <Text style={styles.headerCellText}>Score</Text>
            </View>
          </View>
          {rows.map(row => (
            <View key={row.no} style={styles.tableRow} wrap={false}>
              <View style={styles.colNo}>
                <Text style={styles.scoreText}>{row.no}</Text>
              </View>
              <View style={styles.colCriteria}>
                <BilingualText text={row.criteria} style={styles.criteriaText} />
              </View>
              <View style={styles.colDesc}>
                <BilingualText text={row.low} style={styles.descText} />
              </View>
              <View style={styles.colDesc}>
                <BilingualText text={row.high} style={styles.descText} />
              </View>
              <View style={styles.colResult}>
                <Text style={[styles.resultText, { color: row.selected === 'high' ? AMBER : row.selected === 'low' ? EMERALD : '#999999' }]}>
                  {row.selected === 'high' ? 'High Risk' : row.selected === 'low' ? 'Low Risk' : '-'}
                </Text>
              </View>
              <View style={styles.colScore}>
                <Text style={styles.scoreText}>{row.score}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.totalsBox}>
          <Text style={styles.totalsLine}>
            <Text style={styles.totalsLabel}>Total Score (คะแนนรวม)</Text>
            <Text style={styles.totalsValue}>{snapshot.totalScore}</Text>
          </Text>
          <Text style={styles.totalsLine}>
            <Text style={styles.totalsLabel}>Classification (ระดับความเสี่ยงของสัญญานี้)</Text>
            <Text style={[styles.totalsValue, { color: isHigh ? AMBER : EMERALD }]}>{snapshot.classification}</Text>
          </Text>
        </View>

        {/* Printed on the form unconditionally — this is the checklist's own standard
            instructions for what to do IF the result comes out HIGH RISK, not
            something that only appears when it actually does (confirmed against the
            reference PDF, which shows it even on a LOW RISK example). */}
        <View style={styles.requirementsBox}>
          <BilingualText
            text="Result is HIGH RISK, please follow these requirements: (กรณีผลการประเมิน คือ HIGH RISK ให้ปฏิบัติดังนี้)"
            style={styles.requirementsTitle}
          />
          {HIGH_RISK_REQUIREMENTS.map((text, i) => (
            <BilingualText key={i} text={`${i + 1}. ${text}`} style={styles.requirementsItem} />
          ))}
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerCode}>FOPI-S35-LEG-001-014-00(20-Sep-2026)</Text>
        </View>
      </Page>
    </Document>
  );
}
