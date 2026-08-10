// Shared label + required marker + error message wrapper for form fields.
export default function FieldShell({ label, required, error, hint, children }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-2 block text-xs font-semibold tracking-wide text-slate-500">
          {label}
          {required && <span className="text-rose-500"> *</span>}
        </span>
      )}
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      {error && <p className="mt-1 text-xs font-medium text-rose-500">{error}</p>}
    </label>
  );
}
