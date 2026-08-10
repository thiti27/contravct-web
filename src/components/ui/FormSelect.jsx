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
  placeholder = 'เลือก...',
}) {
  const opts = options.map(o => (typeof o === 'string' ? { value: o, label: o } : o));

  return (
    <FieldShell label={label} required={required} error={error} hint={hint}>
      <div className={error ? 'field-error' : ''}>
        <Select
          classNamePrefix="rs"
          isSearchable={false}
          isClearable={isClearable}
          isDisabled={isDisabled}
          placeholder={placeholder}
          value={opts.find(o => o.value === value) ?? null}
          onChange={option => onChange(option ? option.value : '')}
          options={opts}
          menuPortalTarget={document.body}
          maxMenuHeight={190}
          styles={{ menuPortal: base => ({ ...base, zIndex: 60 }) }}
        />
      </div>
    </FieldShell>
  );
}
