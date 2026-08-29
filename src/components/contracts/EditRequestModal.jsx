import { useEffect, useRef, useState } from 'react';
import { useFormik } from 'formik';
import { Save, Send, XCircle, X, CheckCircle2, RotateCcw, MessageSquare, ShieldCheck, Ban, MinusCircle, Download, Loader2 } from 'lucide-react';
import FormModal from '../ui/FormModal';
import RemarkBadge, { REMARK_LABELS } from '../ui/RemarkBadge';
import ConfidentialBadge from '../ui/ConfidentialBadge';
import ConfirmModal from '../ui/ConfirmModal';
import WaitingModal from '../ui/WaitingModal';
import ResultModal from '../ui/ResultModal';
import RequestFormFields from './RequestFormFields';
import ActionInfoSection from './ActionInfoSection';
import NewRequestHeader from '../../pages/NewRequest/NewRequestHeader';
import ContractInfoSection from '../../pages/NewRequest/sections/ContractInfoSection';
import CommentSection from '../../pages/NewRequest/sections/CommentSection';
import ApprovalSection from '../../pages/NewRequest/sections/ApprovalSection';
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
import { parseThousands, normalizeThousands } from '../../lib/formatNumber';
import { buildInitialValues, validateRequest, validateLinkedRequest } from '../../pages/NewRequest/formConfig';
import { validateAndScrollOnError } from '../../lib/formScroll';
import { downloadContractRequisitionFormPdf } from '../../pdf/downloadContractRequisitionFormPdf';

// Statuses where the footer is Save Change / Close and the Comment field is required —
// editing an in-flight request needs a reason recorded either way. Only relevant in
// mode="edit"; mode="approve" always uses the Approve/Return/Reject footer regardless
// of which Waiting Approver stage the request is currently at. 'No Needed' belongs here
// too, not the Saved-style Save Draft/Send Request footer below it — that footer's
// actions reset status to 'Saved'/'Waiting Approver 1', which would incorrectly pull a
// No Needed row back into the approval workflow. Save Change leaves status untouched
// (see EDIT_ACTION_STATUS on the server), so editing a No Needed row's data can't do that.
const GROUP_A_STATUSES = ['Waiting Approver 1', 'Waiting Approver 2', 'Waiting Approver 3', 'Drafted', 'No Needed'];

// Actions whose footer button requires the Comment field to be filled before a
// confirm popup opens (red border + required message otherwise). 'cancel' isn't listed —
// the plain Edit-mode Cancel footer button was removed (Cancel is now its own linked-
// request flow, like Renew/Amend/Claim Note/Terminate — see the More menu instead).
const COMMENT_REQUIRED_ACTIONS = ['save-change', 'return', 'reject', 'comment', 'terminate', 'legal-cancel'];

const CONFIRM_COPY = {
  'save-change': { title: 'Confirm Save Change', message: 'Save the changes made to this contract request?' },
  'save-draft': { title: 'Confirm Save Draft', message: 'Save this contract request as a draft?' },
  'send-request': { title: 'Confirm Send Request', message: 'Submit this contract request for approval?' },
  approve: { title: 'Confirm Approval', message: 'Are you sure you want to approve this contract request?' },
  return: { title: 'Confirm Return', message: 'Are you sure you want to return this contract request?' },
  reject: { title: 'Confirm Rejection', message: 'Are you sure you want to reject this contract request?' },
  comment: { title: 'Confirm Comment', message: 'Are you sure you want to save this comment?' },
  // 'legal-save': same underlying action as 'comment' (LEGAL_API below) — Legal >
  // Waiting/Legal Comment's own explicit "Save" button, kept as a separate footer item
  // from Comment per requirements, just with its own copy.
  'legal-save': { title: 'Confirm Save', message: 'Save the changes made to this contract?' },
  check: { title: 'Confirm Legal Check', message: 'Are you sure you want to complete the legal review?' },
  terminate: { title: 'Confirm Terminate Contract', message: 'Are you sure you want to terminate this contract?' },
  'no-need': { title: 'Confirm No Need', message: 'Are you sure you want to mark this contract as No Need?' },
  'legal-cancel': { title: 'Confirm Cancel Contract', message: 'Are you sure you want to cancel this contract?' },
};

