import { Outlet } from 'react-router-dom';

// Shared shell for pages whose sub-navigation now lives in the header dropdown
// (Job Status, Approval, Legal, Settings) instead of a persistent tab strip.
export default function SectionLayout() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-brand-100">
      {/* -mt-7 fully cancels PageContainer's own py-7 (1.75rem) top padding, so the
          page content starts right under the header's floating card instead of
          leaving PageContainer's usual top gap on top of that — same fix
          HomeLayout.jsx applied for itself (pt-7 → pt-3). Doesn't touch
          PageContainer.jsx itself, which every other page (and every modal) also
          relies on for its usual spacing — this only pulls the very first one under
          the header up. */}
      <div  >
        <Outlet />
      </div>
    </div>
  );
}
