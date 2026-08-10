import { useEffect, useState } from 'react';
import { FileDown, FileText, ClipboardCheck } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import { fetchForms, fetchGlobalDocuments, downloadUploadFile, fileUrl } from '../../lib/api';

export default function DownloadFormPage() {
  const [forms, setForms] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkSheet, setCheckSheet] = useState(null);

  useEffect(() => {
    fetchForms()
      .then(data => {
        setForms(data);
        setActiveId(data[0]?.id ?? null);
      })
      .catch(() => setForms([]))
      .finally(() => setLoading(false));

    fetchGlobalDocuments()
      .then(data => setCheckSheet(data.documents?.find(d => d.docKey === 'check_sheet') || null))
      .catch(() => setCheckSheet(null));
  }, []);

  const activeForm = forms.find(f => f.id === activeId);

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-50">
      <PageContainer>
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-navy">DOWNLOAD FORM</h1>
          <p className="mt-1 text-sm text-slate-500">ดาวน์โหลดแบบฟอร์มสัญญาแยกตามประเภทและรายการเอกสาร</p>
        </div>

        {loading ? (
          <div className="rounded-xl2 border border-slate-200 bg-white py-16 text-center text-slate-400 shadow-card">กำลังโหลดข้อมูล...</div>
        ) : !forms.length ? (
          <div className="rounded-xl2 border border-slate-200 bg-white py-16 text-center text-slate-400 shadow-card">ยังไม่มีแบบฟอร์มในระบบ</div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr] lg:items-start">
            {/* Left: document type list */}
            <aside className="overflow-hidden rounded-xl2 border border-slate-200 bg-white shadow-card">
              {/* <div className="border-b border-slate-100 px-5 py-4">
                <div className="font-bold text-navy">Documents</div>
                <div className="mt-0.5 text-xs text-slate-400">
                  You have {forms.reduce((sum, f) => sum + f.items.length, 0)} documents
                </div>
              </div> */}

              <ul className="divide-y divide-slate-100">
                {forms.map(f => {
                  const active = f.id === activeId;
                  return (
                    <li key={f.id}>
                      <button
                        type="button"
                        onClick={() => setActiveId(f.id)}
                        className={`block w-full border-l-4 px-5 py-4 text-left transition-colors ${
                          active ? 'border-brand-600 bg-brand-50/60' : 'border-transparent hover:bg-slate-50'
                        }`}
                      >
                        <div className={`text-sm font-semibold ${active ? 'text-brand-700' : 'text-navy'}`}>{f.type}</div>
                        <div className="mt-1 truncate text-xs text-slate-400">
                          {/* {f.items.length} form{f.items.length === 1 ? '' : 's'} · */}
                           {f.typeThai}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </aside>

            {/* Right: selected type's items */}
            {!activeForm ? (
              <section className="rounded-xl2 border border-slate-200 bg-white py-16 text-center text-slate-400 shadow-card">
                เลือกประเภทเอกสารเพื่อดูรายการ
              </section>
            ) : (
              <section className="overflow-hidden rounded-xl2 border border-slate-200 bg-white shadow-card">
                <header className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-6 py-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand-600 text-white">
                    <FileText size={19} />
                  </span>
                  <div>
                    <div className="font-bold text-navy">{activeForm.type}</div>
                    {activeForm.typeThai && <div className="whitespace-pre-line text-sm text-slate-500">{activeForm.typeThai}</div>}
                  </div>
                </header>

                {!activeForm.items.length ? (
                  <div className="py-16 text-center text-slate-400">ยังไม่มีแบบฟอร์มในหมวดนี้</div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {activeForm.items.map((item, index) => (
                      <li key={item.id} className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex gap-3">
                          <span className="text-sm font-semibold text-slate-400">{index + 1}.</span>
                          <div>
                            <div className="font-semibold text-navy">{item.name}</div>
                            {item.description && <div className="mt-1 whitespace-pre-line text-sm text-slate-500">{item.description}</div>}
                          </div>
                        </div>

                        <div className="flex shrink-0 gap-2 pl-6 sm:pl-0">
                          {item.files.eng && (
                            <a
                              href={fileUrl(item.files.eng)}
                              download
                              className="flex h-10 items-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:border-brand-300 hover:text-brand-600"
                            >
                              <FileDown size={15} /> ENG
                            </a>
                          )}
                          {item.files.tha && (
                            <a
                              href={fileUrl(item.files.tha)}
                              download
                              className="flex h-10 items-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:border-brand-300 hover:text-brand-600"
                            >
                              <FileDown size={15} /> THA
                            </a>
                          )}
                          {checkSheet?.fileId && (
                            <button
                              type="button"
                              onClick={() => downloadUploadFile(checkSheet.fileId, checkSheet.fileName)}
                              className="flex h-10 items-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-4 text-sm font-semibold text-violet-600 hover:border-violet-300 hover:bg-violet-100"
                            >
                              <ClipboardCheck size={15} /> Check Sheet
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
          </div>
        )}
      </PageContainer>
    </div>
  );
}