const RESULT_MESSAGE = {
  'save-change': 'Your changes have been saved successfully.',
  'save-draft': 'Your draft has been saved successfully.',
  'send-request': 'Your contract request has been submitted successfully.',
  approve: 'The contract request has been approved successfully.',
  return: 'The contract request has been returned successfully.',
  reject: 'The contract request has been rejected successfully.',
  comment: 'Your comment has been saved successfully.',
  'legal-save': 'Your changes have been saved successfully.',
  check: 'The legal review has been completed successfully.',
  terminate: 'This contract has been terminated successfully.',
  'no-need': 'This contract has been marked as No Need.',
  'legal-cancel': 'This contract has been canceled successfully.',
};

const APPROVAL_API = { approve: approveContractRequest, return: returnContractRequest, reject: rejectContractRequest };
const LEGAL_API = {
  comment: commentOnLegalRequest,
  'legal-save': commentOnLegalRequest,
  check: checkLegalRequest,
  terminate: terminateLegalRequest,
  'no-need': markNoNeedLegalRequest,
  'legal-cancel': cancelLegalRequest,
};

// Modal header title, per mode. legal (Legal > Waiting) isn't here — it always shows
// "{Remark} Contract - {contract_no}" instead, computed directly in the title ternary
// below (checked ahead of everything else, since it applies unconditionally for those
// two modes regardless of remark).
const MODE_TITLES = {
  edit: 'Edit Request',
  approve: 'Approval',
};

// Hover tooltips (native `title`) for the Legal modal's footer buttons (mode="legal") —
// same wording regardless of which page opened it (Legal > Waiting or a job list's
// Legal Comment action). Cancel and Terminate share one tooltip since they're the same
// underlying action, just named for the status it's offered on.
const LEGAL_BUTTON_TOOLTIPS = {
  save: 'แก้ไขข้อมูลและ Comment ได้ โดยไม่ส่งอีเมล',
  check: 'ตรวจสอบข้อมูล',
  comment: 'เพิ่ม Comment และส่งอีเมล',
  noNeed: 'เปลี่ยนสถานะเป็น No Need',
  cancelOrTerminate: 'ยกเลิกสัญญานี้',
};

