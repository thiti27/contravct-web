import { Home, Clock3, CheckSquare, Scale, Settings } from 'lucide-react';
import { PATHS } from '../routes/paths';

export const JOB_STATUS_TABS = [
  { key: 'my-job', label: 'My Job', badgeKey: 'myJob' },
  { key: 'my-history', label: 'My History' },
  { key: 'all-job', label: 'All Job' },
];

export const APPROVAL_TABS = [
  { key: 'waiting', label: 'Waiting Approve', badgeKey: 'waitingApprove' },
  { key: 'history', label: 'My History' },
];

export const LEGAL_TABS = [
  { key: 'waiting', label: 'Waiting Check', badgeKey: 'waitingCheck' },
  { key: 'history', label: 'Legal History' },
];

export const SETTINGS_TABS = [
  { key: 'role', label: 'Role' },
  { key: 'contract-types', label: 'Contract Type' },
];

// Top level primary navigation. `badgeKey` maps into the counts object returned by
// /api/meta (see contract-server) so badges stay data-driven. `tabs`, when present,
// turns that nav item into a dropdown (Header.jsx) listing its sub-pages instead of
// a plain link, so a persistent secondary tab-strip bar isn't needed on every page.
export const PRIMARY_NAV = [
  { key: 'home', label: 'Home', icon: Home, path: PATHS.HOME },
  { key: 'job-status', label: 'Job Status', icon: Clock3, path: PATHS.JOB_STATUS, badgeKey: 'myJob', tabs: JOB_STATUS_TABS },
  { key: 'approval', label: 'Approval', icon: CheckSquare, path: PATHS.APPROVAL, badgeKey: 'waitingApprove', tabs: APPROVAL_TABS },
  { key: 'legal', label: 'Legal', icon: Scale, path: PATHS.LEGAL, badgeKey: 'waitingCheck', tabs: LEGAL_TABS },
  { key: 'settings', label: 'Settings', icon: Settings, path: PATHS.SETTINGS, tabs: SETTINGS_TABS },
];

// Caps large counters for compact display in nav badges — anything past 99 just reads "99+".
export const formatBadgeCount = n => (n > 99 ? '99+' : n);

// Per-item permission gate, keyed by nav item `key` — items with no entry here are
// visible to everyone. Mirrors the route guards in routes/router.jsx (RequireRole);
// this only controls whether the link is *shown*, the route guard is what actually
// blocks direct navigation to a URL the user isn't allowed to see.
const NAV_PERMISSION = {
  legal: user => !!user?.legal,
  settings: user => !!user?.admin,
};

export const visibleNav = user => PRIMARY_NAV.filter(item => !NAV_PERMISSION[item.key] || NAV_PERMISSION[item.key](user));
