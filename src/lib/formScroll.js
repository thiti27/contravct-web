// Scrolls to the first field a validate() call flagged as invalid. Relies on
// FieldShell stamping `data-field={name}` on every labeled field (see FieldShell.jsx) —
// works for plain inputs and react-select-based fields alike, since it targets the
// wrapping label rather than any particular input implementation.
export function scrollToField(name) {
  if (!name) return;
  const el = document.querySelector(`[data-field="${name}"]`);
  el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Runs formik's validation explicitly instead of going through submitForm's internal
// validate-then-touch-then-maybe-submit chain, which gives no hook to react to a
// failed validation — clicking Send Request with required fields still empty used to
// just silently do nothing (errors were set, but nothing ever marked them touched in a
// way that scrolled them into view), which read as the button being broken. Returns
// true when the form is valid (caller proceeds); on failure it marks every errored
// field touched (so its message renders) and scrolls to the first one, then returns
// false so the caller stops there instead of submitting.
export async function validateAndScrollOnError(formik) {
  const errors = await formik.validateForm();
  const errorKeys = Object.keys(errors);
  if (!errorKeys.length) return true;

  formik.setTouched(
    { ...formik.touched, ...errorKeys.reduce((acc, key) => ({ ...acc, [key]: true }), {}) },
    false
  );
  scrollToField(errorKeys[0]);
  return false;
}
