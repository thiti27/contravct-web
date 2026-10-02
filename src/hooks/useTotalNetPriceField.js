import { formatThousands, normalizeThousands } from '../lib/formatNumber';

// Comma-grouping formatThousands rewrites the whole string on every keystroke, which
// (as a plain controlled input) would otherwise always snap the cursor to the end —
// fine when appending at the end, wrong the moment a comma shifts because a digit was
// inserted/deleted anywhere earlier in the number. Counts how many digits/dots sat
// before the cursor pre-format, then walks the freshly-formatted string to the
// position with that same count, and writes both the DOM value and the cursor
// synchronously (before React's own re-render) so the browser never sees a value
// change without an accompanying, correct selection range.
//
// Shared by PaymentTermSection's own Total Net Price field and ContractInfoSection's
// mirrored one (shown early, under Contract Purpose, for construction-risk types so
// the user doesn't have to scroll to Payment Term to unlock it) — both write the same
// `totalNetPrice` formik field, so editing either one keeps the other in sync.
export function useTotalNetPriceField(formik) {
  const { setFieldValue, handleBlur } = formik;

  const handleChange = e => {
    const input = e.target;
    const prevValue = input.value;
    const prevCursor = input.selectionStart ?? prevValue.length;
    const digitsBeforeCursor = prevValue.slice(0, prevCursor).replace(/[^\d.]/g, '').length;

    const formatted = formatThousands(prevValue);

    let seen = 0;
    let pos = 0;
    while (pos < formatted.length && seen < digitsBeforeCursor) {
      if (/[\d.]/.test(formatted[pos])) seen += 1;
      pos += 1;
    }

    input.value = formatted;
    input.setSelectionRange(pos, pos);
    setFieldValue('totalNetPrice', formatted);
  };

  const handleBlurNormalize = e => {
    setFieldValue('totalNetPrice', normalizeThousands(e.target.value));
    handleBlur(e);
  };

  return { handleChange, handleBlur: handleBlurNormalize };
}
