import { ShieldCheck, Pencil } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';

// Mock data — no /api/roles endpoint exists yet on the backend.
const ROLES = [
  { name: 'Admin', users: 2, description: 'จัดการผู้ใช้งานและสิทธิ์ทั้งหมดในระบบ' },
  { name: 'Requester', users: 18, description: 'สร้างคำร้องขอจัดทำสัญญาและติดตามสถานะ' },
  { name: 'Approver', users: 6, description: 'อนุมัติคำร้องขอจัดทำสัญญาตามลำดับชั้น' },
  { name: 'Legal', users: 4, description: 'ตรวจสอบความถูกต้องทางกฎหมายของสัญญา' },
];

export default function RoleTab() {
  return (
    <PageContainer>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-navy">ROLE</h1>
        <p className="mt-1 text-sm text-slate-500">จัดการบทบาทและสิทธิ์การเข้าถึงของผู้ใช้งาน</p>
      </div>

      <div className="overflow-hidden rounded-xl2 border border-slate-200 bg-white shadow-card">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4">Users</th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody>
            {ROLES.map(role => (
              <tr key={role.name} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-2 font-semibold text-navy">
                    <ShieldCheck size={16} className="text-brand-500" /> {role.name}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600">{role.description}</td>
                <td className="px-6 py-4 text-slate-600">{role.users} คน</td>
                <td className="px-6 py-4 text-right">
                  <button className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-600 hover:bg-slate-100">
                    <Pencil size={14} /> Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageContainer>
  );
}
