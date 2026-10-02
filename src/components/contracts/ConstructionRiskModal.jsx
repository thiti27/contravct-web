import { useEffect, useState } from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle, Check } from 'lucide-react';
import FormModal from '../ui/FormModal';
import ConfirmModal from '../ui/ConfirmModal';
import { CONSTRUCTION_RISK_ITEMS, HIGH_RISK_REQUIREMENTS, scoreConstructionRisk } from '../../lib/constructionRiskChecklist';

function AnswerCard({ tone, label, description, selected, onSelect }) {
  const toneClasses =
    tone === 'low'
      ? selected
        ? 'border-emerald-400 bg-emerald-50 ring-2 ring-emerald-500/20'
        : 'border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40'
      : selected
        ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-500/20'
        : 'border-slate-200 hover:border-amber-300 hover:bg-amber-50/40';

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex h-full flex-col gap-2 rounded-2xl border p-4 text-left transition-colors ${toneClasses}`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
            selected
              ? tone === 'low'
                ? 'border-emerald-500 bg-emerald-500 text-white'
                : 'border-amber-500 bg-amber-500 text-white'
              : 'border-slate-300'
          }`}
        >
          {selected && <Check size={12} strokeWidth={3} />}
        </span>
        <span className={`text-base font-bold uppercase tracking-wide ${tone === 'low' ? 'text-emerald-700' : 'text-amber-700'}`}>
          {label}
        </span>
      </div>
      <p className="whitespace-pre-line text-base leading-relaxed text-slate-600">{description}</p>
    </button>
  );
}

// Construction Risk Classification Checklist (FOPI-S35-LEG-001-014) — see
// src/lib/constructionRiskChecklist.js for the scoring rules and the exact source
// text. Opened from ContractInfoSection when the selected contract type has
// checkConstructionRisk on; `initial` re-populates a prior assessment so this can be
// reopened to redo the checklist (its own icon in ContractInfoSection) without losing
// the previous answers as a starting point.
export default function ConstructionRiskModal({ open, onClose, onConfirm, header, initial }) {
  const [answers, setAnswers] = useState({});
  const [note, setNote] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAnswers(initial?.answers || {});
    setNote(initial?.note || '');
    setConfirmOpen(false);
  }, [open, initial]);

  if (!open) return null;

  const { score, level, complete } = scoreConstructionRisk(answers);
  const select = (no, value) => setAnswers(prev => ({ ...prev, [no]: value }));

  const handleConfirmYes = () => {
    setConfirmOpen(false);
    onConfirm({
      level,
      score,
      answers,
      snapshot: {
        supplierName: header?.supplierName || '',
        date: header?.date || '',
        assessorName: header?.assessorName || '',
        section: header?.section || '',
        note,
        totalScore: score,
        classification: level === 'high' ? 'HIGH RISK' : 'LOW RISK',
        rows: CONSTRUCTION_RISK_ITEMS.map(item => ({
          no: item.no,
          criteria: item.criteria,
          low: item.low,
          high: item.high,
          selected: answers[item.no] || null,
          score: answers[item.no] === 'low' ? 1 : answers[item.no] === 'high' ? 2 : 0,
        })),
      },
    });
  };

  return (
    <FormModal
      open={open}
      title={
        <div className="text-center leading-snug">
          <div className="text-lg font-bold">Construction Risk Classification Checklist</div>
          <div className="text-base font-medium text-slate-400">แบบตรวจสอบและจัดระดับความเสี่ยงงานก่อสร้าง</div>
        </div>
      }
      centerTitle
      onClose={onClose}
      size="full"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-2xl border border-slate-200 px-6 text-base font-semibold text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={!complete}
            className="flex h-11 items-center gap-2 rounded-2xl bg-brand-600 px-6 text-base font-semibold text-white shadow-soft hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Check size={16} /> Confirm Assessment
          </button>
        </>
      }
    >
      <div
        className={`mt-4 flex flex-wrap items-center gap-4 rounded-2xl border p-4 ${
          complete
            ? level === 'high'
              ? 'border-amber-300 bg-amber-50'
              : 'border-emerald-300 bg-emerald-50'
            : 'border-slate-200 bg-slate-50'
        }`}
      >
        <span
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${
            complete ? (level === 'high' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white') : 'bg-slate-200 text-slate-400'
          }`}
        >
          {complete ? level === 'high' ? <ShieldAlert size={22} /> : <ShieldCheck size={22} /> : <ShieldAlert size={22} />}
        </span>
        <div>
          <div className="text-base font-bold uppercase tracking-wide text-slate-400">Total Score (คะแนนรวม)</div>
          <div className="text-lg font-bold text-navy">
            {score} / 28
            {complete && (
              <span className={`ml-2 text-base ${level === 'high' ? 'text-amber-700' : 'text-emerald-700'}`}>
                — {level === 'high' ? 'HIGH RISK' : 'LOW RISK'}
              </span>
            )}
          </div>
        </div>
        {!complete && (
          <span className="text-base text-slate-400">
            กรุณาเลือก Low Risk หรือ High Risk ให้ครบทั้ง {CONSTRUCTION_RISK_ITEMS.length} ข้อ
          </span>
        )}
      </div>

      {complete && level === 'high' && (
        <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4">
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

      <div className="mt-5 space-y-4">
        {CONSTRUCTION_RISK_ITEMS.map(item => (
          <div key={item.no} className="rounded-2xl border border-slate-100 p-4">
            <div className="mb-3 flex items-start gap-2">
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[16px] font-bold  ">{item.no}</span>
              <span className="whitespace-pre-line text-base font-bold text-navy">{item.criteria}</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <AnswerCard
                tone="low"
                label="Low Risk"
                description={item.low}
                selected={answers[item.no] === 'low'}
                onSelect={() => select(item.no, 'low')}
              />
              <AnswerCard
                tone="high"
                label="High Risk"
                description={item.high}
                selected={answers[item.no] === 'high'}
                onSelect={() => select(item.no, 'high')}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <label className="mb-1.5 block text-base font-bold uppercase tracking-wide  " htmlFor="construction-risk-note">
         Remark/Note for Checklist/More Details 
        </label>
        <textarea
          id="construction-risk-note"
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={3}
          className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-3 text-base text-slate-700 outline-none focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10"
          placeholder="หมายเหตุ หรือรายละเอียดเพิ่มเติมเกี่ยวกับการประเมินความเสี่ยงนี้"
        />
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Confirm Assessment"
        message={`Confirm this Construction Risk Classification result: ${level === 'high' ? 'HIGH RISK' : 'LOW RISK'} (${score}/28)?`}
        onConfirm={handleConfirmYes}
        onCancel={() => setConfirmOpen(false)}
      />
    </FormModal>
  );
}
