import ContractListPage from '../../components/contracts/ContractListPage';
import { ALL_JOB_STATUSES } from '../../lib/statusGroups';

export default function AllJobTab() {
  return <ContractListPage title="ALL JOB" subtitle="งานสัญญาทั้งหมดในระบบ" statusScope={ALL_JOB_STATUSES} enableEdit showStatus />;
}
