import { Fragment, useEffect, useState } from 'react';
import { CalendarClock, ChevronDown, ChevronUp, Info, Send } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useAuth } from '../../context/AuthContext';
import {
  fetchDraftedTrackingPreview,
  fetchExpirationReminderPreview,
  sendExpirationReminderNow,
  sendDraftedTrackingNow,
  sendDraftedTrackingFinalReminderNow,
} from '../../lib/api';
import { formatDateOnly, formatDateTime } from '../../lib/formatDate';

const SUB_TABS = [
  { key: 'drafted', label: 'Overdue Contract Requests (Drafted Tracking)' },
  { key: 'expiration', label: 'Contract Expiration Reminder' },
];

const SEND_STATUS_BADGE = {
  today: { label: 'Due Today', className: 'bg-amber-100 text-amber-700' },
  passed: { label: 'Reminder Date Passed', className: 'bg-rose-100 text-rose-700' },
  expired: { label: 'Expired', className: 'bg-slate-200 text-slate-600' },
  upcoming: { label: 'Upcoming', className: 'bg-emerald-100 text-emerald-700' },
};

function CcList({ approvers, legal }) {
  const approverNames = approvers.map(a => a.name).join(', ');
  const legalNames = legal.map(l => l.name).join(', ');
  return (
    <div className="text-base text-slate-500">
      <div><span className="font-medium text-slate-600">Approvers:</span> {approverNames || '-'}</div>
      <div><span className="font-medium text-slate-600">Legal:</span> {legalNames || '-'}</div>
    </div>
  );
}

