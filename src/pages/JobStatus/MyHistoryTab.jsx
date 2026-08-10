import ContractListPage from '../../components/contracts/ContractListPage';
import { HISTORY_STATUSES } from '../../lib/statusGroups';

export default function MyHistoryTab() {
  return (
    <ContractListPage
      title="MY HISTORY"
      subtitle="ประวัติสัญญาที่ดำเนินการเสร็จสิ้นแล้ว"
      statusScope={HISTORY_STATUSES}
      // "My" History — only rows this logged-in user created, same as My Job.
      // Sends created_by=user.em_id to the server (see ContractListPage.jsx), which
      // filters with `c.created_by = :createdBy` (contractController.js).
      scopeToCurrentUser
      includeNoNeededForCurrentUser
      // 'No Needed' rows (see includeNoNeededForCurrentUser above) get an Edit action —
      // EDITABLE_STATUSES includes 'No Needed', and none of HISTORY_STATUSES overlaps
      // with it, so this has no effect on Active/Near Expiry/Rejected/Expired/Canceled rows.
      enableEdit
      // Rejected/Canceled rows get a read-only View action instead, opening the same
      // modal in mode="view" (Close-only footer, no edits possible).
      viewableStatuses={['Rejected', 'Canceled']}
      showStatus
    />
  );
}
