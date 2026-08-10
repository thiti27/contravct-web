import { useEffect, useRef, useState } from 'react';
import { useFormik } from 'formik';
import { Save, Send, XCircle, X, CheckCircle2, RotateCcw, MessageSquare, ShieldCheck, Ban, MinusCircle } from 'lucide-react';
import FormModal from '../ui/FormModal';
import RemarkBadge from '../ui/RemarkBadge';
import ConfidentialBadge from '../ui/ConfidentialBadge';
import ConfirmModal from '../ui/ConfirmModal';
import WaitingModal from '../ui/WaitingModal';
import ResultModal from '../ui/ResultModal';
import RequestFormFields from './RequestFormFields';
import { useAuth } from '../../context/AuthContext';
import {
  fetchContractTypes,
  fetchContractRequest,
  updateContractRequest,
  approveContractRequest,
  returnContractRequest,
  rejectContractRequest,
  commentOnLegalRequest,
  checkLegalRequest,
  terminateLegalRequest,
  markNoNeedLegalRequest,
  cancelLegalRequest,
} from '../../lib/api';
import { parseThousands } from '../../lib/formatNumber';
import { buildInitialValues, validateRequest } from '../../pages/NewRequest/formConfig';

// Statuses where the footer is Save Change / Cancel / Close and the Comment field
// is required — editing an in-flight request needs a reason recorded either way.
// Only relevant in mode="edit"; mode="approve" always uses the Approve/Return/Reject
// footer regardless of which Waiting Approver stage the request is currently at.
// 'No Needed' belongs here too, not the Saved-style Save Draft/Send Request footer
// below it — that footer's actions reset status to 'Saved'/'Waiting Approver 1',
// which would incorrectly pull a No Needed row back into the approval workflow.
// Save Change leaves status untouched (see EDIT_ACTION_STATUS on the server), so
// editing a No Needed row's data can't do that.
const GROUP_A_STATUSES = ['Waiting Approver 1', 'Waiting Approver 2', 'Waiting Approver 3', 'Drafted', 'No Needed'];

// Actions whose footer button requires the Comment field to be filled before a
// confirm popup opens (red border + required message otherwise).
const COMMENT_REQUIRED_ACTIONS = ['save-change', 'cancel', 'return', 'reject', 'comment', 'terminate', 'legal-cancel'];

const CONFIRM_COPY = {
  'save-change': { title: 'Confirm Save Change', message: 'Save the changes made to this contract request?' },
  cancel: { title: 'Confirm Cancel Request', message: 'Cancel this contract request? This cannot be undone.' },
  'save-draft': { title: 'Confirm Save Draft', message: 'Save this contract request as a draft?' },
  'send-request': { title: 'Confirm Send Request', message: 'Submit this contract request for approval?' },
  approve: { title: 'Confirm Approval', message: 'Are you sure you want to approve this contract request?' },
  return: { title: 'Confirm Return', message: 'Are you sure you want to return this contract request?' },
  reject: { title: 'Confirm Rejection', message: 'Are you sure you want to reject this contract request?' },
  comment: { title: 'Confirm Comment', message: 'Are you sure you want to save this comment?' },
  check: { title: 'Confirm Legal Check', message: 'Are you sure you want to complete the legal review?' },
  terminate: { title: 'Confirm Terminate Contract', message: 'Are you sure you want to terminate this contract?' },
  'no-need': { title: 'Confirm No Need', message: 'Are you sure you want to mark this contract as No Need?' },
  'legal-cancel': { title: 'Confirm Cancel Contract', message: 'Are you sure you want to cancel this contract?' },
};

const RESULT_MESSAGE = {
  'save-change': 'Your changes have been saved successfully.',
  cancel: 'This contract request has been canceled.',
  'save-draft': 'Your draft has been saved successfully.',
  'send-request': 'Your contract request has been submitted successfully.',
  approve: 'The contract request has been approved successfully.',
  return: 'The contract request has been returned successfully.',
  reject: 'The contract request has been rejected successfully.',
  comment: 'Your comment has been saved successfully.',
  check: 'The legal review has been completed successfully.',
  terminate: 'This contract has been terminated successfully.',
  'no-need': 'This contract has been marked as No Need.',
  'legal-cancel': 'This contract has been canceled successfully.',
};

const APPROVAL_API = { approve: approveContractRequest, return: returnContractRequest, reject: rejectContractRequest };
const LEGAL_API = {
  comment: commentOnLegalRequest,
  check: checkLegalRequest,
  terminate: terminateLegalRequest,
  'no-need': markNoNeedLegalRequest,
  'legal-cancel': cancelLegalRequest,
};

