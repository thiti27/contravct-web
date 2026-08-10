import FieldShell from './FieldShell';

// Chrome renders native <input type="date"> using the browser's own locale (mm/dd/yyyy
// for en-US) and ignores the element's `lang` attribute — only Firefox honors it. The
// underlying value is always ISO (yyyy-mm-dd) regardless of display, so to guarantee a
// consistent yyyy-mm-dd look everywhere we make the native input's own text invisible and
// draw our own formatted text on top of it. The native input still handles all interaction
// (typing, the calendar picker icon, keyboard nav).
export default function DateField({ label, required, error, hint, value, ...props }) {
  return (
    <FieldShell label={label} required={required} error={error} hint={hint}>
      <div className="relative">
        <input
          type="date"
          value={value || ''}
          {...props}
          className={`h-11 w-full rounded-2xl border px-3 text-sm text-transparent outline-none transition-colors focus:bg-white focus:ring-4 ${
            error
              ? 'border-rose-300 bg-rose-50/40 focus:border-rose-400 focus:ring-rose-500/10'
              : 'border-slate-200 bg-slate-50 focus:border-brand-500 focus:ring-brand-500/10'
          }`}
        />
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm">
          {value ? <span className="text-slate-700">{value}</span> : <span className="text-slate-400">yyyy-mm-dd</span>}
        </span>
      </div>
    </FieldShell>
  );
}
