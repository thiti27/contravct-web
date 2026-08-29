import ContractListPage from '../../components/contracts/ContractListPage';
import { ALL_JOB_STATUSES } from '../../lib/statusGroups';

export default function AllJobTab() {
  return (
    <ContractListPage
      title="ALL JOB"
      subtitle="งานสัญญาทั้งหมดในระบบ"
      statusScope={ALL_JOB_STATUSES}
      enableEdit
      showStatus
      // Related Contract Document (Specification/Drawing/Plan) is masked and locked down
      // for anyone viewing a job here who isn't its creator or one of its 3 approvers, or
      // who lacks the `view` permission — see EditRequestModal.jsx/DocumentsSection.jsx.
      enforceFilePermission
      // Header-only: Edit modal always reads "Edit Contract", centered, regardless of
      // the row's status/contractNo/remark — see EditRequestModal.jsx's titleOverride.
      editModalTitle="Edit Contract"
      // HIGH CONFIDENTIAL rows stay fully accessible (View/Download, not disabled) when
      // the viewer is this job's creator, holds `view`, or is one of its 3 approvers —
      // see ContractTable.jsx's checkJobPermission and lib/confidentialAccess.js.
      checkJobPermission
    />
  );
}
