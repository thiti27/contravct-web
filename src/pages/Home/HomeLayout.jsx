import { Outlet } from 'react-router-dom';
import StepsNav from './StepsNav';
import { HOME_BG_STYLE, HOME_BG_CLASS } from '../../lib/homeBackground';

export default function HomeLayout() {
  return (
    <div className={`min-h-[calc(100vh-4rem)] ${HOME_BG_CLASS}`} style={HOME_BG_STYLE}>
      {/* Background runs the whole page, not just the top — the filter card, table
          and pagination all stay white, so they read as objects lifted off the page
          instead of blending into it the way a top-only band left them. */}
      {/* pt-3 (not the pt-7 PageContainer uses) — the floating header card already
          adds its own py-4 bottom padding above this, so the old pt-7 stacked on top
          of that left a noticeably bigger gap under the header than under any other
          section on the page. */}
      <div className="mx-auto w-full max-w-[1500px] px-6 pt-3">
        {/* Negative margin on purpose: PageContainer (rendered inside Outlet below,
            shared by every page so it's left alone) always adds its own py-7 (1.75rem)
            top padding, so this needs to be negative to close some of that gap. */}
        <div className="-mb-3">
          <StepsNav />
        </div>
      </div>

      <Outlet />
    </div>
  );
}
