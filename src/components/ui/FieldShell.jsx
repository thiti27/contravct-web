// Shared label + required marker + error message wrapper for form fields.
export default function FieldShell({ label, required, error, hint, name, children }) {
  return (
    // data-field powers scrollToField (see lib/formScroll.js) — Send Request scrolls
    // here when this field fails validation, so every field needs it regardless of
    // whether it's a plain input or a react-select-based control underneath.
    <label className="block" data-field={name}>
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
