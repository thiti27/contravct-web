import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut } from 'lucide-react';
import { visibleNav, formatBadgeCount } from '../../lib/nav';
import { HOME_STEPS } from '../../pages/Home/steps';
import { useMetaContext } from '../../context/MetaContext';
import { useAuth } from '../../context/AuthContext';
import { PATHS } from '../../routes/paths';

const HOME_PATHS = HOME_STEPS.map(step => step.path);

const navItemClass = active =>
  `flex h-11 items-center gap-2 whitespace-nowrap rounded-full px-5 text-sm font-semibold transition-colors ${
    active ? 'bg-brand-600 text-white shadow-soft' : 'text-slate-500 hover:bg-slate-100'
  }`;

function NavBadge({ count }) {
  if (!count) return null;
  return (
    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white">
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
  const Icon = item.icon;
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
        <Icon size={18} />
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

export default function Header() {
  const meta = useMetaContext();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isHomeActive = HOME_PATHS.includes(pathname);

  const handleLogout = () => {
    logout();
    navigate(PATHS.LOGIN, { replace: true });
  };

  return (
    <header className="grid h-20 grid-cols-[1fr_auto_1fr] items-center gap-6 border-b border-slate-200 bg-white px-6 shadow-sm">
      <div className="flex min-w-fit items-center gap-2.5">
        <img src="/logo.png" alt="Contract Online System" className="h-12 w-12 object-contain" />
        <div className="leading-tight">
          <div className="text-xl font-extrabold tracking-tight text-black uppercase">Contract</div>
          <div className="text-xs font-medium text-black uppercase">Online System</div>
        </div>
      </div>

      <nav className="flex items-center gap-2 overflow-x-auto">
        {visibleNav(user).map(item => {
          const active = item.key === 'home' ? isHomeActive : pathname.startsWith(item.path);

          if (item.tabs) {
            return <NavDropdown key={item.key} item={item} active={active} counts={meta.counts} />;
          }

          const count = item.badgeKey ? meta.counts?.[item.badgeKey] : null;
          const Icon = item.icon;
          return (
            <NavLink key={item.key} to={item.path} className={() => navItemClass(active)}>
              <Icon size={18} />
              {item.label}
              <NavBadge count={count} />
            </NavLink>
          );
        })}
      </nav>

      <div className="flex justify-end">
        <button
          onClick={handleLogout}
          className="flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold text-slate-500 hover:bg-slate-100"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </header>
  );
}
