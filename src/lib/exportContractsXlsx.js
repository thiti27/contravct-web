import ExcelJS from 'exceljs';
import { exportContracts } from './api';
import { formatDateOnly } from './formatDate';
import { REMARK_LABELS } from '../components/ui/RemarkBadge';

const COLUMNS = [
  { header: 'No.', width: 6 },
  { header: 'YY/MM/DD', width: 12 },
  { header: 'Contract No.', width: 20 },
  { header: 'Supplier Name', width: 34 },
  { header: 'Contract Type', width: 16 },
  { header: 'Contract Purpose', width: 18 },
  { header: 'Remark', width: 16 },
  { header: 'Status', width: 14 },
  { header: 'Effective Date', width: 14 },
  { header: 'Expired Date', width: 14 },
  { header: 'Requestor', width: 20 },
  { header: 'Section', width: 16 },
];

const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };
const CANCEL_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
const THIN_BORDER = { style: 'thin', color: { argb: 'FFBFBFBF' } };

// Home's Export button — fetches every row matching the current filters (server-side,
// ignoring pagination entirely — see contractController.exportContracts) and builds an
// .xlsx client-side, entirely in the browser, same "no backend Excel dependency"
// direction the Contract Requisition Form PDF took earlier. `filters` is whatever
// ContractListPage already has on screen (supplier/contractNo/type/section/year/status/
// letter + statuses/hasContractNo/...) — the export must reflect exactly what's
// currently filtered, not just the current page.
export async function downloadContractsXlsx(filters) {
  // filters.statuses arrives as an array (see ContractListPage's queryFilters) — same
  // conversion useContracts.js does internally before its own fetchContracts call,
  // since the backend's WHERE-clause builder expects a comma-joined string.
  const { statuses, ...rest } = filters;
  const query = { ...rest, ...(statuses?.length ? { statuses: statuses.join(',') } : {}) };
  const { items } = await exportContracts(query);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Contract Summary');

  sheet.columns = COLUMNS.map(c => ({ width: c.width }));

  const titleRow = sheet.addRow(['Contract Summary']);
  titleRow.font = { bold: true, size: 12 };
  sheet.mergeCells(1, 1, 1, COLUMNS.length);

  const headerRow = sheet.addRow(COLUMNS.map(c => c.header));
  headerRow.eachCell(cell => {
    cell.font = { bold: true };
    cell.fill = HEADER_FILL;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = { top: THIN_BORDER, bottom: THIN_BORDER, left: THIN_BORDER, right: THIN_BORDER };
  });

  items.forEach((item, index) => {
    const row = sheet.addRow([
      index + 1,
      formatDateOnly(item.requestDate),
      item.contractNo || '',
      item.supplier || '',
      item.type || '',
      item.purpose || '',
      REMARK_LABELS[item.remark] || item.remark || '',
      item.status || '',
      formatDateOnly(item.effectiveDate),
      formatDateOnly(item.expiredDate),
      item.requestorName || '',
      item.section || '',
    ]);
    row.eachCell(cell => {
      cell.border = { top: THIN_BORDER, bottom: THIN_BORDER, left: THIN_BORDER, right: THIN_BORDER };
    });
    // Matches the reference design's highlight — a Cancel Contract row's Remark cell
    // stands out from the rest of the report the same way it does on screen (see
    // RemarkBadge's own rose tone for 'cancel').
    if (item.remark === 'cancel') {
      row.getCell(7).fill = CANCEL_FILL;
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = `Contract Summary ${formatDateOnly(new Date())}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(blobUrl);
}
