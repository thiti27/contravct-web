// Strips a revision suffix (e.g. "DSST01-2026-01" -> "DSST01-2026") so a "Refer to
// Contract No." always points at the base contract, never at one specific revision of
// it. The server's generateContractNo (approvalController.js) keys the
// contract_revision_sequences counter off this value directly — passing it an
// already-revisioned number would nest revisions ("DSST01-2026-01-01") instead of
// continuing the same counter for the base contract ("DSST01-2026-02").
export function normalizeReferContractNo(contractNo) {
  const match = /^(DSST\d+-\d{4})-\d{2}$/.exec(contractNo || '');
  return match ? match[1] : contractNo || '';
}
