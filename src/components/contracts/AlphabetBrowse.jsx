const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function AlphabetBrowse({ value, onChange }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      {LETTERS.map(letter => (
        <button
          key={letter}
          onClick={() => onChange(value === letter ? '' : letter)}
          className={`h-7 w-7 rounded-lg border text-base font-semibold transition-colors ${
            value === letter
              ? 'border-brand-600 bg-brand-600 text-white'
              : 'border-slate-200 bg-white text-slate-600 shadow-sm hover:border-brand-300'
          }`}
        >
          {letter}
        </button>
      ))}
    </div>
  );
}
