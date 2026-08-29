// Live-formats a numeric input as the user types: groups the integer part with
// commas and caps the decimal part at 2 digits (e.g. "1234.5" -> "1,234.5").
export function formatThousands(rawValue) {
  if (rawValue == null) return '';

  let value = String(rawValue).replace(/[^\d.]/g, '');

  const firstDot = value.indexOf('.');
  if (firstDot !== -1) {
    value = value.slice(0, firstDot + 1) + value.slice(firstDot + 1).replace(/\./g, '');
  }

  let [integerPart, decimalPart] = value.split('.');
  integerPart = integerPart.replace(/^0+(?=\d)/, '');
  if (integerPart) integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (decimalPart !== undefined) decimalPart = decimalPart.slice(0, 2);

  return decimalPart !== undefined ? `${integerPart}.${decimalPart}` : integerPart;
}

// Strips the display formatting back to a plain numeric string before sending to the API.
export function parseThousands(formattedValue) {
  if (!formattedValue) return '';
  return String(formattedValue).replace(/,/g, '');
}

// Full `#,###.00` normalization — applied on blur, not on every keystroke: padding a
// missing decimal ("1000" -> "1000.00") or dropping a trailing "." while the user is
// still mid-edit would fight what they're actively typing (e.g. about to type
// "1000.50"). formatThousands above stays live-as-you-type; this is the "done editing,
// lock in the final display" pass.
export function normalizeThousands(rawValue) {
  const stripped = parseThousands(rawValue).trim();
  if (!stripped) return '';
  const num = Number(stripped);
  if (Number.isNaN(num)) return '';
  return formatThousands(num.toFixed(2));
}
