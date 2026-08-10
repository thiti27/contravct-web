import NewRequestHeader from '../../pages/NewRequest/NewRequestHeader';
import ContractInfoSection from '../../pages/NewRequest/sections/ContractInfoSection';
import PaymentTermSection from '../../pages/NewRequest/sections/PaymentTermSection';
import DocumentsSection from '../../pages/NewRequest/sections/DocumentsSection';
import CommentSection from '../../pages/NewRequest/sections/CommentSection';
import ApprovalSection from '../../pages/NewRequest/sections/ApprovalSection';

// Body of the New Request form — shared between the New Request page and the
// Edit modal, which reuses these exact sections pre-filled from an existing row.
export default function RequestFormFields({
  formik,
  contractTypes,
  commentRequired,
  commentError,
  comments,
  commentSectionRef,
  approverSignatures,
  contractNo,
  readOnly = false,
  // Legal History Mode is read-only for the contract itself but still needs a live
  // comment box to enter a Terminate reason — defaults to `readOnly` so every other
  // mode (plain view, edit, approve, legal) keeps its existing all-or-nothing behavior.
  commentReadOnly = readOnly,
  // Whether the current viewer created this request — only matters to DocumentsSection
  // (Drawing/Plan + Specification are upload-only for non-owners). Defaults to true so
  // every other caller (New Request, approve/legal/view modes) keeps full access.
  isOwner = true,
}) {
  const selectedTypeName = contractTypes.find(t => t.id === formik.values.contractTypeId)?.name || '';

  return (
    <div className="divide-y-2 divide-slate-200 overflow-hidden rounded-xl2 border border-slate-200 bg-white shadow-card">
      <NewRequestHeader
        contractTypeLabel={selectedTypeName}
        confidential={formik.values.confidentiality}
        contractNo={contractNo}
        approver3ApprovedAt={approverSignatures?.[0]?.approvedAt}
      />
      <ContractInfoSection formik={formik} contractTypes={contractTypes} readOnly={readOnly} />
      <PaymentTermSection formik={formik} readOnly={readOnly} />
      <DocumentsSection formik={formik} readOnly={readOnly} isOwner={isOwner} />
      <CommentSection
        formik={formik}
        required={commentRequired}
        error={commentError}
        comments={comments}
        sectionRef={commentSectionRef}
        readOnly={commentReadOnly}
      />
      <ApprovalSection formik={formik} approverSignatures={approverSignatures} readOnly={readOnly} />
    </div>
  );
}
