import { FileText } from 'lucide-react';
import TextField from '../../../components/ui/TextField';
import TextAreaField from '../../../components/ui/TextAreaField';
import FormSelect from '../../../components/ui/FormSelect';
import CheckboxField from '../../../components/ui/CheckboxField';
import DateField from '../../../components/ui/DateField';

export default function ContractInfoSection({ formik, contractTypes, readOnly = false }) {
  const { values, errors, touched, setFieldValue, handleChange, handleBlur } = formik;
  const selectedType = contractTypes.find(t => t.id === values.contractTypeId);
  const allowCustomPurpose = selectedType?.allowCustomPurpose;
  const purposeOptions = selectedType?.purposes || [];

  const err = key => (touched[key] ? errors[key] : undefined);

  return (
    <section>
      <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-6 py-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-brand-600 shadow-sm">
          <FileText size={19} />
        </span>
        <div>
          <div className="font-bold text-navy">Contract Information</div>
          <div className="text-sm text-slate-500">ข้อมูลหลักของสัญญา</div>
        </div>
      </div>

      <div className="space-y-5 p-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-end pb-0.5">
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
            }}
            isDisabled={readOnly}
            placeholder="เลือกประเภทสัญญา..."
          />

          {allowCustomPurpose ? (
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
            name="otherSpecify"
            value={values.otherSpecify}
            onChange={handleChange}
            placeholder="อื่นๆ โปรดระบุ"
            disabled={readOnly}
          />

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
    </section>
  );
}
