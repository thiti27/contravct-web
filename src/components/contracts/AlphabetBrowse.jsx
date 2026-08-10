const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function AlphabetBrowse({ value, onChange }) {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-5">
      <b className="mr-2 text-xs font-bold tracking-wide text-slate-400">BROWSE</b>
      {LETTERS.map(letter => (
        <button
          key={letter}
          onClick={() => onChange(value === letter ? '' : letter)}
          className={`h-9 w-9 rounded-xl border text-sm font-semibold transition-colors ${
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
