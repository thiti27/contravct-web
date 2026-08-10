import { Search, RotateCcw, Download } from 'lucide-react';
import SelectField from '../ui/SelectField';
import AlphabetBrowse from './AlphabetBrowse';

export const EMPTY_FILTERS = { supplier: '', contractNo: '', type: '', section: '', year: '', status: '', letter: '' };

export default function ContractFilters({
  filters,
  onChange,
  onClear,
  meta,
  showYear = false,
  statusOptions = null,
  showStatus = null,
  showSection = true,
  showBrowse = false,
  showExport = false,
}) {
  const set = (key, value) => onChange({ ...filters, [key]: value });
  const shouldShowStatus = showStatus ?? (statusOptions && statusOptions.length > 1);

  // Home (showBrowse) has more fields than any other screen, so its fields shrink to
  // fit (flex-1) rather than each claiming a fixed width — that's what lets Supplier/
  // Contract No./Type/Section/Year, plus Clear/Export, all share one row on a wide
  // enough screen. Every field (and the actions block) still wraps to its own row
  // once the viewport can't fit everything, same as any other screen — nothing forces
  // a single row past the point where it'd actually cramp.
  const fieldWidth = showBrowse
    ? 'w-full sm:w-[calc(50%-0.5rem)] lg:w-auto lg:min-w-0 lg:flex-1'
    : 'w-full sm:w-[calc(50%-0.5rem)] lg:w-48';

  const actions = (
    <>
      <button
        onClick={onClear}
        className="flex h-11 items-center gap-1.5 rounded-2xl px-3 text-sm font-medium text-slate-400 hover:text-slate-600"
      >
        <RotateCcw size={16} /> Clear
      </button>
      {showExport && (
        <button className="flex h-11 items-center gap-1.5 rounded-2xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700">
          <Download size={16} /> Export
        </button>
      )}
    </>
  );

  return (
    <section className="rounded-xl2 border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-end gap-3">
        <label className={`block ${fieldWidth} ${showBrowse ? 'lg:flex-[1.6]' : 'lg:w-72'}`}>
          <span className="mb-2 block text-xs font-semibold tracking-wide text-slate-500">SUPPLIER NAME</span>
          <div className="relative">
            <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={filters.supplier}
              onChange={e => set('supplier', e.target.value)}
              placeholder="ค้นหาชื่อ supplier..."
              className="h-11 w-full rounded-2xl border border-slate-200 pl-10 pr-3 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
            />
          </div>
        </label>

        <label className={`block ${fieldWidth}`}>
          <span className="mb-2 block text-xs font-semibold tracking-wide text-slate-500">CONTRACT NO.</span>
          <input
            value={filters.contractNo}
            onChange={e => set('contractNo', e.target.value)}
            placeholder="เลขที่สัญญา"
            className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
          />
        </label>

        <SelectField label="CONTRACT TYPE" value={filters.type} onChange={v => set('type', v)} options={meta.types || []} className={fieldWidth} />

        {shouldShowStatus && (
          <SelectField label="STATUS" value={filters.status} onChange={v => set('status', v)} options={statusOptions || []} className={fieldWidth} />
        )}

        {showSection && (
          <SelectField label="SECTION" value={filters.section} onChange={v => set('section', v)} options={meta.sections || []} className={fieldWidth} />
        )}

        {showYear && (
          <SelectField label="YEAR" value={filters.year} onChange={v => set('year', v)} options={meta.years || []} className={fieldWidth} />
        )}

        <div className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto">{actions}</div>
      </div>

      {showBrowse && <AlphabetBrowse value={filters.letter} onChange={v => set('letter', v)} />}
    </section>
  );
}
