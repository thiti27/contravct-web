import ContractListPage from '../../components/contracts/ContractListPage';
import { MY_JOB_STATUSES } from '../../lib/statusGroups';

export default function MyJobTab() {
  return (
    <ContractListPage
      title="MY JOB"
      subtitle="งานสัญญาที่คุณสร้าง ติดตามสถานะและจัดการได้จากที่นี่"
      statusScope={MY_JOB_STATUSES}
      scopeToCurrentUser
      enableEdit
    />
  );
}
