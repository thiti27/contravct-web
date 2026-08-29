import { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import { useNavigate } from 'react-router-dom';
import { Send, Save } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import WaitingModal from '../../components/ui/WaitingModal';
import ResultModal from '../../components/ui/ResultModal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useAuth } from '../../context/AuthContext';
import { useMetaContext } from '../../context/MetaContext';
import { fetchContractTypes, submitContractRequest } from '../../lib/api';
import { parseThousands } from '../../lib/formatNumber';
import { PATHS } from '../../routes/paths';
import { buildInitialValues, validateRequest } from './formConfig';
import RequestFormFields from '../../components/contracts/RequestFormFields';
import { validateAndScrollOnError } from '../../lib/formScroll';

export default function NewRequestTab() {
  const { user } = useAuth();
  const meta = useMetaContext();
  const navigate = useNavigate();
  const [contractTypes, setContractTypes] = useState([]);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null); // { variant: 'success' | 'error', message }
  const [pendingSave, setPendingSave] = useState(null); // { status, values } awaiting Yes/No, or null

  useEffect(() => {
    fetchContractTypes().then(setContractTypes).catch(() => setContractTypes([]));
  }, []);

  const persistRequest = async (status, values) => {
    setSaving(true);
    try {
      await submitContractRequest({
        ...values,
        status,
        totalNetPrice: parseThousands(values.totalNetPrice),
        emId: user?.em_id,
        updatedName: user?.name,
      });
      // Navbar badges (My Job/Contract Making/Waiting Approve counts) reflect this new
      // row immediately — refetched right after the API call succeeds, not gated on the
      // user dismissing the success modal, and never fired at all on failure (catch
      // branch below has no refreshMeta call).
      meta.refreshMeta?.();
      setResult({
        variant: 'success',
        message: status === 'draft' ? 'Your draft has been saved successfully.' : 'Your contract request has been submitted successfully.',
      });
    } catch {
      setResult({ variant: 'error', message: 'Failed to save data. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const formik = useFormik({
    initialValues: buildInitialValues(user),
    validate: validateRequest,
  });

  const handleSaveDraftClick = () => setPendingSave({ status: 'draft', values: formik.values });

  // Validates explicitly (rather than relying on a native form submit) so a failed
  // Send Request scrolls to the first bad field instead of silently doing nothing —
  // that silence used to read as the button being broken.
  const handleSendRequestClick = async () => {
    const valid = await validateAndScrollOnError(formik);
    if (valid) setPendingSave({ status: 'submitted', values: formik.values });
  };

  const handleConfirmYes = async () => {
    const pending = pendingSave;
    setPendingSave(null);
    await persistRequest(pending.status, pending.values);
  };

  const handleConfirmNo = () => setPendingSave(null);

  const handleResultClose = () => {
    const wasSuccess = result?.variant === 'success';
    setResult(null);
    if (wasSuccess) {
      formik.resetForm({ values: buildInitialValues(user) });
      navigate(PATHS.CONTRACT_MAKING);
    }
  };

  return (
    <PageContainer>
      <RequestFormFields formik={formik} contractTypes={contractTypes} />

      <div className="flex justify-end gap-3 pt-5 pb-2">
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
      </div>

      <ConfirmModal
        open={!!pendingSave}
        message={
          pendingSave?.status === 'draft'
            ? 'Save this contract request as a draft?'
            : 'Submit this contract request for approval?'
        }
        onConfirm={handleConfirmYes}
        onCancel={handleConfirmNo}
      />
      <WaitingModal open={saving} />
      <ResultModal open={!!result} variant={result?.variant} message={result?.message} onClose={handleResultClose} />
    </PageContainer>
  );
}
