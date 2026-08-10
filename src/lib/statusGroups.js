// Central definition of which contract statuses belong to which screen.
// Keep this in sync with the grouping logic in contract-server/server.js
// so nav badge counts match what each screen actually lists.

export const CONTRACT_MAKING_STATUSES = ['Saved', 'Waiting Approver 1', 'Waiting Approver 2', 'Waiting Approver 3', 'Returned'];
export const UPLOAD_CONTRACT_STATUSES = ['Drafted'];
export const LEGAL_WAITING_STATUSES = ['Waiting Legal Check'];
// Legal > Waiting's actual scope (see contract-server/server.js's LEGAL_REVIEW_STATUSES) —
// kept distinct from LEGAL_WAITING_STATUSES above, which still feeds MY_JOB_STATUSES.
export const LEGAL_REVIEW_STATUSES = ['Drafted', 'Signed'];
export const HISTORY_STATUSES = ['Active', 'Near Expiry', 'Rejected', 'Expired', 'Canceled'];

export const MY_JOB_STATUSES = [...CONTRACT_MAKING_STATUSES, ...UPLOAD_CONTRACT_STATUSES, ...LEGAL_WAITING_STATUSES];
export const APPROVAL_WAITING_STATUSES = CONTRACT_MAKING_STATUSES.filter(status => status.startsWith('Waiting Approver'));
// All Job's scope: every request still in progress (not yet Active/Rejected/Expired/
// Canceled/Terminated, and not still a private Saved draft).
export const ALL_JOB_STATUSES = ['Waiting Approver 1', 'Waiting Approver 2', 'Waiting Approver 3', 'Returned', 'Drafted'];

// Statuses for which the "more" menu on a contract row offers an Edit action,
// opening the New-Request-style modal pre-filled from that row. 'No Needed' (legal
// decided review isn't required) is included on its own — it isn't part of any other
// scope's grouping above, but the row's data should still be correctable.
export const EDITABLE_STATUSES = [...CONTRACT_MAKING_STATUSES, ...UPLOAD_CONTRACT_STATUSES, 'No Needed'];
