import AsyncSelect from 'react-select/async';
import { useEffect, useMemo, useState } from 'react';
import { UserCheck } from 'lucide-react';
import TextField from '../../../components/ui/TextField';
import RadioGroup from '../../../components/ui/RadioGroup';
import { APPROVER_ROLES, REMARK_OPTIONS } from '../constants';
import { fetchEmployees } from '../../../lib/api';

const toOption = e => ({ value: e.emId, label: `${e.firstName} ${e.lastName}` });

// Debounces loadOptions so fast typing doesn't fire a request per keystroke against
// an employee table with tens of thousands of rows — react-select/async has no
// built-in debounce of its own.
//
// Every superseded call must still settle: react-select awaits the promise it got
// back from loadOptions and keeps the menu in its "loading, no options" state until
// that exact promise resolves. Dropping a superseded resolver on the floor (what
// `clearTimeout` alone did) leaves that select stuck showing nothing, forever. So the
// pending resolvers are queued and all resolved with the latest call's result — which
// is what a search box wants anyway: the newest query's rows win.
function debouncePromise(fn, delay) {
  let timer;
  let pending = [];
  return (...args) =>
    new Promise(resolve => {
      pending.push(resolve);
      clearTimeout(timer);
      timer = setTimeout(() => {
        const resolvers = pending;
        pending = [];
        Promise.resolve(fn(...args))
          // A failed lookup resolves to an empty list rather than rejecting, so the
          // select falls back to "no options" instead of spinning indefinitely.
          .catch(() => [])
          .then(result => resolvers.forEach(r => r(result)));
      }, delay);
    });
}

const makeEmployeeLoader = () =>
  debouncePromise(inputValue => fetchEmployees({ search: inputValue }).then(rows => rows.map(toOption)), 300);

