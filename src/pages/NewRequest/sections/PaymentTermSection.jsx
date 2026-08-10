import { DollarSign } from 'lucide-react';
import TextField from '../../../components/ui/TextField';
import TextAreaField from '../../../components/ui/TextAreaField';
import FormSelect from '../../../components/ui/FormSelect';
import { CURRENCY_OPTIONS, PAYMENT_INSTALLMENTS } from '../constants';
import { formatThousands } from '../../../lib/formatNumber';

export default function PaymentTermSection({ formik, readOnly = false }) {
  const { values, errors, touched, handleChange, handleBlur, setFieldValue } = formik;
  const err = key => (touched[key] ? errors[key] : undefined);

  return (
    <section>
      <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-6 py-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-brand-600 shadow-sm">
          <DollarSign size={19} />
        </span>
        <div>
          <div className="font-bold text-navy">Payment Term</div>
          <div className="text-sm text-slate-500">เงื่อนไขการจ่ายเงิน</div>
        </div>
      </div>

      <div className="space-y-5 p-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <TextField
            label="Total Net Price"
            required
            inputMode="decimal"
            name="totalNetPrice"
            value={values.totalNetPrice}
            onChange={e => setFieldValue('totalNetPrice', formatThousands(e.target.value))}
            onBlur={handleBlur}
            error={err('totalNetPrice')}
            placeholder="0.00"
            disabled={readOnly}
          />
          <TextField
            label="VAT"
            required
            name="vat"
            value={values.vat}
            onChange={handleChange}
            onBlur={handleBlur}
            error={err('vat')}
            placeholder="เช่น 7%"
            disabled={readOnly}
          />
          <FormSelect
            label="Currency"
            required
            options={CURRENCY_OPTIONS}
            value={values.currency}
            onChange={v => setFieldValue('currency', v)}
            error={err('currency')}
            isDisabled={readOnly}
            placeholder="เลือกสกุลเงิน"
          />
          <TextField
            label="Trade Term (Incoterm)"
            required
            name="tradeTerm"
            value={values.tradeTerm}
            onChange={handleChange}
            onBlur={handleBlur}
            error={err('tradeTerm')}
            placeholder="ระบุรายละเอียด เช่น DAP, CIF"
            disabled={readOnly}
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-3 text-xs font-bold tracking-wide text-slate-400">Installment Payment — การจ่ายเงินแบ่งออกเป็นกี่งวด  โปรดระบุรายรายเอียดเงื่อนไขและความสำเร็จในแต่ละงวดงานให้ชัดเจน </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {PAYMENT_INSTALLMENTS.map(({ key, label }) => (
              <TextField
                key={key}
                label={label}
                name={`payments.${key}`}
                value={values.payments[key]}
                onChange={handleChange}
                disabled={readOnly}
              />
            ))}
          </div>
        </div>

        <TextAreaField
          label="Other"
          name="paymentOther"
          value={values.paymentOther}
          onChange={handleChange}
          rows={2}
          placeholder="อื่นๆ เพิ่มเติม โปรดระบุ"
          disabled={readOnly}
        />
      </div>
    </section>
  );
}
