// System-wide standard for showing a confidential contract/request everywhere one is
// displayed (Contract No. cells, modal header badges, the New Request form's letterhead
// header, ...): the words "HIGH CONFIDENTIAL" are never shown at rest — only this small
// "!" mark, with the full classification surfacing as a native tooltip on hover.
// Self-contained on/off check (returns null when not confidential) so every caller can
// just render <ConfidentialMark confidentiality={row.confidentiality} /> unconditionally
// instead of each one repeating its own `confidentiality && <.../>` guard.
export default function ConfidentialMark({ confidentiality, className = '' }) {
  if (!confidentiality) return null;
  return (
    <span
      title="HIGH CONFIDENTIAL"
      aria-label="HIGH CONFIDENTIAL"
      className={`inline-flex shrink-0 cursor-default items-center font-sans text-sm font-extrabold leading-none text-rose-500 ${className}`}
    >
      !
    </span>
  );
}
