import { Outlet } from 'react-router-dom';

// Shared shell for pages whose sub-navigation now lives in the header dropdown
// (Job Status, Approval, Legal, Settings) instead of a persistent tab strip.
export default function SectionLayout() {
  return (
    <div className="min-h-[calc(100vh-5rem)] bg-sky-50">
      <Outlet />
    </div>
  );
}
