import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { BookCopyIcon, ChevronDown, FileText, LogOut } from 'lucide-react';
import { visibleNav, formatBadgeCount } from '../../lib/nav';
import { HOME_STEPS } from '../../pages/Home/steps';
import { useMetaContext } from '../../context/MetaContext';
import { useAuth } from '../../context/AuthContext';
import { PATHS } from '../../routes/paths';
import { fetchGlobalDocuments } from '../../lib/api';
import UserManualModal from './UserManualModal';
import PdfViewerModal from '../ui/PdfViewerModal';

const HOME_PATHS = HOME_STEPS.map(step => step.path);

// "Dribbble-style" concept (a reference screenshot, not one of the 10 numbered
// options): a plain flat white bar — no floating card, no per-item pill
// background — with nav items as bold plain text (brand-600 when active/hover)
// plus a chevron on the ones that open a dropdown, a single neutral outlined-pill
// button style for the two document actions, and a minimal icon button instead of
// a filled circle. See the <header> comment below for the bar itself.
const navItemClass = active =>
  `flex items-center gap-1.5 whitespace-nowrap text-lg font-semibold transition-colors ${
    active ? 'text-brand-600' : 'text-slate-800 hover:text-brand-600'
  }`;

// Contract Procedure / Download Form used to be a pill-button row on the Home page
// only (see HomeLayout.jsx history) — moved into the header itself so both are
// reachable from every page, not just Home. Both share one neutral pill style now
// (white, bordered, bold label) rather than a primary/secondary color split — the
// reference's own "Start Project Brief" pill is a single neutral treatment too.
const pillClass =
  'flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full border border-slate-200 bg-white px-3.5 text-base font-bold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent';

function NavBadge({ count }) {
  if (!count) return null;
  return (
    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-base font-bold leading-none text-white">
      {formatBadgeCount(count)}
    </span>
  );
}