// `values.approvers` is UI row order top-to-bottom: index 0 is the Manager slot,
// index 2 is the bottom Supervisor slot. The approval sequence itself runs bottom
// row upward — the bottom Supervisor slot (index 2) approves first as Approver 1,
// the middle Supervisor slot (index 1) is Approver 2, and the top Manager slot
// (index 0) approves last as Approver 3 — which is why `approverSignatures[index]`
// (and the approvers[]/approverN_em_id mapping on the server, see requestController.js
// and contractRequestHelper.js) is in that same reversed order.
// `highlight`: opt-in brand-tinted border/background on the approver picker cells (via
// the .rs-highlight CSS hook in styles.css — react-select's own control styling is
// already !important-overridden globally, so a plain wrapper class can't beat it without
// matching !important). Off by default so New Request/Edit keep their plain look; only
// LinkedRequestModal (Renew/Amend/Claim Note/Terminate) turns it on, since Contract
// Information there is read-only and this is one of the few things actually fillable.
export default function ApprovalSection({ formik, approverSignatures, readOnly = false, highlight = false }) {
  const { values, errors, touched, handleChange, handleBlur, setFieldValue } = formik;
  const err = key => (touched[key] ? errors[key] : undefined);

  // AsyncSelect only knows about whatever the last search returned — it doesn't hold
  // a full employee list to look a pre-set em_id up in. When editing an existing
  // request, `values.approvers` can already contain em_ids that never appear in a
  // fresh default-10 search, so each one gets resolved to a {value, label} option
  // here (by searching for its own em_id) and cached, purely for display.
  const [resolvedOptions, setResolvedOptions] = useState({});

  // One debounced loader per approver row, never a single shared one: a debounce
  // holds exactly one timer, so three selects sharing it means each one's call
  // cancels the previous select's. All three mount together (each with
  // `defaultOptions`, so each fires a load immediately), which left only the last
  // row ever receiving employees — and afterwards, typing in any row cancelled the
  // others' in-flight lookups too.
  const employeeLoaders = useMemo(() => APPROVER_ROLES.map(makeEmployeeLoader), []);

  useEffect(() => {
    values.approvers.forEach(emId => {
      if (!emId || resolvedOptions[emId]) return;
      fetchEmployees({ search: emId }).then(rows => {
        const match = rows.find(r => r.emId === emId);
        if (match) setResolvedOptions(prev => ({ ...prev, [emId]: toOption(match) }));
      });
    });
    // Re-run only when the actual set of selected em_ids changes, not on every
    // keystroke elsewhere in the form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.approvers.join(',')]);

  const setApprover = (index, option) => {
    const next = [...values.approvers];
    next[index] = option ? option.value : '';
    setFieldValue('approvers', next);
    if (option) setResolvedOptions(prev => ({ ...prev, [option.value]: option }));
  };

  return (
    <section>
      <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-6 py-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-brand-600 shadow-sm">
          <UserCheck size={19} />
        </span>
        <div>
          <div className="font-bold text-navy">Section Approval</div>
          <div className="text-sm text-slate-500">การอนุมัติภายในแผนก</div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <TextField
            label="Requestor Name"
            required
            disabled
            name="requestorName"
            value={values.requestorName}
            onChange={handleChange}
            onBlur={handleBlur}
            error={err('requestorName')}
            placeholder="ชื่อผู้ร้องขอ (ดึงจากข้อมูลผู้ใช้งาน)"
          />
          <TextField
            label="Section"
            required
            disabled
            name="requestorSection"
            value={values.requestorSection}
            onChange={handleChange}
            onBlur={handleBlur}
            error={err('requestorSection')}
            placeholder="แผนก (ดึงจากข้อมูลผู้ใช้งาน)"
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* data-field powers scrollToField (see lib/formScroll.js) — `approvers` is an
              array field with no single input of its own, so this wraps the whole
              picker block instead of a single FieldShell. */}
          <div className="overflow-hidden rounded-2xl border border-slate-200" data-field="approvers">
            <div className="grid grid-cols-[1fr_2fr] bg-slate-100 text-xs font-bold tracking-wide text-slate-500">
              <div className="px-4 py-3">Approved by</div>
              <div className="px-4 py-3">Signature</div>
            </div>
            {APPROVER_ROLES.map((role, index) => {
              const emId = values.approvers[index];
              const selected = emId ? resolvedOptions[emId] ?? null : null;
              const signature = approverSignatures?.[index];
              // Whether this slot has actually approved (approverN_approved_at is set),
              // not an inference from the request's overall status — a slot that's
              // signed off stays a read-only name/date forever, regardless of what
              // happens to the request afterward.
              const isLocked = !!signature?.approvedAt;
              return (
                <div key={index} className="grid grid-cols-[1fr_2fr] items-center border-t border-slate-200">
                  <div className="px-4 py-3 text-sm font-semibold text-slate-600">
                    {role}
                    {index !== 1 && <span className="text-rose-500"> *</span>}
                  </div>
                  <div className="px-4 py-3">
                    {isLocked ? (
                      <div className="flex h-11 items-center rounded-2xl border border-slate-200 bg-slate-100 px-3 text-sm text-slate-500">
                        {signature?.name ? `${signature.name} ${signature.approvedAt || ''}`.trim() : '-'}
                      </div>
                    ) : (
                      <>
                        <div
                          className={`${touched.approvers && errors.approvers?.[index] ? 'field-error' : ''} ${
                            highlight ? 'rs-highlight' : ''
                          }`}
                        >
                          <AsyncSelect
                            classNamePrefix="rs"
                            isClearable
                            cacheOptions
                            defaultOptions
                            placeholder="เลือกพนักงานผู้อนุมัติ..."
                            value={selected}
                            onChange={option => setApprover(index, option)}
                            loadOptions={employeeLoaders[index]}
                            isDisabled={readOnly}
                            menuPortalTarget={document.body}
                            maxMenuHeight={190}
                            styles={{ menuPortal: base => ({ ...base, zIndex: 60 }) }}
                          />
                        </div>
                        {touched.approvers && errors.approvers?.[index] && (
                          <p className="mt-1 text-xs font-medium text-rose-500">{errors.approvers[index]}</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <RadioGroup label="REMARK" name="remark" options={REMARK_OPTIONS} value={values.remark} onChange={() => {}} disabled />
          </div>
        </div>
      </div>
    </section>
  );
}
