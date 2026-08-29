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
      // The More icon is never disabled here — individual menu items still enforce
      // their own confidentiality/permission checks (see ContractTable.jsx).
      neverDisableMore
      // Header-only: Edit modal always reads "Edit Contract", centered, instead of
      // "Edit {Status} Contract" — see EditRequestModal.jsx's titleOverride.
      editModalTitle="Edit Contract"
    />
  );
}
