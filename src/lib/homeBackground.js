// One step darker than the "Stronger Shadow Depth" pick — brand-100 instead of
// brand-50 — because a flat brand-50 (#eef3ff) reads as barely-there next to plain
// white cards. Still a single flat Tailwind class shared by both HomeLayout.jsx and
// Header.jsx (on Home only), so the header and the page below it stay exactly the
// same color — "smooth"/seamless by construction, no fixed-attachment trick needed,
// the same reasoning every earlier option in this series relied on.
//
// Kept as this shared module (rather than inlining bg-brand-100 directly in
// HomeLayout.jsx and Header.jsx) so swapping the Home background again later is a
// one-file change, same as every earlier option in this series.
export const HOME_BG_STYLE = undefined;

export const HOME_BG_CLASS = 'bg-brand-100';
