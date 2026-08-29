import ContractListPage from '../../components/contracts/ContractListPage';
import { HISTORY_STATUSES } from '../../lib/statusGroups';

export default function MyHistoryTab() {
  return (
    <ContractListPage
      title="MY HISTORY"
      subtitle="ประวัติสัญญาที่ดำเนินการเสร็จสิ้นแล้ว"
      statusScope={HISTORY_STATUSES}
      // "My" History — only rows this logged-in user created, same as My Job. Sends
      // created_by=user.em_id to the server (see ContractListPage.jsx), which filters
      // with `c.created_by = :createdBy` (contractController.js) — applies to every
      // status here, including No Needed, so no separate per-status scoping is needed.
      scopeToCurrentUser
      // Every row here is done and read-only — View only (no Edit, no Renew/Amend/
      // Terminate/Cancel/Upload Sign/Legal Comment; enableEdit stays off on purpose so
      // ContractTable's status-driven actions for e.g. Signed rows don't leak in here).
      viewableStatuses={HISTORY_STATUSES}
      showStatus
    />
  );
}
