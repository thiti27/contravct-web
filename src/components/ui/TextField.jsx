import FieldShell from './FieldShell';

export default function TextField({ label, required, error, hint, className = '', ...props }) {
  return (
    <FieldShell label={label} required={required} error={error} hint={hint}>
      <input
        {...props}
        className={`h-11 w-full rounded-2xl border px-3 text-sm text-slate-700 outline-none transition-colors focus:bg-white focus:ring-4 disabled:bg-slate-100 disabled:text-slate-400 ${
          error
            ? 'border-rose-300 bg-rose-50/40 focus:border-rose-400 focus:ring-rose-500/10'
            : 'border-slate-200 bg-slate-50 focus:border-brand-500 focus:ring-brand-500/10'
        } ${className}`}
      />
    </FieldShell>
  );
}
