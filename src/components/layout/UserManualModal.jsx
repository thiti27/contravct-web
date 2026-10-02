import { createContext, useContext, useState } from 'react';
import {
  X,
  Info,
  Home,
  Clock3,
  CheckSquare,
  Scale,
  Settings,
  FileDown,
  Download,
  Search,
  FilePlus2,
  CircleCheck,
  Upload,
  ChevronDown,
  Check,
  Save,
  Send,
  Undo2,
  Ban,
  MoreVertical,
  UploadCloud,
  RefreshCw,
  FileEdit,
  MessageSquare,
  MapPin,
} from 'lucide-react';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';
import { HOME_STEPS } from '../../pages/Home/steps';
import { JOB_STATUS_TABS, LEGAL_TABS, SETTINGS_TABS } from '../../lib/nav';

// Current manual language ('th' | 'en'), read by every preview sub-component below via
// useLang() — those are often embedded as ready-made JSX inside SECTIONS (built once at
// module load, not per-render), so they can't receive `lang` as an ordinary prop from a
// render call site; Context is what lets them still reflect the current toggle, since
// React re-invokes each component function on every render regardless of where its
// element object was created.
const LangContext = createContext('th');
const useLang = () => useContext(LangContext);

// Resolves a string, or a {th, en} bilingual object, to the current language. Most short
// labels (contract field names, nav labels like "Home") are the same in both languages
// and stay plain strings; the actual prose (intros, descriptions, bullet points) uses the
// {th, en} object form.
const pick = (val, lang) => {
  if (val && typeof val === 'object' && !Array.isArray(val)) return val[lang] ?? val.th ?? '';
  return val;
};

// Non-interactive mockup of one real form field (TextField/FormSelect/FieldShell's own
// label-above-input shape, see src/components/ui/) — so "where do I type this" has an
// actual picture next to it instead of just a field name in a bullet list. Static only:
// no formik, no state, nothing here is ever submitted anywhere. Field labels are kept in
// English in both languages, matching the real form (its own labels are never Thai).
function FieldPreview({ label, required, placeholder, type = 'text' }) {
  // Called unconditionally (rules-of-hooks) even though only the 'upload' branch below
  // reads it — type is fixed per usage in practice, but a hook can't sit after an early
  // return.
  const lang = useLang();
  if (type === 'checkbox') {
    return (
      <div className="flex items-center gap-2 text-base font-semibold text-slate-600">
        <span className="grid h-4 w-4 shrink-0 place-items-center rounded border border-slate-300 bg-white" />
        {label}
      </div>
    );
  }
  if (type === 'upload') {
    return (
      <div className="sm:col-span-3">
        <div className="flex items-center gap-2 text-base font-semibold text-slate-600">
          <span className="grid h-4 w-4 shrink-0 place-items-center rounded border border-brand-400 bg-brand-50">
            <Check size={10} className="text-brand-600" />
          </span>
          {label}
        </div>
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white px-2.5 py-2 text-base text-slate-400">
          <Upload size={13} className="shrink-0 text-slate-400" /> {lang === 'th' ? 'แนบไฟล์ได้หลายไฟล์' : 'Attach multiple files'}
          <span className="ml-auto shrink-0 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-base font-semibold text-slate-600">
            {lang === 'th' ? 'เลือกไฟล์' : 'Choose File'}
          </span>
        </div>
      </div>
    );
  }
  return (
    <div>
      <span className="mb-1 block text-base font-semibold tracking-wide text-slate-400">
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </span>
      {type === 'textarea' ? (
        <div className="h-14 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-base text-slate-400">{placeholder}</div>
      ) : type === 'select' ? (
        <div className="flex h-8 w-full items-center justify-between gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-base text-slate-400">
          <span className="truncate">{placeholder}</span>
          <ChevronDown size={12} className="shrink-0 text-slate-300" />
        </div>
      ) : (
        <div className="flex h-8 w-full items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-base text-slate-400">{placeholder}</div>
      )}
    </div>
  );
}

// Wraps any mockup in the same labelled box every preview helper uses — the label itself
// ("ตัวอย่างหน้าจอ" / "Screen Preview") switches with the language toggle.
function PreviewBox({ children }) {
  const lang = useLang();
  return (
    <div className="mt-3 rounded-xl border border-dashed border-brand-200 bg-brand-50/30 p-3.5">
      <div className="mb-2.5 text-base font-bold uppercase tracking-wide text-brand-500">{lang === 'th' ? 'ตัวอย่างหน้าจอ' : 'Screen Preview'}</div>
      {children}
    </div>
  );
}

// Boxed preview panel wrapping a grid of FieldPreviews, attached to a manual block via
// its `preview` array.
function PreviewPanel({ fields }) {
  return (
    <PreviewBox>
      <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 sm:grid-cols-3 lg:grid-cols-4">
        {fields.map((f, i) => (
          <FieldPreview key={i} {...f} />
        ))}
      </div>
    </PreviewBox>
  );
}

// Same idea as PreviewPanel but for a block that mocks up buttons rather than fields
// (Save Draft / Send Request, Approve/Return/Reject, ...) — attached via a block's
// `previewButtons` array. `className` on an individual button overrides the plain
// outline/solid default, for buttons with their own color (Approve's green, Reject's
// rose, Check Sheet's violet — matching each one's real color in the app).
function ButtonsPreview({ buttons }) {
  return (
    <PreviewBox>
      <div className="flex flex-wrap justify-end gap-2.5">
        {buttons.map((b, i) => {
          const BtnIcon = b.icon;
          return (
            <span
              key={i}
              className={`flex h-9 items-center gap-1.5 rounded-xl px-4 text-base font-semibold ${
                b.className || (b.variant === 'solid' ? 'bg-brand-600 text-white shadow-soft' : 'border border-slate-200 bg-white text-slate-600')
              }`}
            >
              {BtnIcon && <BtnIcon size={14} />} {b.label}
            </span>
          );
        })}
      </div>
    </PreviewBox>
  );
}

// Mocks one Home page StepsNav tile (see src/pages/Home/StepsNav.jsx) — icon chip +
// title + description, same shapes/colors as the real button.
function TilePreview({ icon: Icon, title, desc }) {
  // title/desc may be a plain string or a {th, en} bilingual object (the Home section
  // passes the same bilingual `desc` it uses for the block's own prose) — pick()
  // resolves either; rendering the raw object directly crashed the app the moment the
  // Home section opened ("Objects are not valid as a React child").
  const lang = useLang();
  return (
    <PreviewBox>
      <div className="flex items-center gap-3 rounded-xl2 border border-slate-200 bg-white p-3.5 shadow-card">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand-600 text-white">
          <Icon size={18} />
        </span>
        <div>
          <div className="text-base font-bold text-navy">{pick(title, lang)}</div>
          <div className="mt-0.5 text-base text-slate-500">{pick(desc, lang)}</div>
        </div>
      </div>
    </PreviewBox>
  );
}

const STATUS_TONE = {
  brand: 'bg-brand-50 text-brand-600',
  amber: 'bg-amber-50 text-amber-700',
  green: 'bg-emerald-50 text-emerald-700',
  slate: 'bg-slate-100 text-slate-500',
  rose: 'bg-rose-50 text-rose-600',
};

