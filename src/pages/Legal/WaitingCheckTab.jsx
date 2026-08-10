import ContractListPage from '../../components/contracts/ContractListPage';
import PageContainer from '../../components/layout/PageContainer';
import { useAuth } from '../../context/AuthContext';
import { LEGAL_REVIEW_STATUSES } from '../../lib/statusGroups';

export default function WaitingCheckTab() {
  const { user } = useAuth();

  if (!user?.legal) {
    return (
      <PageContainer>
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-navy">WAITING CHECK</h1>
          <p className="mt-1 text-sm text-slate-500">รายการสัญญาที่รอฝ่ายกฎหมายตรวจสอบ</p>
        </div>
        <div className="rounded-xl2 border border-slate-200 bg-white py-16 text-center text-slate-400 shadow-card">
          คุณไม่มีสิทธิ์เข้าถึงหน้านี้
        </div>
      </PageContainer>
    );
  }

  return (
    <ContractListPage
      title="WAITING CHECK"
      subtitle="รายการสัญญาที่รอฝ่ายกฎหมายตรวจสอบ"
      statusScope={LEGAL_REVIEW_STATUSES}
      legalMode
      showStatus
    />
  );
}
