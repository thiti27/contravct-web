import ContractListPage from '../../components/contracts/ContractListPage';
import { FIND_CONTRACT_STATUSES } from '../../lib/statusGroups';

export default function FindContractTab() {
  return (
    <ContractListPage
      variant="browse"
      showYear
      showBrowse
      showExport
      requireContractNo
      enableEdit
      showStatus={false}
      // Filtered server-side (via GET /api/contracts?statuses=...) before it ever
      // reaches the table — Cancelled/Signed/Drafted/No Needed/Terminated only; every
      // in-flight Waiting*/Saved/Returned status is out of scope here.
      statusScope={FIND_CONTRACT_STATUSES}
      // HIGH CONFIDENTIAL rows stay fully accessible (View/Download, not disabled) when
      // the viewer is this job's creator, holds `view`, or is one of its 3 approvers —
      // see ContractTable.jsx's checkJobPermission and lib/confidentialAccess.js.
      checkJobPermission
      // A Renew/Amend/Claim Note/Terminate child hides its own Type/Purpose here — the
      // master always shows its own — see ContractTable.jsx's hideChildType.
      hideChildType
    />
  );
}
