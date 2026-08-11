import Select from 'react-select';
import FieldShell from './FieldShell';

// Plain-value select for form fields (no "All" option, unlike the filter SelectField).
export default function FormSelect({
  label,
  required,
  error,
  hint,
  options,
  value,
  onChange,
  isClearable = false,
  isDisabled = false,
  isSearchable = false,
  // ~3 options tall by default (react-select's default option row is ~38px) — callers
  // with long lists (e.g. Reminder Before Expiry) pass a smaller value than the default
  // 190 so the menu visibly scrolls after a few items instead of growing to fit them all.
  maxMenuHeight = 190,
  placeholder = 'เลือก...',
}) {
  const opts = options.map(o => (typeof o === 'string' ? { value: o, label: o } : o));

  return (
    <FieldShell label={label} required={required} error={error} hint={hint}>
      <div className={error ? 'field-error' : ''}>
        <Select
          classNamePrefix="rs"
          isSearchable={isSearchable}
          isClearable={isClearable}
          isDisabled={isDisabled}
          placeholder={placeholder}
          value={opts.find(o => o.value === value) ?? null}
          onChange={option => onChange(option ? option.value : '')}
          options={opts}
          menuPortalTarget={document.body}
          maxMenuHeight={maxMenuHeight}
          styles={{ menuPortal: base => ({ ...base, zIndex: 60 }) }}
        />
      </div>
    </FieldShell>
  );
}
