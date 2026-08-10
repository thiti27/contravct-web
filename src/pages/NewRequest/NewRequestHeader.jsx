export default function NewRequestHeader({ contractTypeLabel, confidential, contractNo, approver3ApprovedAt }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-5 px-6 py-5">
      <div className="min-w-[180px]">
        <span className="block text-xs font-semibold tracking-wide text-slate-500">Contract Type :</span>
        <span className="mt-1 block min-h-[1.4rem] border-b border-slate-200 pb-1 text-sm font-bold text-blue-600">
          {contractTypeLabel || ' '}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex justify-center">
          <img
            src="/company.png"
            alt="DSST"
            className="h-12 w-auto object-contain"
          />
        </div>
        <div className="border-l border-slate-200 pl-4">
          <div className="text-base font-bold text-navy">Contract Requisition Form</div>
          <div className="text-xs text-slate-500">(แบบฟอร์มร้องขอทำสัญญา)</div>
        </div>
      </div>

      <div className="text-right text-xs">
        <div className="text-sm font-extrabold tracking-wide text-rose-600">{confidential ? 'HIGH CONFIDENTIAL' : 'CONFIDENTIAL'}</div>
        <div className="mt-1 text-slate-500">
          NO:{' '}
          <span className="inline-block w-[120px] border-b border-dotted border-slate-400 text-center font-semibold text-slate-600">
            {contractNo || '-'}
          </span>
        </div>
        <div className="text-slate-500">
          DATE:{' '}
          <span className="inline-block w-[120px] border-b border-dotted border-slate-400 text-center font-semibold text-slate-600">
            {approver3ApprovedAt || '-'}
          </span>
        </div>
      </div>
    </div>
  );
}