// Collapses a section's sub-pages (e.g. Job Status > My Job / My History / All Job)
// into a click-to-open dropdown instead of a persistent secondary tab-strip bar, so
// the page below the header keeps its full vertical space. The panel renders through
// a portal into document.body (position: fixed, computed from the trigger's own
// bounding rect) rather than as an absolutely-positioned child of <nav> — the nav
// needs overflow-x-auto for narrow viewports, and CSS quirk-of-fate makes any
// overflow-x value force overflow-y to clip too, which would silently cut the
// dropdown off instead of just letting it float below the header.
function NavDropdown({ item, active, counts }) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const count = item.badgeKey ? counts?.[item.badgeKey] : null;
  const activeTabKey = item.tabs.find(t => pathname.startsWith(`${item.path}/${t.key}`))?.key;

  const toggle = () => {
    if (!open && triggerRef.current) setRect(triggerRef.current.getBoundingClientRect());
    setOpen(o => !o);
  };

  useEffect(() => {
    if (!open) return undefined;
    const handleClick = e => {
      if (triggerRef.current?.contains(e.target) || panelRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const go = key => {
    setOpen(false);
    navigate(`${item.path}/${key}`);
  };

  return (
    <>
      <button type="button" ref={triggerRef} onClick={toggle} className={navItemClass(active)}>
        {item.label}
        <NavBadge count={count} />
        <ChevronDown size={15} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open &&
        rect &&
        createPortal(
          <div
            ref={panelRef}
            style={{ position: 'fixed', top: rect.bottom + 8, left: rect.left, width: 224 }}
            className="z-50 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-card"
          >
            {item.tabs.map(tab => {
              const tabCount = tab.badgeKey ? counts?.[tab.badgeKey] : null;
              const tabActive = tab.key === activeTabKey;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => go(tab.key)}
                  className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                    tabActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                  <NavBadge count={tabCount} />
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}

// The account cluster, top-right — same portal dropdown pattern as NavDropdown above,
// just one action (Logout) inside it. Compact this time (avatar + chevron only, no
// inline name/section) to match the reference's tight utility-icon cluster. Avatar is
// initials-on-a-circle (first_name[0] + last_name[0]) — there's no photo upload
// anywhere in this app, so a real image was never an option here.
function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  const toggle = () => {
    if (!open && triggerRef.current) setRect(triggerRef.current.getBoundingClientRect());
    setOpen(o => !o);
  };

  useEffect(() => {
    if (!open) return undefined;
    const handleClick = e => {
      if (triggerRef.current?.contains(e.target) || panelRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase() || 'U';

  return (
    <>
      <button type="button" ref={triggerRef} onClick={toggle} className="flex items-center gap-1 rounded-full py-1 pl-1 pr-1.5 hover:bg-slate-100" title={user?.name}>
        <span className="relative grid h-9 w-9 place-items-center rounded-full bg-slate-700 text-sm font-bold text-white">
          {initials}
          {/* Static "online" dot, matching the reference's avatar — there's no real
              presence system behind it, it just marks "this is you, signed in". */}
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
        </span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open &&
        rect &&
        createPortal(
          <div
            ref={panelRef}
            style={{ position: 'fixed', top: rect.bottom + 8, right: window.innerWidth - rect.right, width: 190 }}
            className="z-50 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-card"
          >
            <div className="px-3 py-2">
              <div className="truncate text-sm font-semibold text-navy">{user?.name || 'User'}</div>
              <div className="truncate text-xs text-slate-400">{user?.section || '-'}</div>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>,
          document.body
        )}
    </>
  );
}

export default function Header() {
  const meta = useMetaContext();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isHomeActive = HOME_PATHS.includes(pathname);
  const nav = visibleNav(user);
  const [manualOpen, setManualOpen] = useState(false);
  const [procedureOpen, setProcedureOpen] = useState(false);

  // Contract Procedure + User Manual now live in the header itself (both used to be
  // page-level buttons on Home only) so they're reachable from every page — fetched
  // here the same way HomeLayout used to fetch them for its own buttons.
  const [globalDocs, setGlobalDocs] = useState({ documents: [] });
  useEffect(() => {
    fetchGlobalDocuments()
      .then(setGlobalDocs)
      .catch(() => setGlobalDocs({ documents: [] }));
  }, []);
  const contractProcedure = globalDocs.documents?.find(d => d.docKey === 'contract_procedure');

  const handleLogout = () => {
    logout();
    navigate(PATHS.LOGIN, { replace: true });
  };

  // Flat edge-to-edge bar (a Dribbble header screenshot the user pasted as a
  // reference), not the floating-card/floating-pill shapes this header used
  // before: h-16 = 4rem, bg-white, a single border-b for separation — no outer
  // py-4 backdrop margin anymore, so the total chrome height is just that 4rem.
  // Every page's own min-h-[calc(100vh-Xrem)] must match that 4rem (HomeLayout.jsx,
  // SectionLayout.jsx, DownloadFormPage.jsx, UnauthorizedPage.jsx). Text sizes
  // across the bar were dialed back a few notches from an earlier, oversized pass
  // (text-xl/text-2xl felt crowded and heavy) to this calmer text-sm/text-base
  // scale, which is also why the bar itself fits in less height again.
  return (
    <header className="h-16 border-b border-slate-200 bg-white">
      {/* grid-cols-[1fr_auto_1fr], not a plain flex row — a flex-1 nav just sits
          left-aligned in its own leftover space (it only fills width, it doesn't
          center within it). The two 1fr side columns share whatever space is left
          over equally, so the middle (auto-width) column — the nav — lands exactly
          in the horizontal center of the bar regardless of the logo and the
          pills+icons group being different widths from each other. */}
      <div className="mx-auto grid h-full max-w-[1500px] grid-cols-[1fr_auto_1fr] items-center px-6">
        <div className="flex min-w-fit items-center gap-2.5">
          <img src="/logo.png" alt="Contract Online System" className="h-9 w-9 object-contain" />
          {/* Simple wordmark, one line, both words styled identically — no more
              size/weight/color split between "Contract" and "Online System". */}
          <div className="whitespace-nowrap text-lg font-bold text-navy">Contract Online System</div>
        </div>

        <nav className="flex items-center gap-6 overflow-x-auto">
          {nav.map(item => {
            const active = item.key === 'home' ? isHomeActive : pathname.startsWith(item.path);

            if (item.tabs) {
              return <NavDropdown key={item.key} item={item} active={active} counts={meta.counts} />;
            }

            const count = item.badgeKey ? meta.counts?.[item.badgeKey] : null;
            return (
              <NavLink key={item.key} to={item.path} className={() => navItemClass(active)}>
                {item.label}
                <NavBadge count={count} />
              </NavLink>
            );
          })}
        </nav>

        <div className="flex min-w-fit items-center justify-end gap-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => contractProcedure?.fileId && setProcedureOpen(true)}
              disabled={!contractProcedure?.fileId}
              className={pillClass}
              title="Contract Procedure"
            >
              <FileText size={15} />
              <span className="hidden hd:inline">Contract Procedure</span>
            </button>
            <Link to={PATHS.DOWNLOAD_FORM} className={pillClass} title="Download Form">
              <FileText size={15} />
              <span className="hidden hd:inline">Download Form</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setManualOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              title="User Manual"
            >
              <BookCopyIcon size={18} />
            </button>
            <UserMenu user={user} onLogout={handleLogout} />
          </div>
        </div>
      </div>

      <UserManualModal open={manualOpen} onClose={() => setManualOpen(false)} user={user} />
      <PdfViewerModal
        open={procedureOpen}
        onClose={() => setProcedureOpen(false)}
        title="Contract Procedure"
        fileId={contractProcedure?.fileId}
        fileName={contractProcedure?.fileName}
      />
    </header>
  );
}
