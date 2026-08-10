import Select from 'react-select';

const ALL_OPTION = { value: '', label: 'All' };

export default function SelectField({ label, value, onChange, options, className = 'block' }) {
  const opts = options.map(o => (typeof o === 'string' ? { value: o, label: o } : o));

  return (
    <label className={className}>
      <span className="mb-2 block text-xs font-semibold tracking-wide text-slate-500">{label}</span>
      <Select
        classNamePrefix="rs"
        isSearchable={false}
        value={opts.find(o => o.value === value) || ALL_OPTION}
        onChange={option => onChange(option.value)}
        options={[ALL_OPTION, ...opts]}
      />
    </label>
  );
}
