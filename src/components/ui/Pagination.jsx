import { ChevronLeft, ChevronRight } from 'lucide-react';

function pageList(current, totalPages) {
  const pages = new Set([1, totalPages, current, current - 1, current + 1]);
  return [...pages].filter(p => p >= 1 && p <= totalPages).sort((a, b) => a - b);
}

export default function Pagination({ page, pageSize, total, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const pages = pageList(page, totalPages);

  return (
    <div className="flex flex-col items-center justify-between gap-3 rounded-xl2 border border-slate-200 bg-white px-5 py-4 shadow-card sm:flex-row">
      <span className="text-sm text-slate-500">
        แสดง <b className="font-semibold text-slate-700">{from}-{to}</b> จากทั้งหมด <b className="font-semibold text-slate-700">{total}</b> รายการ
      </span>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
        >
          <ChevronLeft size={16} />
        </button>

        {pages.map((p, i) => (
          <span key={p} className="flex items-center gap-1.5">
            {i > 0 && pages[i - 1] !== p - 1 && <span className="px-1 text-slate-300">…</span>}
            <button
              onClick={() => onPageChange(p)}
              className={`h-9 min-w-9 rounded-full px-3 text-sm font-semibold transition-colors ${
                p === page ? 'bg-brand-600 text-white shadow-soft' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {p}
            </button>
          </span>
        ))}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
