import { useEffect, useState } from 'react';
import { FileText, ShieldAlert, ShieldCheck, ShieldQuestion, RotateCcw, AlertTriangle } from 'lucide-react';
import TextField from '../../../components/ui/TextField';
import TextAreaField from '../../../components/ui/TextAreaField';
import FormSelect from '../../../components/ui/FormSelect';
import CheckboxField from '../../../components/ui/CheckboxField';
import DateField from '../../../components/ui/DateField';
import ConstructionRiskModal from '../../../components/contracts/ConstructionRiskModal';
import { requiresConstructionRiskAssessment, HIGH_RISK_REQUIREMENTS } from '../../../lib/constructionRiskChecklist';
import { useTotalNetPriceField } from '../../../hooks/useTotalNetPriceField';

export default function ContractInfoSection({ formik, contractTypes, readOnly = false }) {
  const { values, errors, touched, setFieldValue, handleChange, handleBlur } = formik;
  const [showRiskModal, setShowRiskModal] = useState(false);
  const totalNetPriceField = useTotalNetPriceField(formik);
  const selectedType = contractTypes.find(t => t.id === values.contractTypeId);
  const allowCustomPurpose = selectedType?.allowCustomPurpose;
  const purposeOptions = selectedType?.purposes || [];

  // Construction Risk Classification Checklist — only for contract types Settings >
  // Contract Type marked as requiring it (checkConstructionRisk). Total Net Price is
  // mirrored right below Contract Purpose (same formik field Payment Term's own Total
  // Net Price writes — see useTotalNetPriceField) since a user picking a construction
  // type has no reason to scroll all the way to Payment Term before this can unlock.
  const isConstructionType = !!selectedType?.checkConstructionRisk;
  const priceEntered = !!String(values.totalNetPrice || '').trim();
  // Above the exemption threshold, risk doesn't apply — Contract Purpose is a normal
  // dropdown (still excluding the type's own High/Low purposes below; those stay
  // reserved for an actual assessment even when one isn't required right now). At or
  // below it (or when the type has no threshold at all), the field is locked entirely
  // — Confirm Assessment on the checklist popup is the only way to set it.
  const exempted = isConstructionType && priceEntered && !requiresConstructionRiskAssessment(selectedType, values.totalNetPrice);
  const mustAssess = isConstructionType && priceEntered && !exempted;
  const riskPurposeHigh = selectedType?.constructionRiskPurposes?.high || null;
  const riskPurposeLow = selectedType?.constructionRiskPurposes?.low || null;
  // Whatever is currently selected always stays a valid option (react-select can't
  // display a value that isn't among its own options) — everything else excludes the
  // type's own High/Low purposes, which are only ever set by the checklist below, never
  // picked directly from this list.
  const filteredPurposeOptions = purposeOptions.filter(p => p !== riskPurposeHigh && p !== riskPurposeLow);
  const purposeSelectOptions =
    values.contractPurpose && !filteredPurposeOptions.includes(values.contractPurpose)
      ? [...filteredPurposeOptions, values.contractPurpose]
      : filteredPurposeOptions;
  const riskAssessed = !!values.constructionRiskLevel;

  // Total Net Price dropping to/below the threshold (edited either here or down in
  // Payment Term — same formik field) invalidates a purpose that was only ever valid
  // because the contract was exempt: clear it so the now-locked field can't keep
  // showing a choice that was never actually risk-classified. A purpose the checklist
  // itself assigned (riskPurposeHigh/Low) stays — the assessment's own answers don't
  // depend on price, so crossing this threshold doesn't invalidate it.
  useEffect(() => {
    if (!mustAssess || !values.contractPurpose) return;
    if (values.contractPurpose === riskPurposeHigh || values.contractPurpose === riskPurposeLow) return;
    setFieldValue('contractPurpose', '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mustAssess, values.contractPurpose, riskPurposeHigh, riskPurposeLow]);

  const err = key => (touched[key] ? errors[key] : undefined);

  const handlePurposeChange = v => {
    setFieldValue('contractPurpose', v);
    // A manual dropdown pick is never one of the risk-classified purposes (see
    // purposeSelectOptions above) — clears any stale assessment from a previous pick
    // instead of leaving a score/level that no longer matches what's now selected.
    setFieldValue('constructionRiskLevel', '');
    setFieldValue('constructionRiskScore', null);
    setFieldValue('constructionRiskAnswers', null);
  };

  const handleRiskConfirm = ({ level, score, answers, snapshot }) => {
    setFieldValue('constructionRiskLevel', level);
    setFieldValue('constructionRiskScore', score);
    setFieldValue('constructionRiskAnswers', snapshot);
    setFieldValue('contractPurpose', selectedType?.constructionRiskPurposes?.[level] || '');
    setShowRiskModal(false);
  };

  return (
    <section>
      <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-6 py-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-brand-600 shadow-sm">
          <FileText size={19} />
        </span>
        <div>
          <div className="font-bold text-navy">Contract Information</div>
          <div className="text-base text-slate-500">ข้อมูลหลักของสัญญา</div>
        </div>
      </div>

      <div className="space-y-5 p-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-start pt-1">
            <CheckboxField
              label="HIGH CONFIDENTIAL"
              checked={values.confidentiality}
              onChange={v => setFieldValue('confidentiality', v)}
              disabled={readOnly}
            />
          </div>

          <FormSelect
            label="Contract Type"
            required
            name="contractTypeId"
            error={err('contractTypeId')}
            options={contractTypes.map(t => ({ value: t.id, label: t.name }))}
            value={values.contractTypeId}
            onChange={v => {
              setFieldValue('contractTypeId', v);
              setFieldValue('contractPurpose', '');
              setFieldValue('constructionRiskLevel', '');
              setFieldValue('constructionRiskScore', null);
              setFieldValue('constructionRiskAnswers', null);
            }}
            isDisabled={readOnly}
            placeholder="เลือกประเภทสัญญา..."
          />

          {isConstructionType ? (
            <div>
              <FormSelect
                label="Contract Purpose"
                required
                name="contractPurpose"
                error={err('contractPurpose')}
                options={priceEntered ? purposeSelectOptions : []}
                value={values.contractPurpose}
                onChange={mustAssess ? () => {} : handlePurposeChange}
                isDisabled={readOnly || !priceEntered || mustAssess}
                placeholder={
                  !priceEntered
                    ? 'กรอกมูลค่าสัญญาด้านล่างก่อน'
                    : mustAssess
                      ? riskAssessed
                        ? undefined
                        : 'กรุณาประเมินความเสี่ยงก่อน'
                      : 'เลือกวัตถุประสงค์...'
                }
              />

              {/* Mirrors Payment Term's own Total Net Price (same formik field, see
                  useTotalNetPriceField) — surfaced here too since whether Contract
                  Purpose is locked behind the checklist depends on it, and Payment Term
                  sits well below the fold from here. */}
              <div className="mt-2">
                <TextField
                  label="Total Net Price"
                  required
                  inputMode="decimal"
                  name="totalNetPrice"
                  value={values.totalNetPrice}
                  onChange={totalNetPriceField.handleChange}
                  onBlur={totalNetPriceField.handleBlur}
                  error={err('totalNetPrice')}
                  placeholder="0.00"
                  disabled={readOnly}
                />
              </div>

              {mustAssess && !readOnly && (
                <button
                  type="button"
                  onClick={() => setShowRiskModal(true)}
                  className={`mt-1.5 flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-base font-semibold ${
                    riskAssessed
                      ? values.constructionRiskLevel === 'high'
                        ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'bg-brand-50 text-brand-700 hover:bg-brand-100'
                  }`}
                >
                  {riskAssessed ? (
                    <>
                      {values.constructionRiskLevel === 'high' ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}
                      {values.constructionRiskLevel === 'high' ? 'HIGH RISK' : 'LOW RISK'} ({values.constructionRiskScore}/28)
                      <RotateCcw size={12} className="ml-0.5" />
                    </>
                  ) : (
                    <>
                      <ShieldQuestion size={14} /> ประเมิน Construction Risk Checklist
                    </>
                  )}
                </button>
              )}
            </div>
          ) : allowCustomPurpose ? (
            <TextField
              label="Contract Purpose"
              required
              name="contractPurpose"
              value={values.contractPurpose}
              onChange={handleChange}
              onBlur={handleBlur}
              error={err('contractPurpose')}
              placeholder="ระบุวัตถุประสงค์..."
              disabled={readOnly || !values.contractTypeId}
            />
          ) : (
            <FormSelect
              label="Contract Purpose"
              required
              name="contractPurpose"
              error={err('contractPurpose')}
              options={purposeOptions}
              value={values.contractPurpose}
              onChange={v => setFieldValue('contractPurpose', v)}
              isDisabled={readOnly || !values.contractTypeId}
              placeholder={values.contractTypeId ? 'เลือกวัตถุประสงค์...' : 'เลือกประเภทสัญญาก่อน'}
            />
          )}

          <TextField
            label="Other Please Specify"
            required
            name="otherSpecify"
            value={values.otherSpecify}
            onChange={handleChange}
            onBlur={handleBlur}
            error={err('otherSpecify')}
            placeholder="อื่นๆ โปรดระบุ"
            disabled={readOnly}
          />

          {values.constructionRiskLevel === 'high' && (
            <div className="col-span-full rounded-2xl border border-amber-300 bg-amber-50 p-4">
              <div className="flex items-center gap-2 text-base font-bold text-amber-800">
                <AlertTriangle size={16} /> Result is HIGH RISK, please follow these requirements:
              </div>
              <ol className="mt-2 list-decimal space-y-2 pl-5 text-base text-amber-800">
                {HIGH_RISK_REQUIREMENTS.map((text, i) => (
                  <li key={i} className="whitespace-pre-line">
                    {text}
                  </li>
                ))}
              </ol>
            </div>
          )}

          <TextField
            label="Supplier Name"
            required
            name="supplierName"
            value={values.supplierName}
            // English letters uppercase in real time as the user types; Thai (and any
            // other caseless script) passes through toUpperCase() unchanged.
            onChange={e => setFieldValue('supplierName', e.target.value.toUpperCase())}
            onBlur={handleBlur}
            error={err('supplierName')}
            placeholder="ชื่อผู้ขาย / ชื่อบริษัท"
            disabled={readOnly}
          />
          <DateField
            label="Date"
            required
            name="requestDate"
            value={values.requestDate}
            onChange={handleChange}
            onBlur={handleBlur}
            error={err('requestDate')}
            disabled={readOnly}
          />
          <DateField
            label="Delivery Date"
            required
            name="deliveryDate"
            value={values.deliveryDate}
            onChange={handleChange}
            onBlur={handleBlur}
            error={err('deliveryDate')}
            disabled={readOnly}
          />
          <TextField
            label="Location"
            required
            name="location"
            value={values.location}
            onChange={handleChange}
            onBlur={handleBlur}
            error={err('location')}
            placeholder="โรงงาน / พื้นที่ / สถานที่"
            disabled={readOnly}
          />
          <TextField
            label="Warranty Period"
            required
            name="warrantyPeriod"
            value={values.warrantyPeriod}
            onChange={handleChange}
            onBlur={handleBlur}
            error={err('warrantyPeriod')}
            placeholder="เช่น 12 เดือน"
            disabled={readOnly}
          />
          <TextField
            label="Refer to Contract No."
            name="referContractNo"
            value={values.referContractNo}
            onChange={handleChange}
            placeholder="เลขที่อ้างอิงตามสัญญาฉบับเดิม"
            disabled
          />
        </div>

        <TextAreaField
          label="Brief Description & Background"
          required
          name="briefDescription"
          value={values.briefDescription}
          onChange={handleChange}
          onBlur={handleBlur}
          error={err('briefDescription')}
          placeholder="วัตถุประสงค์ ขอบเขตงาน และข้อมูลประกอบ..."
          disabled={readOnly}
        />
      </div>

      {isConstructionType && (
        <ConstructionRiskModal
          open={showRiskModal}
          onClose={() => setShowRiskModal(false)}
          onConfirm={handleRiskConfirm}
          header={{
            supplierName: values.supplierName,
            date: values.requestDate,
            assessorName: values.requestorName,
            section: values.requestorSection,
          }}
          initial={
            values.constructionRiskAnswers
              ? {
                  answers: Object.fromEntries(
                    (values.constructionRiskAnswers.rows || []).map(r => [r.no, r.selected]).filter(([, v]) => v)
                  ),
                  note: values.constructionRiskAnswers.note || '',
                }
              : null
          }
        />
      )}
    </section>
  );
}
