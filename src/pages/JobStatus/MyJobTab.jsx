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
      // Header-only: Edit modal always shows a single centered "Edit" badge, regardless
      // of which row's status/remark was opened — see EditRequestModal.jsx's titleOverride.
      editModalTitle="Edit"
      // A row still in-flight (Saved, Waiting Approver *, Returned, ...) has nothing
      // meaningful to download yet — only Drafted/Signed rows offer it.
      restrictDownloadToFinal
      // My Job is scoped to the current user's own contracts — a Legal Comment action
      // here doesn't make sense even for a user who's also Legal.
      allowLegalComment={false}
    />
  );
}
