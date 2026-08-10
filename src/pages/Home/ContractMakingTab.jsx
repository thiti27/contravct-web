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
    />
  );
}