function DraftedTrackingView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openSections, setOpenSections] = useState(() => new Set());
  const [pending, setPending] = useState(null); // { section, round, final } awaiting confirm, or null
  const [sendingKey, setSendingKey] = useState(null); // `${section}_${round}_${final}` currently in flight
  const [sendError, setSendError] = useState('');

  const load = () => {
    setLoading(true);
    return fetchDraftedTrackingPreview()
      .then(res => setData(res))
      .catch(() => setError('โหลดข้อมูลไม่สำเร็จ'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = section => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  const handleConfirmSend = async () => {
    if (!pending) return;
    const key = `${pending.section.section}_${pending.round.key}_${pending.final}`;
    setSendingKey(key);
    setSendError('');
    try {
      const sendFn = pending.final ? sendDraftedTrackingFinalReminderNow : sendDraftedTrackingNow;
      await sendFn(pending.section.section, pending.round.key);
      await load();
    } catch (err) {
      setSendError(err.response?.data?.message || 'ส่งอีเมลไม่สำเร็จ');
    } finally {
      setPending(null);
      setSendingKey(null);
    }
  };

  if (loading) return <div className="py-16 text-center text-slate-400">กำลังโหลด...</div>;
  if (error) return <div className="py-16 text-center text-rose-500">{error}</div>;
  if (!data) return null;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {data.rounds.map(round => (
          <div
            key={round.key}
            className={`rounded-xl2 border p-4 shadow-card ${round.isToday ? 'border-brand-400 bg-brand-50/60' : 'border-slate-200 bg-white'}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-navy">{round.key.replace('round', 'Round ')}</span>
              {round.isToday && <span className="rounded-full bg-brand-500 px-2.5 py-1 text-base font-semibold text-white">Fires Today</span>}
            </div>
            <div className="mt-2 text-base text-slate-500">Fire date: <span className="font-medium text-slate-700">1-{round.fireDate.split('-')[1]}</span></div>
            <div className="text-base text-slate-500">Deadline shown: <span className="font-medium text-slate-700">{round.deadline}</span></div>
          </div>
        ))}
      </div>
      {/* <p className="text-base text-slate-400">ทั้ง 3 รอบส่งข้อมูลชุดเดียวกัน คือทุกสัญญาที่ยัง Drafted อยู่ ณ วันนั้นของแต่ละแผนก (ไม่ได้กรองตามวันที่ขอสัญญา) — Round มีไว้เป็นแค่รอบแจ้งเตือน</p> */}

      <div className="rounded-xl2 border border-slate-200 bg-white shadow-card">
        <div className="border-b border-slate-100 px-5 py-3 text-base font-semibold text-navy">
          Sections with Drafted contracts ({data.sections.length})
        </div>
        {data.sections.length === 0 && (
          <div className="py-16 text-center text-slate-400">ไม่มีสัญญาที่ยัง Drafted อยู่ในขณะนี้</div>
        )}
        <div className="divide-y divide-slate-100">
          {data.sections.map(section => {
            const open = openSections.has(section.section);
            return (
              <div key={section.section}>
                <button
                  type="button"
                  onClick={() => toggle(section.section)}
                  className="flex w-full items-center justify-between px-5 py-3 text-left hover:bg-slate-50"
                >
                  <div>
                    <div className="text-base font-medium text-navy">{section.section}</div>
                    <div className="text-base text-slate-500">
                      {section.requestors.length} requestor(s) · {section.contractCount} contract(s)
                    </div>
                  </div>
                  {open ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                </button>
                {open && (
                  <div className="space-y-3 bg-slate-50/60 px-5 pb-4">
                    <div className="text-base text-slate-500">
                      <span className="font-medium text-slate-600">Requestors (TO):</span> {section.requestors.map(r => r.name).join(', ')}
                    </div>
                    <CcList approvers={section.ccApprovers} legal={section.ccLegal} />

                    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                      <table className="w-full text-left text-base">
                        <thead className="bg-slate-50 text-slate-500">
                          <tr>
                            <th className="px-3 py-2 font-medium">Round</th>
                            <th className="px-3 py-2 font-medium">Stage</th>
                            <th className="px-3 py-2 font-medium">Date</th>
                            <th className="px-3 py-2 font-medium">Sent</th>
                            <th className="px-3 py-2 font-medium">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-black">
                          {section.rounds.map(round => {
                            const key = `${section.section}_${round.key}_false`;
                            const finalKey = `${section.section}_${round.key}_true`;
                            return (
                              <Fragment key={round.key}>
                                <tr>
                                  <td className="px-3 py-2" rowSpan={2}>{round.key.replace('round', 'Round ')}</td>
                                  <td className="px-3 py-2">Overdue Notice</td>
                                  <td className="px-3 py-2">1-{round.fireDate.split('-')[1]}</td>
                                  <td className="px-3 py-2">
                                    {round.sentAt ? (
                                      <span className="text-emerald-600">{formatDateTime(round.sentAt)}</span>
                                    ) : (
                                      <span className="text-slate-400">{round.eligible ? 'ยังไม่ส่ง' : 'ยังไม่ถึงรอบ'}</span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2">
                                    <button
                                      type="button"
                                      onClick={() => { setSendError(''); setPending({ section, round, final: false }); }}
                                      disabled={!round.eligible || sendingKey === key}
                                      className="inline-flex items-center gap-1 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1.5 text-base font-semibold text-brand-700 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      <Send size={12} />
                                      {round.sentAt ? 'Resend' : 'Send'}
                                    </button>
                                  </td>
                                </tr>
                                <tr>
                                  <td className="px-3 py-2 font-semibold text-rose-600">FINAL REMINDER</td>
                                  <td className="px-3 py-2">{round.deadline}</td>
                                  <td className="px-3 py-2">
                                    {round.finalReminderSentAt ? (
                                      <span className="text-emerald-600">{formatDateTime(round.finalReminderSentAt)}</span>
                                    ) : (
                                      <span className="text-slate-400">{round.finalReminderEligible ? 'ยังไม่ส่ง' : 'ยังไม่ถึงรอบ'}</span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2">
                                    <button
                                      type="button"
                                      onClick={() => { setSendError(''); setPending({ section, round, final: true }); }}
                                      disabled={!round.finalReminderEligible || sendingKey === finalKey}
                                      className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-base font-semibold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      <Send size={12} />
                                      {round.finalReminderSentAt ? 'Resend' : 'Send'}
                                    </button>
                                  </td>
                                </tr>
                              </Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                      <table className="w-full text-left text-base">
                        <thead className="bg-slate-50 text-slate-500">
                          <tr>
                            <th className="px-3 py-2 font-medium">Contract No.</th>
                            <th className="px-3 py-2 font-medium">Supplier</th>
                            <th className="px-3 py-2 font-medium">Contract Type</th>
                            <th className="px-3 py-2 font-medium">Requestor</th>
                            <th className="px-3 py-2 font-medium">Remark</th>
                            <th className="px-3 py-2 font-medium">Request Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-black">
                          {section.contracts.map(c => (
                            <tr key={c.id}>
                              <td className="px-3 py-2">{c.contractNo || '-'}</td>
                              <td className="px-3 py-2">{c.supplierName}</td>
                              <td className="px-3 py-2">{c.contractType || '-'}</td>
                              <td className="px-3 py-2">{c.requestorName || '-'}</td>
                              <td className="px-3 py-2">{c.remarkLabel || '-'}</td>
                              <td className="px-3 py-2">{formatDateOnly(c.requestDate)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <ConfirmModal
        open={!!pending}
        title={pending?.final ? 'Send FINAL REMINDER now?' : 'Send Drafted Tracking now?'}
        message={
          pending
            ? `จะส่งอีเมล${pending.final ? ' FINAL REMINDER ' : ''}จริงไปยัง Requestor ทั้งหมดของ ${pending.section.section} (${pending.round.key.replace('round', 'Round ')}, ${pending.section.contractCount} contract(s)) ทันที ใช้สำหรับทดสอบ ยืนยันหรือไม่?`
            : ''
        }
        busy={!!pending && sendingKey === `${pending.section.section}_${pending.round.key}_${pending.final}`}
        onConfirm={handleConfirmSend}
        onCancel={() => setPending(null)}
      />
      {sendError && <p className="text-base font-medium text-rose-500">{sendError}</p>}
    </div>
  );
}

function ExpirationReminderView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingItem, setPendingItem] = useState(null); // item awaiting confirm, or null
  const [sendingId, setSendingId] = useState(null);
  const [sendError, setSendError] = useState('');

  const load = () => {
    setLoading(true);
    return fetchExpirationReminderPreview()
      .then(res => setData(res))
      .catch(() => setError('โหลดข้อมูลไม่สำเร็จ'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleConfirmSend = async () => {
    if (!pendingItem) return;
    setSendingId(pendingItem.id);
    setSendError('');
    try {
      await sendExpirationReminderNow(pendingItem.id);
      await load();
    } catch (err) {
      setSendError(err.response?.data?.message || 'ส่งอีเมลไม่สำเร็จ');
    } finally {
      setPendingItem(null);
      setSendingId(null);
    }
  };

  if (loading) return <div className="py-16 text-center text-slate-400">กำลังโหลด...</div>;
  if (error) return <div className="py-16 text-center text-rose-500">{error}</div>;
  if (!data) return null;

  return (
    <div className="space-y-3">
      {/* <p className="text-base text-slate-400">
        เงื่อนไข: has_expiry = 1 และ auto_renewal = 0 — คอลัมน์ <span className="font-semibold text-brand-600">Notify Date</span> คำนวณจาก Expire Date ลบด้วย Reminder (days before)
        เช่น Expire Date 2026-09-16 กับ Reminder 15 วัน จะได้ Notify Date = 2026-09-01
      </p> */}
      <div className="rounded-xl2 border border-slate-200 bg-white shadow-card">
      <div className="border-b border-slate-100 px-5 py-3 text-base font-semibold text-navy">
        Contracts eligible for expiration reminder ({data.items.length})
      </div>
      {data.items.length === 0 && (
        <div className="py-16 text-center text-slate-400">ไม่มีสัญญาที่เข้าเงื่อนไข has_expiry / no auto renewal</div>
      )}
      {data.items.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-base">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Contract No.</th>
                <th className="px-4 py-2 font-medium">Supplier</th>
                <th className="px-4 py-2 font-medium">Contract Type</th>
                <th className="px-4 py-2 font-medium">Purpose</th>
                <th className="px-4 py-2 font-medium">Expire Date</th>
                <th className="px-4 py-2 font-medium">Reminder (days before)</th>
                <th className="px-4 py-2 font-medium">Notify Date</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Sent</th>
                <th className="px-4 py-2 font-medium">Requestor</th>
                <th className="px-4 py-2 font-medium">CC Preview</th>
                <th className="px-4 py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-black">
              {data.items.map(item => {
                const badge = SEND_STATUS_BADGE[item.sendStatus];
                return (
                  <tr key={item.id}>
                    <td className="px-4 py-2">{item.contractNo || '-'}</td>
                    <td className="px-4 py-2">{item.supplierName}</td>
                    <td className="px-4 py-2">{item.contractType || '-'}</td>
                    <td className="px-4 py-2">{item.purpose || '-'}</td>
                    <td className="px-4 py-2">{formatDateOnly(item.expireDate)}</td>
                    <td className="px-4 py-2">{item.reminderDays}</td>
                    <td className="px-4 py-2 font-semibold text-brand-600">{item.targetSendDate}</td>
                    <td className="px-4 py-2">
                      <span className={`rounded-full px-2.5 py-1 text-base font-semibold ${badge.className}`}>{badge.label}</span>
                    </td>
                    <td className="px-4 py-2">
                      {item.sentAt ? (
                        <span className="text-emerald-600">{formatDateTime(item.sentAt)}</span>
                      ) : (
                        <span className="text-slate-400">ยังไม่ส่ง</span>
                      )}
                    </td>
                    <td className="px-4 py-2">{item.requestorName}</td>
                    <td className="px-4 py-2"><CcList approvers={item.ccApprovers} legal={item.ccLegal} /></td>
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={() => { setSendError(''); setPendingItem(item); }}
                        disabled={sendingId === item.id}
                        className="inline-flex items-center gap-1 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1.5 text-base font-semibold text-brand-700 hover:bg-brand-100 disabled:opacity-50"
                      >
                        <Send size={12} />
                        {item.sentAt ? 'Resend' : 'Send'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      </div>

      <ConfirmModal
        open={!!pendingItem}
        title="Send Expiration Reminder now?"
        message={
          pendingItem
            ? `จะส่งอีเมลจริงไปยัง ${pendingItem.requestorName} (Contract No. ${pendingItem.contractNo}) ทันที ใช้สำหรับทดสอบ ยืนยันหรือไม่?`
            : ''
        }
        busy={sendingId === pendingItem?.id}
        onConfirm={handleConfirmSend}
        onCancel={() => setPendingItem(null)}
      />
      {sendError && <p className="text-base font-medium text-rose-500">{sendError}</p>}
    </div>
  );
}

export default function ScheduledEmailMonitorTab() {
  const { user } = useAuth();
  const [subTab, setSubTab] = useState('drafted');

  if (!user?.legal) {
    return (
      <PageContainer>
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-navy">EMAIL MONITOR</h1>
          <p className="mt-1 text-base text-slate-500">Preview การคำนวณอีเมลอัตโนมัติ</p>
        </div>
        <div className="rounded-xl2 border border-slate-200 bg-white py-16 text-center text-slate-400 shadow-card">
          คุณไม่มีสิทธิ์เข้าถึงหน้านี้
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mb-5   flex items-center gap-2">
        <CalendarClock className="text-brand-500" size={26} />
        <div>
          <h1 className="text-2xl font-bold text-navy">EMAIL MONITOR</h1>
          <p className="mt-1 text-base ">ดูข้อมูลที่ระบบคำนวณไว้สำหรับอีเมลอัตโนมัติ ก่อนเปิดใช้งานส่งจริง</p>
        </div>
      </div>

      {/* <div className="mb-4 flex items-start gap-2 rounded-xl2 border border-sky-200 bg-sky-50 px-4 py-3 text-base text-sky-700">
        <Info size={16} className="mt-0.5 shrink-0" />
        <span>หน้านี้แสดงผลการคำนวณแบบ Live ตามข้อมูลปัจจุบัน เพื่อใช้ตรวจสอบ Logic เท่านั้น ระบบยังไม่ได้เปิดใช้งานการส่งอีเมลอัตโนมัติจริง</span>
      </div> */}

      <div className="mb-4 flex gap-2 border-b border-slate-200">
        {SUB_TABS.map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setSubTab(tab.key)}
            className={`-mb-px border-b-2 px-3 py-2 text-base font-medium transition-colors ${
              subTab === tab.key ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {subTab === 'drafted' ? <DraftedTrackingView /> : <ExpirationReminderView />}
    </PageContainer>
  );
}
