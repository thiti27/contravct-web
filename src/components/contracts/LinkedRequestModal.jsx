import { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import { Save, Send, X } from 'lucide-react';
import FormModal from '../ui/FormModal';
import ConfirmModal from '../ui/ConfirmModal';
import WaitingModal from '../ui/WaitingModal';
import ResultModal from '../ui/ResultModal';
import NewRequestHeader from '../../pages/NewRequest/NewRequestHeader';
import ContractInfoSection from '../../pages/NewRequest/sections/ContractInfoSection';
import CommentSection from '../../pages/NewRequest/sections/CommentSection';
import ApprovalSection from '../../pages/NewRequest/sections/ApprovalSection';
import ActionInfoSection from './ActionInfoSection';
import { REMARK_LABELS } from '../ui/RemarkBadge';
import { useAuth } from '../../context/AuthContext';
import { fetchContractTypes, fetchContractRequest, submitContractRequest } from '../../lib/api';
import { parseThousands } from '../../lib/formatNumber';
import { buildInitialValues, buildInitialValuesFromMaster, validateLinkedRequest } from '../../pages/NewRequest/formConfig';
import { validateAndScrollOnError } from '../../lib/formScroll';

const CONFIRM_MESSAGE = {
  draft: 'Save this contract request as a draft?',
  submitted: 'Submit this contract request for approval?',
};

const RESULT_MESSAGE = {
  draft: 'Your draft has been saved successfully.',
  submitted: 'Your contract request has been submitted successfully.',
};

// Opened from a Signed row's More menu (Renew/Amend/Claim Note/Terminate) — creates a
// new, separate contract_requests row linked back to that row via referContractNo,
// going through the same draft/send-for-approval lifecycle as a brand new request.
// Contract Information is read-only (carried over from the master, fixed at creation);
// Payment Term/Documents aren't shown at all (also carried over from the master
// unedited, see buildInitialValuesFromMaster) since those don't change for a renewal/
// amendment/claim/termination — only the "___ Information" (background/detail/
// attachments), an optional comment, and who approves it do.
export default function LinkedRequestModal({ masterContract, remark, onClose, onSaved }) {
  const { user } = useAuth();
  const [contractTypes, setContractTypes] = useState([]);
  const [initialValues, setInitialValues] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [pendingSave, setPendingSave] = useState(null); // { status, values } | null
  // The master contract's own final-approval date — shown in the header's DATE field
  // as "which date this refers back to" (paired with NO: showing the master's contract
  // number), not this new request's own approval date (it has none yet).
  const [masterApprovedAt, setMasterApprovedAt] = useState('');

  useEffect(() => {
    if (!masterContract) return;
    setInitialValues(null);
    setLoadError(false);
    setMasterApprovedAt('');
    Promise.all([fetchContractTypes(), fetchContractRequest(masterContract.id)])
      .then(([types, masterData]) => {
        setContractTypes(types);
        setInitialValues(buildInitialValuesFromMaster(masterData, user, remark));
        // approverSignatures is reverse-order (index 0 = approver3, the final sign-off)
        // — same indexing ApprovalSection/NewRequestHeader use elsewhere.
        setMasterApprovedAt(masterData.approverSignatures?.[0]?.approvedAt || '');
      })
      .catch(() => setLoadError(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [masterContract?.id, remark]);

  const formik = useFormik({
    // Falls back to a fully-shaped empty form (not {}) even before the master data
    // loads — ApprovalSection's effect reads values.approvers unconditionally on mount,
    // and it can mount before enableReinitialize's own effect has swapped in the real
    // data (child effects run before this component's), so approvers must never be
    // undefined even for that first transient render.
    initialValues: initialValues || buildInitialValues(user),
    enableReinitialize: true,
    validate: validateLinkedRequest,
  });

  if (!masterContract) return null;

  const selectedTypeName = contractTypes.find(t => t.id === formik.values.contractTypeId)?.name || '';

  const handleSaveDraftClick = () => setPendingSave({ status: 'draft', values: formik.values });

  // Validates explicitly (rather than relying on formik.submitForm's internal, silent
  // validate-then-touch chain) so a failed Send Request scrolls to the first bad field
  // instead of doing nothing that looked like the button was broken.
  const handleSendRequestClick = async () => {
    if (await validateAndScrollOnError(formik)) setPendingSave({ status: 'submitted', values: formik.values });
  };

  const handleConfirmYes = async () => {
    const pending = pendingSave;
    setPendingSave(null);
    setSaving(true);
    try {
      await submitContractRequest({
        ...pending.values,
        status: pending.status,
        totalNetPrice: parseThousands(pending.values.totalNetPrice),
        emId: user?.em_id,
        updatedName: user?.name,
      });
      setResult({ variant: 'success', message: RESULT_MESSAGE[pending.status] });
    } catch (err) {
      setResult({ variant: 'error', message: err.response?.data?.message || 'Failed to save data. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleResultClose = () => {
    const wasSuccess = result?.variant === 'success';
    setResult(null);
    if (wasSuccess) {
      onSaved?.();
      onClose();
    }
  };

  const footer = initialValues && !loadError && (
    <>
      <button
        type="button"
        onClick={handleSaveDraftClick}
        disabled={saving}
        className="flex h-11 items-center gap-2 rounded-2xl border border-slate-200 px-6 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-60"
      >
        <Save size={16} /> Save Draft
      </button>
      <button
        type="button"
        onClick={handleSendRequestClick}
        disabled={saving}
        className="flex h-11 items-center gap-2 rounded-2xl bg-brand-600 px-6 text-sm font-semibold text-white shadow-soft hover:bg-brand-700 disabled:opacity-60"
      >
        <Send size={16} /> Send Request
      </button>
      <button
        type="button"
        onClick={onClose}
        disabled={saving}
        className="flex h-11 items-center gap-2 rounded-2xl border border-slate-200 px-6 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-60"
      >
        <X size={16} /> Cancel
      </button>
    </>
  );

  return (
    <>
      <FormModal
        open
        centerTitle
        title={`${REMARK_LABELS[remark] || remark}${masterContract.contractNo ? ` - ${masterContract.contractNo}` : ''}`}
        footer={footer}
        onClose={onClose}
        closeDisabled={saving}
      >
        {loadError && <div className="py-16 text-center text-rose-500">Failed to load contract data. Please try again.</div>}
        {!loadError && !initialValues && <div className="py-16 text-center text-slate-400">กำลังโหลดข้อมูล...</div>}
        {!loadError && initialValues && (
          <div className="divide-y-2 divide-slate-200 overflow-hidden rounded-xl2 border border-slate-200 bg-white shadow-card">
            {/* Same "Contract Requisition Form" header the Edit modal shows via
                RequestFormFields — this modal composes its sections directly instead of
                reusing RequestFormFields (only a subset of its sections apply here), so
                the header needs to be added explicitly too. NO: and DATE: both reference
                the master contract (its number and its final approval date) rather than
                staying blank — this new request doesn't have either of its own yet. */}
            <NewRequestHeader
              contractTypeLabel={selectedTypeName}
              confidential={formik.values.confidentiality}
              contractNo={masterContract.contractNo}
              approver3ApprovedAt={masterApprovedAt}
            />
            {/* Contract Information carries over from the master contract as read-only
                context for Renew/Amend/Claim Note/Terminate — only what's specific to
                this action (Background/Detail/attachments below, and who approves it)
                is actually editable here. */}
            <ContractInfoSection formik={formik} contractTypes={contractTypes} readOnly />
            <ActionInfoSection formik={formik} remark={remark} />
            {/* No `comments` list passed: this request doesn't exist yet, so there's no
                history to show — just the live textarea for a first optional comment. */}
            <CommentSection formik={formik} />
            <ApprovalSection formik={formik} highlight />
          </div>
        )}
      </FormModal>

      <ConfirmModal
        open={!!pendingSave}
        message={pendingSave ? CONFIRM_MESSAGE[pendingSave.status] : undefined}
        busy={saving}
        onConfirm={handleConfirmYes}
        onCancel={() => setPendingSave(null)}
      />
      <WaitingModal open={saving} />
      <ResultModal open={!!result} variant={result?.variant} message={result?.message} onClose={handleResultClose} />
    </>
  );
}
