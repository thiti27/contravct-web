import { useState } from 'react';
import FieldShell from './FieldShell';

// Chrome renders native <input type="date"> using the browser's own locale (mm/dd/yyyy
// for en-US) and ignores the element's `lang` attribute — only Firefox honors it. The
// underlying value is always ISO (yyyy-mm-dd) regardless of display, so to guarantee a
// consistent yyyy-mm-dd look at rest we draw our own formatted text on top of the native
// input. But hiding the native text unconditionally (text-transparent at all times) meant
// typing/selecting date segments gave zero visual feedback until the whole date became
// valid and `value` updated — the native digits were invisible on invisible background
// the entire time you were mid-edit. Only hide the native text (and show our overlay)
// while the field isn't focused; while focused, the browser's own segmented date text is
// visible so typing actually shows what you're typing.
export default function DateField({ label, required, error, hint, value, onFocus, onBlur, name, ...props }) {
  const [focused, setFocused] = useState(false);

  return (
    <FieldShell label={label} required={required} error={error} hint={hint} name={name}>
      <div className="relative">
        <input
          type="date"
          name={name}
          value={value || ''}
          onFocus={e => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={e => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...props}
          className={`h-11 w-full rounded-2xl border px-3 text-sm outline-none transition-colors focus:bg-white focus:ring-4 ${
            focused ? 'text-slate-700' : 'text-transparent'
          } ${
            error
              ? 'border-rose-300 bg-rose-50/40 focus:border-rose-400 focus:ring-rose-500/10'
              : 'border-slate-200 bg-slate-50 focus:border-brand-500 focus:ring-brand-500/10'
          }`}
        />
        {!focused && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm">
            {value ? <span className="text-slate-700">{value}</span> : <span className="text-slate-400">yyyy-mm-dd</span>}
          </span>
        )}
      </div>
    </FieldShell>
  );
}
