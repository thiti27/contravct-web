export default function RadioGroup({ label, required, error, options, value, onChange, name, disabled = false }) {
  return (
    <div>
      {label && (
        <span className="mb-2 block text-xs font-semibold tracking-wide text-slate-500">
          {label}
          {required && <span className="text-rose-500"> *</span>}
        </span>
      )}
      <div className="flex flex-col gap-2.5">
        {options.map(opt => (
          <label
            key={opt.value}
            className={`flex items-center gap-2 text-sm ${disabled ? 'cursor-not-allowed' : ''} ${
              value === opt.value ? 'font-bold text-brand-600' : 'text-slate-600'
            }`}
          >
            <input
              type="radio"
              name={name}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              disabled={disabled}
              className="h-4 w-4 border-slate-300 text-brand-600 focus:ring-brand-500 disabled:cursor-not-allowed"
            />
            {opt.label}
          </label>
        ))}
      </div>
      {error && <p className="mt-1 text-xs font-medium text-rose-500">{error}</p>}
    </div>
  );
}
