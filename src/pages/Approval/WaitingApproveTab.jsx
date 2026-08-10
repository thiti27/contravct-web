import ContractListPage from '../../components/contracts/ContractListPage';
import { APPROVAL_WAITING_STATUSES } from '../../lib/statusGroups';

export default function WaitingApproveTab() {
  return (
    <ContractListPage
      title="WAITING APPROVE"
      subtitle="รายการสัญญาที่รอการอนุมัติจากคุณ"
      statusScope={APPROVAL_WAITING_STATUSES}
      approvalMode
      showStatus
    />
  );
}
