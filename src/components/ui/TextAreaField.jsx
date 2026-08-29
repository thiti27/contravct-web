import FieldShell from './FieldShell';

export default function TextAreaField({ label, required, error, hint, className = '', rows = 4, name, ...props }) {
  return (
    <FieldShell label={label} required={required} error={error} hint={hint} name={name}>
      <textarea
        rows={rows}
        name={name}
        {...props}
        className={`w-full resize-none rounded-2xl border p-3 text-sm text-slate-700 outline-none transition-colors focus:bg-white focus:ring-4 ${
          error
            ? 'border-rose-300 bg-rose-50/40 focus:border-rose-400 focus:ring-rose-500/10'
            : 'border-slate-200 bg-slate-50 focus:border-brand-500 focus:ring-brand-500/10'
        } ${className}`}
      />
    </FieldShell>
  );
}