// Reused for both the My Job "Edit" action (mode="edit", the default) and the Waiting
// Approve "View" action (mode="approve") — same New Request form sections throughout,
// only the footer buttons/validation/API calls differ by mode (and, within mode="edit",
// by the request's current status — see GROUP_A_STATUSES above).
export default function EditRequestModal({
  contractId,
  mode = 'edit',
  onClose,
  onSaved,
  enforceFilePermission = false,
  // All Job only (see ContractListPage.jsx/AllJobTab.jsx) — replaces the header's title
  // with this literal string ("Edit Contract"), regardless of remark/status/contractNo.
  // Content/form/logic/permission below the header are untouched by this.
  titleOverride,
}) {
  const { user } = useAuth();
  const [contractTypes, setContractTypes] = useState([]);
  const [initialData, setInitialData] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [pendingAction, setPendingAction] = useState(null); // { action, values } | null
  const [commentAttempted, setCommentAttempted] = useState(false);
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const commentSectionRef = useRef(null);

  // Extracted so the Legal "Comment" action (which stays open and refreshes in
  // place instead of closing, see handleResultClose) can re-run it after saving.
  const loadContractData = () => {
    setLoadError(false);
    return Promise.all([fetchContractTypes(), fetchContractRequest(contractId)])
      .then(([types, data]) => {
        setContractTypes(types);
        // Normalize on load too — Supplier Name could still be lowercase/mixed-case (a
        // row saved before that rule existed), and totalNetPrice comes back as a plain
        // numeric string ("1250000.5") with no comma grouping or fixed decimals yet.
        setInitialData({
          ...data,
          supplierName: (data.supplierName || '').toUpperCase(),
          totalNetPrice: normalizeThousands(data.totalNetPrice),
        });
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
    // Renew/Amend/Claim Note/Terminate rows (remark !== 'new') use the narrower
    // validator — Payment Term/Documents aren't shown in that reduced layout (see
    // isLinkedRequest below), so validateRequest's requirements for those would block
    // Save Change/Send Request on fields the user can't even see here.
    validate: initialData?.remark && initialData.remark !== 'new' ? validateLinkedRequest : validateRequest,
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
  // All Job (the only caller that passes enforceFilePermission — see ContractListPage.jsx/
  // AllJobTab.jsx) can open ANY user's request, including ones the viewer has no real
  // business looking at Specification/Drawing/Plan attachments for. Per spec: the viewer
  // must both hold the `view` permission AND be either this job's creator or one of its
  // 3 approvers — matching neither collapses to no access at all (masked filename, no
  // attach/download/delete), which is stricter than isOwner above (creator-only, no
  // `view` check) and only ever applies when enforceFilePermission is set, so every other
  // enableEdit page (My Job, Contract Making, Upload Contract, Find Contract) keeps its
  // existing isOwner-based behavior untouched.
  const viewerEmId = user?.em_id != null ? String(user.em_id) : '';
  const isJobCreator = viewerEmId !== '' && !!initialData && String(initialData.createdBy ?? '') === viewerEmId;
  const isJobApprover =
    viewerEmId !== '' &&
    !!initialData &&
    (initialData.approvers || []).some(a => a != null && String(a) !== '' && String(a) === viewerEmId);
  const hasFilePermission = !!user?.view && (isJobCreator || isJobApprover);
  const restrictedFileAccess = enforceFilePermission && !!initialData && !hasFilePermission;
  const isGroupA = isEditMode && GROUP_A_STATUSES.includes(initialData?.status);
  // Viewing/editing a Renew/Amend/Claim Note/Terminate/Cancel request (as opposed to an
  // original 'new' one) — Contract Information there was fixed at creation (see
  // LinkedRequestModal), never editable afterward, so Edit, Waiting Approve's View
  // (mode="approve"), Legal > Waiting's View (mode="legal"), and any read-only View
  // (mode="view" — Job Status/Approval "My History") all show that same read-only
  // Contract Info + centered header LinkedRequestModal uses, while each keeps its own
  // footer (Save Change/Save Draft/Cancel for Edit, Approve/Return/Reject for approve,
  // Check/Comment/No Need/Terminate-or-Cancel for legal, Close-only for view — see the
  // footer below, untouched by this).
  const isLinkedRequest =
    (isEditMode || isApproveMode || isLegalMode || isReadOnlyMode) && !!initialData?.remark && initialData.remark !== 'new';
  // Editing or Legal-reviewing a 'Drafted' request — every approver has already signed
  // off by this stage, so Section Approval must stay locked regardless of remark.
  const approvalReadOnly = (isEditMode || isLegalMode) && initialData?.status === 'Drafted';
  // Only needed for isLinkedRequest's own NewRequestHeader below — RequestFormFields
  // computes this itself internally for every other mode.
  const selectedTypeName = contractTypes.find(t => t.id === formik.values.contractTypeId)?.name || '';
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
  const handleSaveDraftClick = () => openConfirm('save-draft');

  // Validates explicitly (rather than relying on formik.submitForm's internal,
  // silent validate-then-touch chain) so a failed Send Request scrolls to the first
  // bad field instead of doing nothing that looked like the button was broken.
  const handleSendRequestClick = async () => {
    if (await validateAndScrollOnError(formik)) openConfirm('send-request');
  };

  const handleApproveClick = () => openConfirm('approve');
  const handleReturnOrRejectClick = action => {
    if (!guardComment(action)) {
      commentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    openConfirm(action);
  };

  // Legal's own "Save" — edits/saves the form data without touching status, comment
  // optional (same simple pattern as Check/No Need below). Functionally identical to
  // Comment's own save-without-status-change behavior (both call commentOnLegalRequest),
  // kept as its own footer button per requirements rather than folded into Comment.
  const handleLegalSaveClick = () => openConfirm('legal-save');
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

  // Entirely client-side (see src/pdf/) — no API call, no data mutation, just the data
  // already loaded into this modal (formik.values) rendered into the official Contract
  // Requisition Form template's layout. Available in every mode, since any open request
  // has this same data on screen regardless of what else the footer offers.
  const handleDownloadPdfClick = async () => {
    setPdfDownloading(true);
    try {
      await downloadContractRequisitionFormPdf(formik.values, selectedTypeName);
    } catch (err) {
      console.error('Failed to generate the Contract Requisition Form PDF:', err);
      window.alert('Unable to generate PDF. Please try again.');
    } finally {
      setPdfDownloading(false);
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
            onClick={handleLegalSaveClick}
            disabled={saving}
            title={LEGAL_BUTTON_TOOLTIPS.save}
            className="flex h-11 items-center gap-2 rounded-2xl border border-slate-200 px-6 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-60"
          >
            <Save size={16} /> Save
          </button>
          <button
            type="button"
            onClick={handleCheckClick}
            disabled={saving}
            title={LEGAL_BUTTON_TOOLTIPS.check}
            className="flex h-11 items-center gap-2 rounded-2xl bg-brand-600 px-6 text-sm font-semibold text-white shadow-soft hover:bg-brand-700 disabled:opacity-60"
          >
            <ShieldCheck size={16} /> Check
          </button>
          <button
            type="button"
            onClick={handleCommentClick}
            disabled={saving}
            title={LEGAL_BUTTON_TOOLTIPS.comment}
            className="flex h-11 items-center gap-2 rounded-2xl border border-slate-200 px-6 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-60"
          >
            <MessageSquare size={16} /> Comment
          </button>
          <button
            type="button"
            onClick={handleNoNeedClick}
            disabled={saving}
            title={LEGAL_BUTTON_TOOLTIPS.noNeed}
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
              title={LEGAL_BUTTON_TOOLTIPS.cancelOrTerminate}
              className="flex h-11 items-center gap-2 rounded-2xl border border-rose-200 px-6 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60"
            >
              <XCircle size={16} /> Cancel
            </button>
          ) : (
            <button
              type="button"
              onClick={handleTerminateClick}
              disabled={saving}
              title={LEGAL_BUTTON_TOOLTIPS.cancelOrTerminate}
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
        // else (Terminated, Cancelled, Active, ...) shows neither button, just Close.
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
        <button
          type="button"
          onClick={handleSaveChangeClick}
          disabled={saving}
          className="flex h-11 items-center gap-2 rounded-2xl bg-brand-600 px-6 text-sm font-semibold text-white shadow-soft hover:bg-brand-700 disabled:opacity-60"
        >
          <Save size={16} /> Save Change
        </button>
      ) : isReturned ? (
        <button
          type="button"
          onClick={handleSendRequestClick}
          disabled={saving}
          className="flex h-11 items-center gap-2 rounded-2xl bg-brand-600 px-6 text-sm font-semibold text-white shadow-soft hover:bg-brand-700 disabled:opacity-60"
        >
          <Send size={16} /> Send Request
        </button>
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
            onClick={handleSendRequestClick}
            disabled={saving}
            className="flex h-11 items-center gap-2 rounded-2xl bg-brand-600 px-6 text-sm font-semibold text-white shadow-soft hover:bg-brand-700 disabled:opacity-60"
          >
            <Send size={16} /> Sent Request
          </button>
        </>
      )}
      <button
        type="button"
        onClick={handleDownloadPdfClick}
        disabled={pdfDownloading}
        className="flex h-11 items-center gap-2 rounded-2xl border border-slate-200 px-6 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-60"
      >
        {pdfDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Download PDF
      </button>
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
        centerTitle={isLegalMode || isLegalHistoryMode || !!titleOverride || isLinkedRequest || isEditMode || isReadOnlyMode}
        // Legal > Waiting (mode="legal") and Legal > History (mode="legal-history") both
        // always show "{Remark} Contract - {contract_no}" as one plain centered title —
        // "Cancel Contract - DSST03-2026", "New Contract - DSST03-2026", etc. —
        // regardless of remark (unlike every other mode, where this format is reserved
        // for remark !== 'new' via isLinkedRequest below); uses this row's own
        // contract_no specifically, not referContractNo, since a completed
        // Renew/Amend/Terminate/Claim Note showing up here already has its own real
        // "-NN" sub-number by the time it reaches Drafted/Signed. Checked first, ahead of
        // everything below, since it applies unconditionally for these two modes.
        //
        // Linked-request header (every other mode) matches LinkedRequestModal's exactly —
        // "Renew Contract - DSST01-2026" as one plain centered title. Plain Edit mode
        // (remark = 'new') gets the same centered treatment but describes the row's own
        // status instead of a remark — "Edit Drafted Contract - DSST02-2026" — since
        // there's no contract number at all until status reaches 'Drafted'. Read-only View
        // mode (Job Status/Approval "My History" — see MyHistoryTab.jsx) mirrors My Job's
        // header exactly for the same 'new'-remark case, just without the "Edit" verb
        // since nothing here is editable — "Signed Contract - DSST01-2026". Every other
        // mode keeps "Approval"/etc. plus the separate Remark badge + contract-no chip.
        // titleOverride (All Job only) wins over all of the above — same centered/no-badge
        // header layout as Edit mode, just a fixed "Edit Contract" instead of status/
        // contractNo/remark-derived text, regardless of which row/remark was opened.
        title={
          isLegalMode || isLegalHistoryMode
            ? `${REMARK_LABELS[initialData?.remark] || initialData?.remark || ''}${
                initialData?.contractNo ? ` - ${initialData.contractNo}` : ''
              }`
            : titleOverride
              ? titleOverride
              : isLinkedRequest
                ? `${REMARK_LABELS[initialData.remark] || initialData.remark}${
                    initialData.referContractNo ? ` - ${initialData.referContractNo}` : ''
                  }`
                : isEditMode
                  ? `Edit ${initialData?.status || ''} Contract${initialData?.contractNo ? ` - ${initialData.contractNo}` : ''}`
                  : isReadOnlyMode
                    ? `${initialData?.status || ''} Contract${initialData?.contractNo ? ` - ${initialData.contractNo}` : ''}`
                    : MODE_TITLES[mode] || MODE_TITLES.edit
        }
        titleBadge={
          isLegalMode || isLegalHistoryMode || titleOverride || isLinkedRequest || isEditMode || isReadOnlyMode ? null : (
            <>
              <RemarkBadge remark={initialData?.remark} />
              {initialData?.confidentiality && <ConfidentialBadge />}
            </>
          )
        }
        footer={footer}
        onClose={onClose}
        closeDisabled={saving}
      >
        {loadError && <div className="py-16 text-center text-rose-500">Failed to load contract data. Please try again.</div>}
        {!loadError && !initialData && <div className="py-16 text-center text-slate-400">กำลังโหลดข้อมูล...</div>}
        {!loadError && initialData && (isLinkedRequest ? (
          // Same reduced set of sections LinkedRequestModal shows when a Renew/Amend/
          // Claim Note/Terminate request is first created: Contract Information is fixed
          // at that point and never editable again, so only "___ Information", Comment,
          // and Approval are actually live here. Comment is required here — unlike
          // LinkedRequestModal it's optional there — since Save Change on some statuses
          // (GROUP_A_STATUSES) requires one; dropping it would leave that button
          // silently unusable.
          <div className="divide-y-2 divide-slate-200 overflow-hidden rounded-xl2 border border-slate-200 bg-white shadow-card">
            <NewRequestHeader
              contractTypeLabel={selectedTypeName}
              confidential={formik.values.confidentiality}
              contractNo={initialData.contractNo}
              approver3ApprovedAt={initialData.approverSignatures?.[0]?.approvedAt}
            />
            <ContractInfoSection formik={formik} contractTypes={contractTypes} readOnly />
            <ActionInfoSection formik={formik} remark={initialData.remark} readOnly={isReadOnlyMode} />
            <CommentSection
              formik={formik}
              required={commentRequiredDisplay}
              error={commentError}
              comments={initialData.comments}
              sectionRef={commentSectionRef}
              readOnly={isReadOnlyMode}
            />
            <ApprovalSection
              formik={formik}
              approverSignatures={initialData.approverSignatures}
              highlight
              readOnly={approvalReadOnly || isReadOnlyMode}
            />
          </div>
        ) : (
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
            strictDocAccess={restrictedFileAccess}
            readOnly={isReadOnlyMode || isLegalHistoryMode}
            commentReadOnly={isReadOnlyMode}
            approvalReadOnly={approvalReadOnly}
          />
        ))}
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