// Small status pill matching StatusBadge's own color language (see
// src/components/ui/StatusBadge.jsx) — used as a cell value inside TablePreview below.
function StatusPill({ label, tone = 'slate' }) {
  return <span className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-base font-bold ${STATUS_TONE[tone]}`}>{label}</span>;
}

// Mocks a compact slice of a real list page (ContractTable.jsx) — header row + a
// couple of sample rows — reused by every "list" menu (Job Status/Approval/Legal) so
// the manual shows the actual table shape instead of describing it in prose alone.
function TablePreview({ columns, rows }) {
  const gridStyle = { gridTemplateColumns: `repeat(${columns.length}, minmax(0,1fr))` };
  return (
    <PreviewBox>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div
          className="grid gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 text-[9px] font-bold uppercase tracking-wide text-slate-400"
          style={gridStyle}
        >
          {columns.map((c, i) => (
            <div key={i} className="truncate">
              {c}
            </div>
          ))}
        </div>
        {rows.map((row, ri) => (
          <div
            key={ri}
            className={`grid items-center gap-2 px-3 py-2 text-base text-slate-600 ${ri !== rows.length - 1 ? 'border-b border-slate-100' : ''}`}
            style={gridStyle}
          >
            {row.map((cell, ci) => (
              <div key={ci} className="truncate">
                {cell}
              </div>
            ))}
          </div>
        ))}
      </div>
    </PreviewBox>
  );
}

// Mocks a nav item carrying a red count badge (see Header.jsx's NavBadge).
function BadgePreview({ label, count }) {
  return (
    <PreviewBox>
      <div className="flex w-fit items-center gap-1.5 rounded-xl bg-brand-50 px-4 py-2 text-base font-semibold text-brand-600">
        {label}
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-base font-bold leading-none text-white">
          {count}
        </span>
      </div>
    </PreviewBox>
  );
}

// Mocks the real row-level "More" dropdown (see ContractTable.jsx's MoreMenu) — a
// narrow white list card, icon + label per row, red text for destructive items
// (Terminate). `items` is [{ icon, label, tone? }], tone 'rose' matches Terminate's
// real color; everything else uses the menu's plain slate-600 text.
function MenuListPreview({ items }) {
  return (
    <PreviewBox>
      <div className="w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-card">
        {items.map((item, i) => {
          const ItemIcon = item.icon;
          return (
            <div
              key={i}
              className={`flex w-full items-center justify-start gap-2 px-4 py-2 text-left text-base ${item.tone === 'rose' ? 'text-rose-600' : 'text-slate-600'}`}
            >
              <ItemIcon size={14} /> {item.label}
            </div>
          );
        })}
      </div>
    </PreviewBox>
  );
}

// Renders one section's label/intro/blocks/extra — shared by the on-screen single-
// section view (just `active`) and the print/PDF view (every section, stacked, via
// window.print()'s own browser dialog — see the bottom of the component below).
function SectionContent({ section, lang }) {
  return (
    <>
      <h3 className="text-xl font-bold text-navy">{pick(section.label, lang)}</h3>
      <p className="mt-2 text-base text-slate-500">{pick(section.intro, lang)}</p>

      <div className="mt-6 flex flex-col gap-3">
        {section.blocks.map((block, i) => {
          const titleText = pick(block.title, lang);
          const BlockIcon = block.icon || STEP_ICONS[titleText] || STEP_ICONS[pick(block.title, 'th')];
          return (
            <div key={i} className="rounded-xl2 border border-slate-200 bg-white p-5 shadow-card print:break-inside-avoid">
              <div className="flex items-center gap-2.5">
                {BlockIcon && (
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <BlockIcon size={16} />
                  </span>
                )}
                <div className="text-base font-bold text-navy">{titleText}</div>
              </div>
              <p className="mt-2.5 text-base leading-relaxed text-slate-600">{pick(block.desc, lang)}</p>
              {block.bullets && (
                <ul className="mt-3 list-inside list-disc space-y-1.5 text-base text-slate-600">
                  {block.bullets.map((b, bi) => (
                    <li key={bi}>{pick(b, lang)}</li>
                  ))}
                </ul>
              )}
              {block.preview && <PreviewPanel fields={block.preview} />}
              {block.previewButtons && <ButtonsPreview buttons={block.previewButtons} />}
              {block.customPreview}
            </div>
          );
        })}
      </div>

      {section.extra && (
        <div className="mt-6 flex flex-col gap-3">
          <div className="text-base font-bold uppercase tracking-wide text-slate-400">
            {lang === 'th' ? 'รายละเอียดแต่ละขั้นตอน' : 'Each Step in Detail'}
          </div>
          {section.extra.map((block, i) => (
            <div key={i} className="rounded-xl2 border border-slate-200 bg-white p-5 shadow-card print:break-inside-avoid">
              <div className="text-base font-bold text-navy">{pick(block.title, lang)}</div>
              <p className="mt-2 text-base leading-relaxed text-slate-600">{pick(block.desc, lang)}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// One section per real menu in the app (same grouping as Header.jsx's nav + the Home
// steps) so "browsing the manual" mirrors browsing the app itself — clicking "Job
// Status" here shows the same three tabs the real Job Status dropdown has, etc.
// Content is written from what this app's own screens actually do (filters, row
// actions, statuses) — not generic placeholder copy. Prose fields use {th, en}; short
// labels that are identical in both languages (nav/field names) stay plain strings.
const SECTIONS = [
  {
    key: 'overview',
    label: { th: 'ภาพรวมระบบ', en: 'Overview' },
    icon: Info,
    intro: {
      th: 'Contract Online System ใช้จัดการวงจรชีวิตของสัญญาทั้งหมด ตั้งแต่ร้องขอจัดทำ ไปจนถึงอนุมัติ ตรวจสอบทางกฎหมาย จัดทำ และจัดเก็บสัญญาที่ลงนามแล้ว',
      en: "Contract Online System manages a contract's entire lifecycle — from the initial request, through approval and legal review, to drafting and archiving the signed document.",
    },
    blocks: [
      {
        title: { th: 'ลำดับขั้นตอนโดยทั่วไป', en: 'Typical Workflow' },
        desc: {
          th: 'สัญญาหนึ่งฉบับจะไหลผ่านขั้นตอนเหล่านี้ตามลำดับ (เมนูที่เกี่ยวข้องอยู่ในวงเล็บ):',
          en: 'A contract moves through these stages in order (the related menu is in parentheses):',
        },
        bullets: [
          { th: 'สร้างคำร้องขอจัดทำสัญญา — New Request (หน้า Home)', en: 'Create a contract request — New Request (Home page)' },
          { th: 'รออนุมัติจากผู้มีอำนาจ — Approval > Waiting Approve', en: 'Wait for approval — Approval > Waiting Approve' },
          { th: 'ตรวจสอบทางกฎหมาย — Legal > Waiting Check', en: 'Legal review — Legal > Waiting Check' },
          { th: 'จัดทำสัญญาและติดตามสถานะ — Home > Contract Making', en: 'Draft the contract and track its status — Home > Contract Making' },
          { th: 'อัปโหลดสัญญาที่ลงนามแล้วเพื่อจัดเก็บ — Home > Upload Contract', en: 'Upload the signed contract to archive it — Home > Upload Contract' },
        ],
        customPreview: (
          <PreviewBox>
            <div className="flex flex-wrap items-center gap-2 text-base font-semibold text-brand-600">
              {['New Request', 'Approval', 'Legal Check', 'Contract Making', 'Upload Contract'].map((s, i, arr) => (
                <span key={s} className="flex items-center gap-2">
                  <span className="whitespace-nowrap rounded-full bg-brand-50 px-3 py-1.5">{s}</span>
                  {i < arr.length - 1 && <span className="text-slate-300">&rarr;</span>}
                </span>
              ))}
            </div>
          </PreviewBox>
        ),
      },
      {
        title: { th: 'ติดตามงานของคุณ', en: 'Tracking Your Work' },
        desc: {
          th: 'เมนู Job Status คือจุดรวมของงานที่คุณเป็นคนสร้างเอง ไม่ว่าจะอยู่ขั้นตอนไหนก็ตาม ส่วน Find Contract (หน้า Home) ใช้ค้นหาสัญญาทุกฉบับในระบบที่คุณมีสิทธิ์เห็น',
          en: "Job Status is where every request you created lives, no matter what stage it's in. Find Contract (on the Home page) searches every contract in the system you have permission to see.",
        },
      },
      {
        title: { th: 'ตัวเลขสีแดงบนเมนู', en: 'Red Badge Numbers' },
        desc: {
          th: 'ตัวเลข badge สีแดงข้างเมนู (เช่น Job Status, Approval, Legal) คือจำนวนรายการที่รอให้คุณดำเนินการอยู่ ณ ตอนนี้ — อัปเดตอัตโนมัติ',
          en: 'The red badge number next to a menu (Job Status, Approval, Legal) is how many items are waiting on you right now — it updates automatically.',
        },
        customPreview: <BadgePreview label="Job Status" count={3} />,
      },
    ],
  },
  {
    key: 'home',
    label: 'Home',
    icon: Home,
    intro: { th: 'หน้าแรกของระบบ รวม 4 ขั้นตอนหลักไว้เป็นปุ่มใหญ่ด้านบน', en: 'The landing page of the system, with 4 main steps as large buttons at the top.' },
    blocks: HOME_STEPS.map(step => {
      const desc = {
        th: step.desc,
        en: {
          '01 FIND CONTRACT': 'Check whether a contract already exists',
          '02 NEW REQUEST': 'Request a new contract and attach supporting documents',
          '03 CONTRACT MAKING': 'Draft the contract and track its status',
          '04 UPLOAD CONTRACT': "Archive the contract once it's signed",
        }[step.title],
      };
      return {
        title: step.title,
        desc,
        icon: step.icon,
        customPreview: <TilePreview icon={step.icon} title={step.title} desc={desc} />,
      };
    }),
    extra: [
      {
        title: 'Find Contract',
        desc: {
          th: 'ใช้ค้นหาว่ามีสัญญาอยู่แล้วหรือยัง กรองได้ตามปี ประเภท สถานะ และเลขที่สัญญา ก่อนจะกดสร้างคำร้องใหม่ซ้ำซ้อน',
          en: 'Search whether a contract already exists. Filter by year, type, status, and contract number before creating a duplicate request.',
        },
      },
      {
        title: 'New Request',
        desc: {
          th: 'กรอกแบบฟอร์มคำร้องขอจัดทำสัญญา พร้อมแนบเอกสารประกอบ ระบบจะส่งต่อไปยังผู้อนุมัติโดยอัตโนมัติ',
          en: 'Fill out the contract request form and attach supporting documents. The system automatically routes it to the approvers.',
        },
      },
      {
        title: 'Contract Making',
        desc: {
          th: 'ดูรายการสัญญาที่ผ่านอนุมัติ/ตรวจสอบแล้วและกำลังอยู่ระหว่างจัดทำ ติดตามความคืบหน้าได้จากที่นี่',
          en: 'View contracts that have passed approval/legal review and are being drafted. Track progress from here.',
        },
      },
      {
        title: 'Upload Contract',
        desc: {
          th: 'เมื่อสัญญาลงนามเรียบร้อยแล้ว ให้อัปโหลดไฟล์ที่นี่เพื่อปิดงานและเก็บเข้าระบบอย่างเป็นทางการ',
          en: 'Once a contract is signed, upload it here to close out the job and officially archive it in the system.',
        },
      },
    ],
  },
  {
    key: 'new-request',
    label: 'New Request',
    icon: FilePlus2,
    intro: {
      th: 'วิธีกรอกแบบฟอร์มร้องขอจัดทำสัญญาใหม่ (Contract Requisition Form) ทีละส่วน จนถึงขั้นตอนส่งเข้าระบบ — เปิดได้จาก Home > กดปุ่ม "02 NEW REQUEST"',
      en: 'How to fill out the Contract Requisition Form section by section, through to submitting it — open it from Home > the "02 NEW REQUEST" button.',
    },
    blocks: [
      {
        title: { th: '1. Contract Information — ข้อมูลหลักของสัญญา', en: '1. Contract Information' },
        desc: { th: 'กรอกข้อมูลพื้นฐานของสัญญา ช่องที่มีเครื่องหมาย * คือช่องบังคับกรอก', en: "Fill in the contract's basic details. Fields marked * are required." },
        bullets: [
          {
            th: 'ติ๊ก HIGH CONFIDENTIAL ถ้าเป็นสัญญาที่ต้องปกปิดเป็นพิเศษ',
            en: 'Check HIGH CONFIDENTIAL if this contract needs extra confidentiality.',
          },
          {
            th: 'เลือก Contract Type ก่อน — ตัวเลือกใน Contract Purpose ด้านข้างจะเปลี่ยนตามประเภทที่เลือก',
            en: 'Pick a Contract Type first — the options in Contract Purpose next to it change based on the type selected.',
          },
          {
            th: 'Contract Purpose: บางประเภทสัญญาต้องกรอก Total Net Price ก่อนถึงจะเลือกวัตถุประสงค์ได้ และถ้าเป็นประเภทงานก่อสร้างที่มีความเสี่ยง ระบบจะล็อกช่องนี้ไว้จนกว่าจะกดปุ่ม "ประเมิน Construction Risk Checklist" และทำแบบประเมินให้ครบก่อน',
            en: 'Contract Purpose: some contract types require Total Net Price to be filled in before a purpose can be picked, and risk-rated construction types lock this field until you click "Assess Construction Risk Checklist" and complete the assessment.',
          },
          {
            th: 'กรอก Other Please Specify, Supplier Name (พิมพ์ชื่อเป็นภาษาอังกฤษเท่านั้น ระบบแปลงเป็นตัวพิมพ์ใหญ่ให้อัตโนมัติ), Date, Delivery Date, Location, Warranty Period',
            en: 'Fill in Other Please Specify, Supplier Name (English only — the system auto-uppercases it), Date, Delivery Date, Location, Warranty Period.',
          },
          {
            th: 'Refer to Contract No. เป็นช่องอ่านอย่างเดียว ระบบกรอกให้เองเฉพาะกรณี Renew/Amend/Terminate/Claim Note ที่อ้างอิงสัญญาฉบับเดิม',
            en: 'Refer to Contract No. is read-only — the system fills it in automatically only for Renew/Amend/Terminate/Claim Note requests that reference an existing contract.',
          },
          {
            th: 'Brief Description & Background: อธิบายวัตถุประสงค์และขอบเขตงานโดยย่อ',
            en: 'Brief Description & Background: briefly describe the purpose and scope of work.',
          },
        ],
        preview: [
          { label: 'HIGH CONFIDENTIAL', type: 'checkbox' },
          { label: 'Contract Type', required: true, type: 'select', placeholder: 'เลือกประเภทสัญญา...' },
          { label: 'Contract Purpose', required: true, type: 'select', placeholder: 'เลือกวัตถุประสงค์...' },
          { label: 'Supplier Name', required: true, placeholder: 'ชื่อผู้ขาย / ชื่อบริษัท' },
          { label: 'Date', required: true, placeholder: 'วว/ดด/ปปปป' },
          { label: 'Delivery Date', required: true, placeholder: 'วว/ดด/ปปปป' },
          { label: 'Location', required: true, placeholder: 'โรงงาน / พื้นที่ / สถานที่' },
          { label: 'Warranty Period', required: true, placeholder: 'เช่น 12 เดือน' },
          { label: 'Brief Description & Background', required: true, type: 'textarea', placeholder: 'วัตถุประสงค์ ขอบเขตงาน และข้อมูลประกอบ...' },
        ],
      },
      {
        title: { th: '2. Payment Term — เงื่อนไขการจ่ายเงิน', en: '2. Payment Term' },
        desc: { th: 'กรอกมูลค่าสัญญาและเงื่อนไขการจ่ายเงิน', en: 'Fill in the contract value and payment terms.' },
        bullets: [
          {
            th: 'Total Net Price, VAT, Currency (เลือกจากรายการ), Trade Term/Incoterm เป็นช่องบังคับ',
            en: 'Total Net Price, VAT, Currency (pick from the list), and Trade Term/Incoterm are required.',
          },
          {
            th: 'Installment Payment: ระบุรายละเอียดเงื่อนไขและความสำเร็จของแต่ละงวดได้สูงสุด 8 งวด (ไม่บังคับทุกงวด กรอกเท่าที่ใช้จริง)',
            en: 'Installment Payment: describe the terms and deliverable of each installment, up to 8 installments (not all are required — fill in only the ones you use).',
          },
          {
            th: 'ช่อง Other ไว้ระบุเงื่อนไขการจ่ายเงินเพิ่มเติมที่ไม่เข้าหมวดไหนด้านบน',
            en: "The Other field is for any extra payment terms that don't fit the categories above.",
          },
        ],
        preview: [
          { label: 'Total Net Price', required: true, placeholder: '0.00' },
          { label: 'VAT', required: true, placeholder: 'เช่น 7%' },
          { label: 'Currency', required: true, type: 'select', placeholder: 'เลือกสกุลเงิน' },
          { label: 'Trade Term (Incoterm)', required: true, placeholder: 'ระบุรายละเอียด เช่น DAP, CIF' },
          { label: '1st Payment (งวดที่ 1)', placeholder: '' },
          { label: '2nd Payment (งวดที่ 2)', placeholder: '' },
        ],
      },
      {
        title: { th: '3. Related Contract Document — เอกสารแนบ', en: '3. Related Contract Document' },
        desc: {
          th: 'แนบไฟล์ประกอบการพิจารณาแยกตามหมวด (ไม่มีหมวดไหนบังคับต้องแนบ): Drafted Contract, Quotation, Specification, Drawing/Plan, Schedule, Company Certificate, Other',
          en: 'Attach supporting documents by category (none are required to attach): Drafted Contract, Quotation, Specification, Drawing/Plan, Schedule, Company Certificate, Other.',
        },
        bullets: [
          {
            th: 'กดปุ่ม "เลือกไฟล์" ในกล่องเส้นประของหมวดนั้น ๆ เพื่อแนบ — เลือกได้ทีละหลายไฟล์',
            en: "Click \"Choose File\" in that category's dashed box to attach — you can select multiple files at once.",
          },
          {
            th: 'พอมีไฟล์แนบแล้ว กล่องถูกหน้าหมวดนั้นจะติ๊กให้อัตโนมัติ (ไม่ต้องกดเอง)',
            en: "Once a file is attached, that category's checkbox ticks automatically (no need to tick it yourself).",
          },
          {
            th: 'กดชื่อไฟล์เพื่อดาวน์โหลดกลับมาดู หรือกดไอคอนถังขยะข้างไฟล์เพื่อลบออก',
            en: 'Click a file name to download it back, or the trash icon next to it to remove it.',
          },
        ],
        preview: [{ label: 'Drafted Contract (ร่างสัญญา)', type: 'upload' }],
      },
      {
        title: '4. Comment',
        desc: {
          th: 'ช่องแสดงความคิดเห็นเพิ่มเติม (ไม่บังคับ) ใช้สื่อสารข้อมูลเสริมให้ผู้อนุมัติ/ฝ่ายกฎหมายเห็นตั้งแต่ต้น',
          en: 'An optional comment field — use it to share extra context with approvers/legal from the start.',
        },
        preview: [{ label: 'Comment', type: 'textarea', placeholder: 'เพิ่มความคิดเห็น (ถ้ามี)...' }],
      },
      {
        title: { th: '5. Section Approval — ผู้อนุมัติ', en: '5. Section Approval' },
        desc: {
          th: 'Requestor Name และ Section ดึงจากบัญชีผู้ใช้ของคุณอัตโนมัติ แก้ไขไม่ได้',
          en: "Requestor Name and Section are pulled from your account automatically and can't be edited.",
        },
        bullets: [
          { th: 'เลือกผู้อนุมัติ 3 ระดับ โดยพิมพ์ค้นหาชื่อพนักงานในแต่ละช่อง', en: 'Pick 3 levels of approvers by typing to search for an employee in each field.' },
          {
            th: 'แถวบนสุด (Manager or level up) และแถวล่างสุด (Supervisor or level up) บังคับต้องเลือก',
            en: 'The top row (Manager or level up) and the bottom row (Supervisor or level up) are required.',
          },
          {
            th: 'แถวกลาง (Supervisor or level up) เป็นช่องเสริม ไม่เลือกก็ส่งคำร้องได้',
            en: 'The middle row (Supervisor or level up) is optional — you can submit without picking it.',
          },
          {
            th: 'ลำดับการอนุมัติจริงจะเริ่มจากแถวล่างสุดก่อน ไล่ขึ้นไปจนถึงแถวบนสุดเป็นคนอนุมัติคนสุดท้าย',
            en: 'The actual approval order starts from the bottom row and moves up, ending with the top row as the final approver.',
          },
        ],
        preview: [
          { label: 'Requestor Name', placeholder: 'ดึงจากบัญชีผู้ใช้ (แก้ไขไม่ได้)' },
          { label: 'Section', placeholder: 'ดึงจากบัญชีผู้ใช้ (แก้ไขไม่ได้)' },
          { label: 'Approved by — Manager or level up', required: true, type: 'select', placeholder: 'เลือกพนักงานผู้อนุมัติ...' },
          { label: 'Approved by — Supervisor (ไม่บังคับ)', type: 'select', placeholder: 'เลือกพนักงานผู้อนุมัติ...' },
          { label: 'Approved by — Supervisor or level up', required: true, type: 'select', placeholder: 'เลือกพนักงานผู้อนุมัติ...' },
        ],
      },
      {
        title: { th: 'ปุ่มด้านล่างฟอร์ม', en: 'Buttons at the Bottom of the Form' },
        desc: { th: 'มี 2 ปุ่มที่มุมขวาล่างของฟอร์ม', en: 'There are 2 buttons at the bottom-right of the form.' },
        bullets: [
          {
            th: 'Save Draft — บันทึกร่างทันทีโดยไม่ตรวจสอบว่ากรอกครบหรือยัง เหมาะกับตอนที่ยังกรอกข้อมูลไม่เสร็จแล้วอยากพักไว้ก่อน',
            en: "Save Draft — saves immediately without checking whether every field is filled in. Good for when you're not done yet and want to pause.",
          },
          {
            th: 'Send Request — ระบบตรวจสอบก่อนว่ากรอกครบทุกช่องบังคับหรือไม่ ถ้ายังขาดจะเลื่อนจอไปที่ช่องแรกที่มีปัญหาให้อัตโนมัติ',
            en: 'Send Request — the system checks that every required field is filled in first; if anything is missing, it automatically scrolls to the first problem field.',
          },
          {
            th: 'กดปุ่มใดก็ตาม จะมี popup ถามยืนยันอีกครั้ง (Yes/No) ก่อนบันทึกจริงเสมอ',
            en: 'Either button always shows a confirmation popup (Yes/No) before actually saving.',
          },
          {
            th: 'เมื่อ Send Request สำเร็จ ระบบจะพาไปที่หน้า Home > Contract Making ให้อัตโนมัติ และส่งคำร้องเข้าสู่ขั้นตอน Approval ทันที',
            en: 'Once Send Request succeeds, the system automatically takes you to Home > Contract Making, and the request enters the Approval stage immediately.',
          },
        ],
        previewButtons: [
          { label: 'Save Draft', icon: Save, variant: 'outline' },
          { label: 'Send Request', icon: Send, variant: 'solid' },
        ],
      },
    ],
  },
  {
    key: 'job-status',
    label: 'Job Status',
    icon: Clock3,
    intro: {
      th: 'ศูนย์รวมงานสัญญาทั้งหมดที่ "คุณ" เป็นคนสร้างคำร้องขึ้นมา แบ่งเป็น 3 แท็บ',
      en: 'Where every contract job "you" created lives, split into 3 tabs.',
    },
    blocks: JOB_STATUS_TABS.map(tab => ({
      title: tab.label,
      desc: {
        th:
          tab.key === 'my-job'
            ? 'งานสัญญาที่คุณสร้างและยังเดินเรื่องอยู่ ตัวเลข badge สีแดงคือจำนวนงานที่ต้องติดตาม — ปุ่ม Download สีเขียวดาวน์โหลดเอกสาร ส่วนปุ่ม More เปิดเมนู Edit/Cancel/View และเมนูอื่น ๆ ตามสถานะของแถวนั้น (ดูรายละเอียดด้านล่าง)'
            : tab.key === 'my-history'
              ? 'ประวัติงานที่จบขั้นตอนไปแล้ว ใช้สำหรับย้อนดูว่าสัญญาเก่าของคุณอยู่สถานะอะไร'
              : 'มองเห็นงานสัญญาทั้งหมดในระบบ ไม่จำกัดเฉพาะของตัวเอง เหมาะสำหรับติดตามภาพรวมทั้งแผนก',
        en:
          tab.key === 'my-job'
            ? 'Contracts you created that are still in progress. The red badge number is how many jobs need your attention — the green Download button downloads the document, and the More button opens Edit/Cancel/View plus other actions depending on that row’s status (see below).'
            : tab.key === 'my-history'
              ? "History of jobs that have finished their process — look back to see what status your older contracts ended up in."
              : "See every contract job in the system, not just your own — good for tracking the whole department's overview.",
      },
      customPreview:
        tab.key === 'my-job' ? (
          <TablePreview
            columns={['Contract No.', 'Supplier', 'Status', 'More']}
            rows={[
              ['DSST01-2026-0142', 'Siam Engineering Co., Ltd.', <StatusPill key="s" label="Waiting" tone="amber" />, <MoreVertical key="m" size={14} className="text-slate-400" />],
              ['DSST01-2026-0140', 'Thonburi Supplies', <StatusPill key="s" label="Drafted" tone="slate" />, <MoreVertical key="m" size={14} className="text-slate-400" />],
            ]}
          />
        ) : tab.key === 'my-history' ? (
          <TablePreview
            columns={['Contract No.', 'Supplier', 'Status', 'Date']}
            rows={[
              ['DSST01-2025-0098', 'Asia Pacific Logistics', <StatusPill key="s" label="Signed" tone="brand" />, '12/08/2025'],
              ['DSST01-2025-0071', 'Bangkok Freight Ltd.', <StatusPill key="s" label="Terminated" tone="rose" />, '03/05/2025'],
            ]}
          />
        ) : (
          <TablePreview
            columns={['Contract No.', 'Supplier', 'Status', 'Section']}
            rows={[
              ['DSST01-2026-0142', 'Siam Engineering Co., Ltd.', <StatusPill key="s" label="Waiting" tone="amber" />, 'Procurement'],
              ['DSST01-2026-0139', 'Krungthep Construction', <StatusPill key="s" label="Approved" tone="green" />, 'Legal'],
            ]}
          />
        ),
    })).concat([
      {
        title: { th: 'การลงนามและปิดงาน (My Job)', en: 'Signing & Closing a Job (My Job)' },
        desc: {
          th: 'เมื่อสัญญาผ่านอนุมัติและตรวจสอบกฎหมายแล้ว จะเข้าสถานะ Drafted — ทำ 2 ขั้นตอนนี้ใน My Job เพื่อปิดงาน:',
          en: 'Once a contract passes approval and legal review, it reaches Drafted status — do these 2 steps in My Job to close the job:',
        },
        bullets: [
          {
            th: 'กดปุ่ม Download (ไอคอนสีเขียวหน้าแถว) เพื่อดาวน์โหลดเอกสารสัญญาฉบับร่าง นำไปให้คู่สัญญาลงนามจริง',
            en: "Click the green Download button on the row to get the drafted contract document, to take for signing.",
          },
          {
            th: 'เมื่อได้เอกสารที่ลงนามครบทุกฝ่ายแล้ว เปิดเมนู More แล้วกด "Upload Signed Contract" เพื่ออัปโหลดกลับเข้าระบบ',
            en: 'Once every party has signed it, open the More menu and click "Upload Signed Contract" to upload it back into the system.',
          },
          {
            th: 'ระบบจะเปลี่ยนสถานะเป็น Signed โดยอัตโนมัติ — ขั้นตอนนี้คือการ "ปิด job"',
            en: 'The system automatically changes the status to Signed — this is what "closes" the job.',
          },
          {
            th: 'หลังเป็น Signed แล้ว เมนู More ของแถวนั้นจะเปลี่ยนเป็นตัวเลือกชุดใหม่: Renew, Amend, Claim Note, Terminate, Legal Comment และ Original At Legal/Owner (ดูด้านล่าง)',
            en: 'Once Signed, that row’s More menu switches to a new set of options: Renew, Amend, Claim Note, Terminate, Legal Comment, and Original At Legal/Owner (see below).',
          },
        ],
        customPreview: (
          <ButtonsPreview
            buttons={[
              { label: 'Download', icon: Download, className: 'bg-emerald-600 text-white shadow-soft' },
              { label: 'Upload Signed Contract', icon: UploadCloud, variant: 'outline' },
            ]}
          />
        ),
      },
      {
        title: 'Renew / Amend / Claim Note / Terminate',
        desc: {
          th: 'ทั้ง 4 ตัวเลือกนี้ในเมนู More ของแถวที่ Signed แล้ว ไม่ใช่ปุ่มสั่งงานทันที — กดแล้วจะเปิด "คำร้องขอใหม่" ที่อ้างอิงกลับไปยังสัญญาฉบับนี้ แล้วต้องผ่านขั้นตอนอนุมัติทั้งหมดอีกรอบ เหมือนเพิ่งสร้าง New Request ใหม่',
          en: "These 4 options in a Signed row's More menu aren't instant actions — clicking one opens a new request that references this contract, which then goes through the full approval process again, just like a brand new New Request.",
        },
        bullets: [
          {
            th: 'Renew (ต่ออายุสัญญา): กรอก Purpose และกำหนดช่วงวันที่สัญญาใหม่ (New Period) — ระบบโชว์ช่วงวันที่เดิม (Original Period) ให้เทียบ อ่านอย่างเดียว แก้ไม่ได้',
            en: 'Renew: fill in the Purpose and set the new contract period (New Period) — the system shows the Original Period read-only for comparison.',
          },
          {
            th: 'Amend (แก้ไขสัญญา): กรอก Background/Reason, Amended Detail, Effective Date และแนบไฟล์ประกอบ',
            en: 'Amend: fill in Background/Reason, Amended Detail, Effective Date, and attach supporting files.',
          },
          {
            th: 'Claim Note (ตั้งเบิก/เรียกร้อง): กรอก Background/Reason, Claim Detail และแนบไฟล์ประกอบ (ไม่มีช่อง Effective Date)',
            en: 'Claim Note: fill in Background/Reason, Claim Detail, and attach supporting files (no Effective Date field).',
          },
          {
            th: 'Terminate (ยกเลิกสัญญา): กรอก Background/Reason, Terminate Detail, Effective Date และแนบไฟล์ประกอบ',
            en: 'Terminate: fill in Background/Reason, Terminate Detail, Effective Date, and attach supporting files.',
          },
          {
            th: 'ทุกแบบ: ข้อมูล Contract Information เดิมจะแสดงแบบอ่านอย่างเดียว ต้องเลือกผู้อนุมัติใหม่ทั้ง 3 ระดับเอง (ไม่สืบทอดจากคำร้องเดิม) แล้วกด Save Draft หรือ Send Request เหมือนหน้า New Request ปกติ',
            en: "In every case: the original Contract Information shows read-only, you must pick a fresh set of 3 approvers (nothing carries over), then Save Draft or Send Request just like a normal New Request.",
          },
        ],
        customPreview: (
          <>
            <MenuListPreview
              items={[
                { icon: RefreshCw, label: 'Renew' },
                { icon: FileEdit, label: 'Amend' },
                { icon: FilePlus2, label: 'Claim Note' },
                { icon: Ban, label: 'Terminate', tone: 'rose' },
              ]}
            />
            <ButtonsPreview
              buttons={[
                { label: 'Save Draft', icon: Save, variant: 'outline' },
                { label: 'Send Request', icon: Send, variant: 'solid' },
              ]}
            />
          </>
        ),
      },
      {
        title: 'Legal Comment & Original At Legal/Owner',
        legalOnly: true,
        desc: {
          th: 'อีก 2 ตัวเลือกที่เหลือในเมนู More ของแถวที่ Signed แล้ว (Original At ใช้ได้กับ Terminated ด้วยสำหรับผู้ใช้ฝ่ายกฎหมาย) — เห็นเฉพาะผู้ใช้ที่มีสิทธิ์ Legal เท่านั้น',
          en: "The other 2 options in a Signed row's More menu (Original At also appears on Terminated rows, for legal users) — visible only to users with Legal permission.",
        },
        bullets: [
          {
            th: 'สิทธิ์การมองเห็น: Legal Comment จะแสดงเฉพาะผู้ใช้ที่มีสิทธิ์ Legal เท่านั้น ส่วน Original At Legal/Owner ผู้ใช้ทั่วไปเห็นได้บนแถวที่ Signed แต่บนแถวที่ Terminated จะเห็นเฉพาะผู้ใช้ที่มีสิทธิ์ Legal',
            en: 'Visibility: Legal Comment only appears for users with Legal permission. Original At Legal/Owner is visible to any user on Signed rows, but on Terminated rows it only appears for users with Legal permission.',
          },
          {
            th: 'Legal Comment: เพิ่มความเห็นเกี่ยวกับสัญญาฉบับนี้ได้โดยตรง ไม่ต้องเปิดคำร้องใหม่',
            en: 'Legal Comment: add a comment about this contract directly, no new request needed.',
          },
          {
            th: 'Original At Legal/Owner บอกว่าต้นฉบับสัญญาที่ลงนามจริง (ไม่ใช่ไฟล์สแกน) ถูกเก็บรักษาไว้ที่ไหน — ปุ่มจะแสดงชื่อสถานะที่จะเปลี่ยน "ไปเป็น" เสมอ ไม่ใช่สถานะปัจจุบัน',
            en: 'Original At Legal/Owner records where the physical signed original (not the scanned file) is kept — the label always names the state clicking it would change TO, not the current state.',
          },
          {
            th: 'ถ้าต้นฉบับเก็บไว้ที่แผนกเจ้าของเรื่องเอง เมนูจะแสดง "Original At Legal" (แปลว่าตอนนี้คือ Owner อยู่) ถ้านำไปฝากไว้ที่ฝ่ายกฎหมาย เมนูจะแสดง "Original At Owner" (แปลว่าตอนนี้คือ Legal อยู่)',
            en: 'If the department holds the original, the menu reads "Original At Legal" (currently with the Owner); if it was handed to Legal, the menu reads "Original At Owner" (currently with Legal).',
          },
          {
            th: 'ต้องการต้นฉบับคืน และระบบระบุว่าเก็บไว้ที่ Legal — ให้ติดต่อแผนกกฎหมายโดยตรงเพื่อขอรับคืน ระบบไม่มีปุ่มเรียกคืนอัตโนมัติ',
            en: 'Need the original back and the system shows it’s with Legal — contact the legal department directly to retrieve it; there’s no automatic recall button.',
          },
          {
            th: 'ดูผลแบบไม่ต้องเปิดเมนูได้ที่คอลัมน์ "Original At" ในตารางหน้า Home > Find Contract (แสดงเฉพาะแถวที่ Signed/Terminated): ถ้าต้นฉบับอยู่ที่แผนกเจ้าของเรื่อง คอลัมน์นี้จะโชว์ชื่อแผนกนั้นตามปกติ (เช่น Procurement) — เห็นคำว่า "Legal" ในคอลัมน์นี้เมื่อไหร่ แปลว่าต้นฉบับถูกย้ายไปเก็บที่ฝ่ายกฎหมายแล้วเท่านั้น ไม่ได้แปลว่าทุกแถวต้องเป็น Legal',
            en: 'See it at a glance in the "Original At" column on the Home > Find Contract table (Signed/Terminated rows only): it normally shows that row’s own department name (e.g. Procurement) when the original is with the owning department — it only reads "Legal" once that specific contract’s original has been moved to the legal department, not for every row.',
          },
        ],
        customPreview: (
          <>
            <MenuListPreview
              items={[
                { icon: MessageSquare, label: 'Legal Comment' },
                { icon: MapPin, label: 'Original At Legal' },
              ]}
            />
            <TablePreview
              columns={['Supplier', 'Status', 'Original At']}
              rows={[
                ['Siam Engineering Co., Ltd.', <StatusPill key="s" label="Signed" tone="brand" />, 'Procurement'],
                ['Thonburi Supplies', <StatusPill key="s" label="Signed" tone="brand" />, 'Legal'],
              ]}
            />
          </>
        ),
      },
    ]),
  },
  {
    key: 'approval',
    label: 'Approval',
    icon: CheckSquare,
    intro: {
      th: 'สำหรับผู้มีสิทธิ์อนุมัติสัญญา — ระบบจะส่งคำร้องมาตามลำดับผู้อนุมัติที่กำหนดไว้ของแต่ละสัญญา',
      en: "For people with contract approval rights — the system routes requests according to each contract's own approver sequence.",
    },
    blocks: [
      {
        title: 'Waiting Approve',
        desc: {
          th: 'รายการที่รอให้คุณอนุมัติในขั้นตอนปัจจุบัน กดเข้าไปดูรายละเอียดแล้วเลือก Approve / Return (ตีกลับให้แก้ไข) / Reject (ปฏิเสธ)',
          en: 'Items waiting for your approval at the current stage. Open one to review, then choose Approve / Return (send back for edits) / Reject.',
        },
        customPreview: (
          <>
            <TablePreview
              columns={['Contract No.', 'Supplier', 'Requestor', 'More']}
              rows={[
                ['DSST01-2026-0142', 'Siam Engineering Co., Ltd.', 'Nichakorn P.', <MoreVertical key="m" size={14} className="text-slate-400" />],
              ]}
            />
            <ButtonsPreview
              buttons={[
                { label: 'Approve', icon: Check, className: 'bg-emerald-600 text-white shadow-soft' },
                { label: 'Return', icon: Undo2, className: 'border border-amber-300 bg-amber-50 text-amber-700' },
                { label: 'Reject', icon: X, className: 'border border-rose-300 bg-rose-50 text-rose-600' },
              ]}
            />
          </>
        ),
      },
      {
        title: 'My History',
        desc: {
          th: 'ประวัติการอนุมัติ (Approve, Return, Reject) ทั้งหมดที่คุณเคยทำ ใช้ย้อนตรวจสอบย้อนหลังได้',
          en: "History of every approval action (Approve, Return, Reject) you've taken — use it to look back.",
        },
        customPreview: (
          <TablePreview
            columns={['Contract No.', 'Supplier', 'Action', 'Date']}
            rows={[
              ['DSST01-2026-0138', 'Asia Pacific Logistics', <StatusPill key="s" label="Approved" tone="green" />, '28/09/2026'],
              ['DSST01-2026-0130', 'Rayong Industrial Supply', <StatusPill key="s" label="Returned" tone="amber" />, '15/09/2026'],
            ]}
          />
        ),
      },
    ],
  },
  {
    key: 'legal',
    label: 'Legal',
    icon: Scale,
    restricted: 'Legal',
    intro: {
      th: 'สำหรับทีมกฎหมาย ตรวจสอบความถูกต้องของสัญญาก่อนดำเนินการต่อ (แสดงเฉพาะผู้ใช้ที่มีสิทธิ์ Legal)',
      en: 'For the legal team, to review contracts before they proceed (only shown to users with Legal permission).',
    },
    blocks: LEGAL_TABS.map(tab => ({
      title: tab.label,
      desc: {
        th:
          tab.key === 'waiting'
            ? 'สัญญาที่รอการตรวจสอบทางกฎหมาย กดเข้าไปตรวจและกด Check เพื่อผ่านขั้นตอนนี้ หรือ Terminate หากต้องยกเลิกสัญญา พร้อมใส่ความเห็นประกอบได้'
            : tab.key === 'history'
              ? 'ประวัติสัญญาที่ทีมกฎหมายตรวจสอบไปแล้วทั้งหมด'
              : 'ติดตามสถานะอีเมลแจ้งเตือนอัตโนมัติที่ระบบส่งออกไป (เช่น แจ้งเตือนผู้อนุมัติ/ผู้ร้องขอ)',
        en:
          tab.key === 'waiting'
            ? 'Contracts waiting for legal review. Open one to review, then click Check to pass this stage, or Terminate to cancel the contract — a comment can be attached either way.'
            : tab.key === 'history'
              ? 'History of every contract the legal team has already reviewed.'
              : "Track the status of automatic notification emails the system sends (e.g. notifying approvers/requesters).",
      },
      customPreview:
        tab.key === 'waiting' ? (
          <>
            <TablePreview
              columns={['Contract No.', 'Supplier', 'Type', 'More']}
              rows={[['DSST01-2026-0142', 'Siam Engineering Co., Ltd.', 'Service', <MoreVertical key="m" size={14} className="text-slate-400" />]]}
            />
            <ButtonsPreview
              buttons={[
                { label: 'Check', icon: Check, className: 'bg-emerald-600 text-white shadow-soft' },
                { label: 'Terminate', icon: Ban, className: 'border border-rose-300 bg-rose-50 text-rose-600' },
              ]}
            />
          </>
        ) : tab.key === 'history' ? (
          <TablePreview
            columns={['Contract No.', 'Supplier', 'Status', 'Date']}
            rows={[['DSST01-2025-0098', 'Asia Pacific Logistics', <StatusPill key="s" label="Checked" tone="brand" />, '12/08/2025']]}
          />
        ) : (
          <TablePreview
            columns={['To', 'Subject', 'Status']}
            rows={[
              ['nichakorn.p@...', 'Waiting Approve: DSST01-2026-0142', <StatusPill key="s" label="Sent" tone="green" />],
              ['approver@...', 'Reminder: DSST01-2026-0130', <StatusPill key="s" label="Failed" tone="rose" />],
            ]}
          />
        ),
    })),
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: Settings,
    restricted: 'Admin',
    intro: { th: 'สำหรับผู้ดูแลระบบเท่านั้น (แสดงเฉพาะผู้ใช้ที่มีสิทธิ์ Admin)', en: 'Admins only (only shown to users with Admin permission).' },
    blocks: SETTINGS_TABS.map(tab => ({
      title: tab.label,
      desc: {
        th:
          tab.key === 'contract-types'
            ? 'จัดการประเภทสัญญาและแบบฟอร์มที่ดาวน์โหลดได้ในหน้า Download Form รวมถึงอัปโหลดเอกสารกลางของระบบ เช่น Contract Procedure, Check Sheet และคู่มือการใช้งาน (PDF) ที่ใช้เป็นตัวเลือกดาวน์โหลดในคู่มือนี้'
            : tab.key === 'role'
              ? 'จัดการสิทธิ์การใช้งานของพนักงานแต่ละคน — เปิด/ปิดสิทธิ์ View, Admin, Legal และสถานะการใช้งาน (Active) ได้จากตารางนี้'
              : 'ประวัติการใช้งานระบบทั้งหมด — login (สำเร็จ/ไม่สำเร็จ), ส่งคำร้อง/บันทึกร่าง, อนุมัติ/ตีกลับ/ปฏิเสธ, ตรวจสอบ/ยกเลิกทางกฎหมาย, อัปโหลดสัญญาที่ลงนามแล้ว และการเปลี่ยนแปลงใน Settings (สิทธิ์, ประเภทสัญญา, เอกสารกลาง) — ค้นหา/กรองตามชื่อผู้ใช้ ประเภท action หรือช่วงวันที่ได้',
        en:
          tab.key === 'contract-types'
            ? "Manage contract types and the forms downloadable on the Download Form page, plus upload the system's shared documents — Contract Procedure, Check Sheet, and the User Manual (PDF) used as the downloadable option in this manual."
            : tab.key === 'role'
              ? "Manage each employee's access — toggle View, Admin, Legal permissions and Active status from this table."
              : 'A system-wide audit trail — login (success/failed), send/save-draft requests, approve/return/reject, legal check/cancel, signed-contract uploads, and Settings changes (roles, contract types, shared documents) — searchable and filterable by user, action type, or date range.',
      },
      customPreview:
        tab.key === 'contract-types' ? (
          <PreviewPanel
            fields={[
              { label: 'Contract Procedure', type: 'upload' },
              { label: 'User Manual (PDF)', type: 'upload' },
            ]}
          />
        ) : tab.key === 'role' ? (
          <TablePreview
            columns={['Employee ID', 'Name', 'View', 'Admin', 'Legal', 'Status']}
            rows={[
              ['E10234', 'Nichakorn P.', '✓', '—', '✓', <StatusPill key="s" label="Active" tone="green" />],
              ['E10567', 'Anong S.', '✓', '✓', '—', <StatusPill key="s" label="Active" tone="green" />],
            ]}
          />
        ) : (
          <TablePreview
            columns={['Time', 'User', 'Action', 'IP Address']}
            rows={[
              ['2026-10-01 09:12:03', 'Nichakorn P.', <StatusPill key="s" label="Send Request" tone="brand" />, '10.0.2.14'],
              ['2026-10-01 08:55:41', 'Anong S.', <StatusPill key="s" label="Login Failed" tone="rose" />, '10.0.2.9'],
            ]}
          />
        ),
    })),
  },
  {
    key: 'download-form',
    label: 'Download Form',
    icon: FileDown,
    intro: {
      th: 'ดาวน์โหลดแบบฟอร์มสัญญาเปล่าแยกตามประเภท พร้อมเอกสาร Check Sheet ประกอบ',
      en: 'Download blank contract forms by type, along with the accompanying Check Sheet document.',
    },
    blocks: [
      {
        title: { th: 'เลือกประเภทเอกสาร', en: 'Choose a Document Type' },
        desc: {
          th: 'เลือกประเภทสัญญาจากรายการด้านซ้าย แล้วเลือกดาวน์โหลดแบบฟอร์มภาษาไทย (THA) หรือภาษาอังกฤษ (ENG) ตามที่ต้องการ',
          en: 'Pick a contract type from the list on the left, then download the Thai (THA) or English (ENG) form as needed.',
        },
        previewButtons: [
          { label: 'ENG', icon: FileDown, variant: 'outline' },
          { label: 'THA', icon: FileDown, variant: 'outline' },
        ],
      },
      {
        title: 'Check Sheet',
        desc: {
          th: 'เอกสารรายการตรวจสอบที่ทีมกฎหมายใช้ประกอบการตรวจสัญญา ดาวน์โหลดได้จากปุ่มสีม่วงข้างแบบฟอร์มแต่ละรายการ',
          en: 'The checklist document the legal team uses when reviewing a contract. Download it from the violet button next to each form.',
        },
        previewButtons: [{ label: 'Check Sheet', icon: FileDown, className: 'border border-violet-200 bg-violet-50 text-violet-600' }],
      },
    ],
  },
];

const STEP_ICONS = { 'Find Contract': Search, 'New Request': FilePlus2, 'Contract Making': CircleCheck, 'Upload Contract': Upload };

export default function UserManualModal({ open, onClose, user }) {
  const [activeKey, setActiveKey] = useState('overview');
  const [lang, setLang] = useState('th');
  useBodyScrollLock(open);

  if (!open) return null;

  // "Download PDF" exports THIS manual (every section the current user can see, via the
  // hidden print:block view further down) through the browser's own print dialog — "Save
  // as PDF" there is a real file on disk, no server round-trip needed. This replaced an
  // earlier version that downloaded a separately admin-uploaded PDF (Settings > Contract
  // Types' own "User Manual (PDF)" upload): that file has to be manually kept in sync
  // with this interactive manual's actual content, and in practice drifted (the uploaded
  // file pointed at a deleted upload record, so it 404'd every time) — exporting the live
  // content sidesteps that entirely, and always works regardless of whether anyone has
  // uploaded anything.
  const handlePrintManual = () => window.print();

  // Mirror the real app's own gating (lib/nav.js NAV_PERMISSION) so the manual never shows
  // a section or block to someone who wouldn't actually see it in the live app.
  const sections = SECTIONS.filter(
    s => (s.restricted !== 'Legal' || !!user?.legal) && (s.restricted !== 'Admin' || !!user?.admin)
  ).map(s => (s.key === 'job-status' ? { ...s, blocks: s.blocks.filter(b => !b.legalOnly || !!user?.legal) } : s));

  const active = sections.find(s => s.key === activeKey) || sections[0];

  // True full-screen takeover (no padding/max-width/rounded corners around it) — not
  // just a large centered dialog, the whole viewport. LangContext.Provider wraps
  // everything below so every preview sub-component (most of which live as ready-made
  // JSX inside SECTIONS, not re-created per render) still picks up the current toggle —
  // see the comment on LangContext above.
  return (
    <LangContext.Provider value={lang}>
      <div className="fixed inset-0 z-[60] flex flex-col bg-white print:static print:block">
        <div className="relative flex shrink-0 items-center justify-center border-b border-slate-200 px-6 py-4 print:hidden">
          <div className="text-center">
            <h2 className="text-lg font-bold text-navy">{lang === 'th' ? 'คู่มือการใช้งาน' : 'User Manual'}</h2>
            <p className="text-base text-slate-400">User Manual &mdash; Contract Online System</p>
          </div>

          <div className="absolute right-6 top-1/2 flex -translate-y-1/2 items-center gap-2">
            {/* TH/EN toggle — a segmented pill, same visual language as the sidebar's
                active-item highlight (bg-brand-600 on the picked side). */}
            <div className="flex items-center rounded-full border border-slate-200 p-0.5">
              <button
                type="button"
                onClick={() => setLang('th')}
                className={`rounded-full px-2.5 py-1 text-base font-bold transition-colors ${lang === 'th' ? 'bg-brand-600 text-white' : 'text-slate-500 hover:text-slate-700'}`}
              >
                TH
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`rounded-full px-2.5 py-1 text-base font-bold transition-colors ${lang === 'en' ? 'bg-brand-600 text-white' : 'text-slate-500 hover:text-slate-700'}`}
              >
                EN
              </button>
            </div>

            {/* <button
              type="button"
              onClick={handlePrintManual}
              className="hidden items-center gap-2 rounded-xl border border-brand-100 px-3 py-2 text-base font-bold uppercase tracking-wide text-brand-600 hover:bg-brand-50 sm:flex"
            >
              <Download size={14} /> {lang === 'th' ? 'ดาวน์โหลด PDF' : 'Download PDF'}
            </button> */}
            <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 print:block print:min-h-0">
          <nav className="w-56 shrink-0 overflow-y-auto border-r border-slate-200 bg-slate-50 p-3 print:hidden">
            {sections.map(section => {
              const Icon = section.icon;
              const isActive = section.key === activeKey;
              return (
                <button
                  key={section.key}
                  type="button"
                  onClick={() => setActiveKey(section.key)}
                  className={`mb-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-base font-semibold transition-colors ${
                    isActive ? 'bg-brand-600 text-white shadow-soft' : 'text-slate-600 hover:bg-white'
                  }`}
                >
                  <Icon size={16} className="shrink-0" />
                  <span className="flex-1">{pick(section.label, lang)}</span>
                  {section.restricted && (
                    <span
                      className={`shrink-0 rounded-full px-1.5 py-0.5 text-base font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {section.restricted}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="flex-1 overflow-y-auto p-7 print:hidden">
            <div className="mx-auto max-w-5xl">
              <SectionContent section={active} lang={lang} />
            </div>
          </div>

          {/* Print/"Download PDF" view — invisible on screen (hidden), only switched on by
              the browser's own @media print rules once handlePrintManual() below calls
              window.print(). Unlike the screen view (just `active`), this stacks every
              section the current user can see, one after another, each starting on its
              own page, so "Save as PDF" from the print dialog produces the whole manual. */}
          <div className="hidden print:block print:w-full">
            {sections.map(section => (
              <div key={section.key} className="break-before-page p-7">
                <SectionContent section={section} lang={lang} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </LangContext.Provider>
  );
}