// Modal header title, per mode.
const MODE_TITLES = {
  edit: 'Edit Request',
  approve: 'Approval',
  legal: 'Legal Review',
  'legal-history': 'Legal History',
  view: 'Approval History',
};

// Reused for both the My Job "Edit" action (mode="edit", the default) and the Waiting
// Approve "View" action (mode="approve") — same New Request form sections throughout,
// only the footer buttons/validation/API calls differ by mode (and, within mode="edit",
// by the request's current status — see GROUP_A_STATUSES above).
export default function EditRequestModal({ contractId, mode = 'edit', onClose, onSaved }) {
  const { user } = useAuth();
  const [contractTypes, setContractTypes] = useState([]);
  const [initialData, setInitialData] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [pendingAction, setPendingAction] = useState(null); // { action, values } | null
  const [commentAttempted, setCommentAttempted] = useState(false);
  const commentSectionRef = useRef(null);

  // Extracted so the Legal "Comment" action (which stays open and refreshes in
  // place instead of closing, see handleResultClose) can re-run it after saving.
  const loadContractData = () => {
    setLoadError(false);
    return Promise.all([fetchContractTypes(), fetchContractRequest(contractId)])
      .then(([types, data]) => {
        setContractTypes(types);
        setInitialData(data);
      })
      .catch(() => setLoadError(true));
  };

  useEffect(() => {
    if (!contractId) return;
    setInitialData(null);
    setCommentAttempted(false);
    loadContractData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractId]);

  const formik = useFormik({
    initialValues: initialData || buildInitialValues(user),
    enableReinitialize: true,
    validate: validateRequest,
    onSubmit: values => setPendingAction({ action: 'send-request', values }),
  });

  if (!contractId) return null;

  const isApproveMode = mode === 'approve';
  // mode="view" is Approval > My History's "View" action — same sections, read-only
  // throughout, footer is Close only (no Save/Approve/Return/Reject/Send/Cancel).
  const isReadOnlyMode = mode === 'view';
  // mode="legal" is Legal > Waiting's "View" action — fully editable (data, files,
  // comments) with a Check/Comment/Terminate/Close footer instead of the usual one.
  const isLegalMode = mode === 'legal';
  // mode="legal-history" is Legal > History's "View" action — read-only for the
  // contract itself (like mode="view"), but still allows Terminate (with a required
  // reason), so it gets its own Terminate/Close footer.
  const isLegalHistoryMode = mode === 'legal-history';
  const isEditMode = mode === 'edit';
  // All Job can open Edit on someone else's request — Drawing/Plan + Specification
  // become upload-only for non-owners there (see DocumentsSection). Every other mode
  // (approve/legal/legal-history/view) keeps full document access regardless of who
  // created the request, since those modes are inherently for non-owners to review.
  const isOwner = !isEditMode || !initialData || initialData.createdBy === user?.em_id;
  const isGroupA = isEditMode && GROUP_A_STATUSES.includes(initialData?.status);
  // Returned requests go back to the requestor for edits; footer is Send Request
  // (resubmits to Waiting Approver 1) / Cancel (requires a comment, like Group A) / Close.
  const isReturned = isEditMode && initialData?.status === 'Returned';
  // Whether *some* action in this mode/status could require a comment — drives the
  // static "required" asterisk on the field, independent of which button gets clicked.
  const commentRequiredDisplay = isApproveMode || isGroupA || isReturned || isLegalMode || isLegalHistoryMode;
  const commentMissing = commentRequiredDisplay && !formik.values.comment.trim();
  const commentError = commentAttempted && commentMissing ? 'This field is required.' : undefined;

  const guardComment = action => {
    if (COMMENT_REQUIRED_ACTIONS.includes(action) && !formik.values.comment.trim()) {
      setCommentAttempted(true);
      return false;
    }
    return true;
  };

  const openConfirm = action => setPendingAction({ action, values: formik.values });

  const handleSaveChangeClick = () => {
    commentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (guardComment('save-change')) openConfirm('save-change');
  };
  const handleCancelClick = () => {
    if ((isGroupA || isReturned) && !guardComment('cancel')) {
      commentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    openConfirm('cancel');
  };
  const handleSaveDraftClick = () => openConfirm('save-draft');

  const handleApproveClick = () => openConfirm('approve');
  const handleReturnOrRejectClick = action => {
    if (!guardComment(action)) {
      commentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    openConfirm(action);
  };

  // Check's comment is optional (guardComment only blocks 'comment'/'terminate'),
  // Comment and Terminate both require one — same scroll+red-border pattern as above.
  const handleCheckClick = () => openConfirm('check');
  // No Need has no comment requirement either — same simple pattern as Check.
  const handleNoNeedClick = () => openConfirm('no-need');
  const handleCommentClick = () => {
    if (!guardComment('comment')) {
      commentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    openConfirm('comment');
  };
  const handleTerminateClick = () => {
    if (!guardComment('terminate')) {
      commentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    openConfirm('terminate');
  };
  // Legal > Waiting's Cancel button (shown instead of Terminate while status =
  // 'Drafted') — same required-comment pattern, distinct action key from the
  // unrelated Edit-mode 'cancel' action above so their confirm/result copy don't collide.
  const handleLegalCancelClick = () => {
    if (!guardComment('legal-cancel')) {
      commentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    openConfirm('legal-cancel');
  };

  const handleConfirmYes = async () => {
    const pending = pendingAction;
    setSaving(true);
    try {
      const payload = {
        ...pending.values,
        totalNetPrice: parseThousands(pending.values.totalNetPrice),
        emId: user?.em_id,
        updatedName: user?.name,
        approverFirstName: user?.first_name,
        approverLastName: user?.last_name,
      };

      if (isApproveMode) {
        await APPROVAL_API[pending.action](contractId, payload);
      } else if (isLegalMode || isLegalHistoryMode) {
        await LEGAL_API[pending.action](contractId, payload);
      } else {
        await updateContractRequest(contractId, { ...payload, action: pending.action });
      }

      setPendingAction(null);
      setResult({
        variant: 'success',
        title: isApproveMode ? 'Completed' : undefined,
        message: RESULT_MESSAGE[pending.action],
      });
    } catch (err) {
      setPendingAction(null);
      setResult({ variant: 'error', message: err.response?.data?.message || 'Failed to save data. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleResultClose = () => {
    const wasSuccess = result?.variant === 'success';
    setResult(null);
    // A failed save leaves the modal open so the user can fix and retry — including
    // Legal's Comment action, which used to stay open even on success and refresh its
    // own data in place. It now closes and lets the Legal > Waiting table refresh via
    // onSaved, same as every other action in this modal.
    if (wasSuccess) {
      onSaved?.();
      onClose();
    }
  };

  const footer = initialData && !loadError && (
    <>
      {isReadOnlyMode ? null : isApproveMode ? (
        <>
          <button
            type="button"
            onClick={handleApproveClick}
            disabled={saving}
            className="flex h-11 items-center gap-2 rounded-2xl bg-brand-600 px-6 text-sm font-semibold text-white shadow-soft hover:bg-brand-700 disabled:opacity-60"
          >
            <CheckCircle2 size={16} /> Approve
          </button>
          <button
            type="button"
            onClick={() => handleReturnOrRejectClick('return')}
            disabled={saving}
            className="flex h-11 items-center gap-2 rounded-2xl border border-amber-200 px-6 text-sm font-semibold text-amber-600 hover:bg-amber-50 disabled:opacity-60"
          >
            <RotateCcw size={16} /> Return
          </button>
          <button
            type="button"
            onClick={() => handleReturnOrRejectClick('reject')}
            disabled={saving}
            className="flex h-11 items-center gap-2 rounded-2xl border border-rose-200 px-6 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60"
          >
            <XCircle size={16} /> Reject
          </button>
        </>
      ) : isLegalMode ? (
        <>
          <button
            type="button"
            onClick={handleCheckClick}
            disabled={saving}
            className="flex h-11 items-center gap-2 rounded-2xl bg-brand-600 px-6 text-sm font-semibold text-white shadow-soft hover:bg-brand-700 disabled:opacity-60"
          >
            <ShieldCheck size={16} /> Check
          </button>
          <button
            type="button"
            onClick={handleCommentClick}
            disabled={saving}
            className="flex h-11 items-center gap-2 rounded-2xl border border-slate-200 px-6 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-60"
          >
            <MessageSquare size={16} /> Comment
          </button>
          <button
            type="button"
            onClick={handleNoNeedClick}
            disabled={saving}
            className="flex h-11 items-center gap-2 rounded-2xl border border-slate-200 px-6 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-60"
          >
            <MinusCircle size={16} /> No Need
          </button>
          {/* Drafted contracts offer Cancel; every other status (Signed, and any
              other status that could theoretically land here) keeps Terminate —
              the pre-existing, unconditional button this replaces. */}
          {initialData?.status === 'Drafted' ? (
            <button
              type="button"
              onClick={handleLegalCancelClick}
              disabled={saving}
              className="flex h-11 items-center gap-2 rounded-2xl border border-rose-200 px-6 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60"
            >
              <XCircle size={16} /> Cancel
            </button>
          ) : (
            <button
              type="button"
              onClick={handleTerminateClick}
              disabled={saving}
              className="flex h-11 items-center gap-2 rounded-2xl border border-rose-200 px-6 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60"
            >
              <Ban size={16} /> Terminate
            </button>
          )}
        </>
      ) : isLegalHistoryMode ? (
        // Same status check as Legal > Waiting's footer (Drafted → Cancel, Signed →
        // Terminate), reusing the exact same handlers/API dispatch — but unlike
        // Waiting, History spans every status a contract could be in, so anything
        // else (Terminated, Canceled, Active, ...) shows neither button, just Close.
        initialData?.status === 'Drafted' ? (
          <button
            type="button"
            onClick={handleLegalCancelClick}
            disabled={saving}
            className="flex h-11 items-center gap-2 rounded-2xl border border-rose-200 px-6 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60"
          >
            <XCircle size={16} /> Cancel
          </button>
        ) : initialData?.status === 'Signed' ? (
          <button
            type="button"
            onClick={handleTerminateClick}
            disabled={saving}
            className="flex h-11 items-center gap-2 rounded-2xl border border-rose-200 px-6 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60"
          >
            <Ban size={16} /> Terminate
          </button>
        ) : null
      ) : isGroupA ? (
        <>
          <button
            type="button"
            onClick={handleSaveChangeClick}
            disabled={saving}
            className="flex h-11 items-center gap-2 rounded-2xl bg-brand-600 px-6 text-sm font-semibold text-white shadow-soft hover:bg-brand-700 disabled:opacity-60"
          >
            <Save size={16} /> Save Change
          </button>
          <button
            type="button"
            onClick={handleCancelClick}
            disabled={saving}
            className="flex h-11 items-center gap-2 rounded-2xl border border-rose-200 px-6 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60"
          >
            <XCircle size={16} /> Cancel
          </button>
        </>
      ) : isReturned ? (
        <>
          <button
            type="button"
            onClick={() => formik.submitForm()}
            disabled={saving}
            className="flex h-11 items-center gap-2 rounded-2xl bg-brand-600 px-6 text-sm font-semibold text-white shadow-soft hover:bg-brand-700 disabled:opacity-60"
          >
            <Send size={16} /> Send Request
          </button>
          <button
            type="button"
            onClick={handleCancelClick}
            disabled={saving}
            className="flex h-11 items-center gap-2 rounded-2xl border border-rose-200 px-6 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60"
          >
            <XCircle size={16} /> Cancel
          </button>
        </>
      ) : (
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
            onClick={() => formik.submitForm()}
            disabled={saving}
            className="flex h-11 items-center gap-2 rounded-2xl bg-brand-600 px-6 text-sm font-semibold text-white shadow-soft hover:bg-brand-700 disabled:opacity-60"
          >
            <Send size={16} /> Sent Request
          </button>
          <button
            type="button"
            onClick={handleCancelClick}
            disabled={saving}
            className="flex h-11 items-center gap-2 rounded-2xl border border-rose-200 px-6 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60"
          >
            <XCircle size={16} /> Cancel
          </button>
        </>
      )}
      <button
        type="button"
        onClick={onClose}
        disabled={saving}
        className="flex h-11 items-center gap-2 rounded-2xl border border-slate-200 px-6 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-60"
      >
        <X size={16} /> Close
      </button>
    </>
  );

  return (
    <>
      <FormModal
        open
        title={MODE_TITLES[mode] || MODE_TITLES.edit}
        titleBadge={
          <>
            <RemarkBadge remark={initialData?.remark} />
            {initialData?.confidentiality && <ConfidentialBadge />}
          </>
        }
        footer={footer}
        onClose={onClose}
        closeDisabled={saving}
      >
        {loadError && <div className="py-16 text-center text-rose-500">Failed to load contract data. Please try again.</div>}
        {!loadError && !initialData && <div className="py-16 text-center text-slate-400">กำลังโหลดข้อมูล...</div>}
        {!loadError && initialData && (
          <RequestFormFields
            formik={formik}
            contractTypes={contractTypes}
            commentRequired={commentRequiredDisplay}
            commentError={commentError}
            comments={initialData.comments}
            commentSectionRef={commentSectionRef}
            approverSignatures={initialData.approverSignatures}
            contractNo={initialData.contractNo}
            isOwner={isOwner}
            readOnly={isReadOnlyMode || isLegalHistoryMode}
            commentReadOnly={isReadOnlyMode}
          />
        )}
      </FormModal>

      <ConfirmModal
        open={!!pendingAction}
        title={pendingAction ? CONFIRM_COPY[pendingAction.action].title : undefined}
        message={pendingAction ? CONFIRM_COPY[pendingAction.action].message : undefined}
        busy={saving}
        onConfirm={handleConfirmYes}
        onCancel={() => setPendingAction(null)}
      />
      <WaitingModal open={saving} />
      <ResultModal open={!!result} variant={result?.variant} title={result?.title} message={result?.message} onClose={handleResultClose} />
    </>
  );
}
