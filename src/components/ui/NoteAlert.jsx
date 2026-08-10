import { Info } from 'lucide-react';

// Yellow note/alert banner — e.g. the upload-instructions hint under a file picker.
export default function NoteAlert({ children }) {
  return (
    <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-700">
      <Info size={17} className="mt-0.5 shrink-0" />
      <p>{children}</p>
    </div>
  );
}
