import ContractListPage from '../../components/contracts/ContractListPage';
import { CONTRACT_MAKING_STATUSES } from '../../lib/statusGroups';

export default function ContractMakingTab() {
  return (
    <ContractListPage
      // title="CONTRACT MAKING"
      // subtitle="สัญญาที่อยู่ระหว่างจัดทำและรออนุมัติ"
      statusScope={CONTRACT_MAKING_STATUSES}
      // Only this logged-in user's own requests — sends created_by=user.em_id to the
      // server (see ContractListPage.jsx), filtered with `c.created_by = :createdBy`
      // (contractController.js).
      scopeToCurrentUser
      showSection={false}
      enableEdit
      showStatus
      // Every row here is already this user's own — HIGH CONFIDENTIAL should never lock
      // out its own creator (see ContractTable.jsx's checkJobPermission).
      checkJobPermission
      // A Renew/Amend/Claim Note/Terminate child hides its own Type/Purpose here — the
      // master always shows its own — see ContractTable.jsx's hideChildType.
      hideChildType
    />
  );
}
