// Frontend UI gate for HIGH CONFIDENTIAL rows on All Job/Home (see ContractTable.jsx's
// checkJobPermission) — mirrors contract-server/helpers/contractRequestHelper.js's
// hasConfidentialAccess exactly (same 3 conditions, same string-compare/null-safety
// rules), since that's the actual enforcement point (this is only a UI convenience: a
// disabled button here doesn't stop someone hitting the API directly, the backend
// re-checks the same rule before returning contract detail or file bytes).
export function hasConfidentialAccess(contract, user) {
  if (!contract?.confidentiality) return true;
  const emId = user?.em_id != null ? String(user.em_id) : '';
  if (!emId) return false;
  if (String(contract.createdBy ?? '') === emId) return true;
  if (user?.view) return true;
  return [contract.approver1EmId, contract.approver2EmId, contract.approver3EmId].some(
    a => a != null && String(a) !== '' && String(a) === emId
  );
}
