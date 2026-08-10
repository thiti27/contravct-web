export default function CheckboxField({ label, checked, onChange, disabled = false }) {
  return (
    <label className={`flex h-11 items-center gap-2 text-sm font-semibold text-slate-600 ${disabled ? 'opacity-60' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={e => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 disabled:cursor-not-allowed"
      />
      {label}
    </label>
  );
}
