// Single source of truth for every route path in the app.
// Import PATHS instead of hardcoding strings so links, redirects and route
// definitions can never drift apart.
export const PATHS = {
  LOGIN: '/login',
  UNAUTHORIZED: '/unauthorized',
  // Public — no leading requirement to be logged in (see router.jsx); :contractNo is
  // filled in by contractDocumentsPath below, never hand-built with a template string.
  CONTRACT_DOCUMENTS: '/contract-documents/:contractNo',

  HOME: '/',
  NEW_REQUEST: '/new-request',
  CONTRACT_MAKING: '/contract-making',
  UPLOAD_CONTRACT: '/upload-contract',

  DOWNLOAD_FORM: '/download-form',

  JOB_STATUS: '/job-status',
  JOB_STATUS_MY_JOB: '/job-status/my-job',
  JOB_STATUS_MY_HISTORY: '/job-status/my-history',
  JOB_STATUS_ALL_JOB: '/job-status/all-job',

  APPROVAL: '/approval',
  APPROVAL_WAITING: '/approval/waiting',
  APPROVAL_HISTORY: '/approval/history',

  LEGAL: '/legal',
  LEGAL_WAITING: '/legal/waiting',
  LEGAL_HISTORY: '/legal/history',
  LEGAL_SCHEDULED_EMAILS: '/legal/scheduled-emails',

  SETTINGS: '/settings',
  SETTINGS_ROLE: '/settings/role',
  SETTINGS_CONTRACT_TYPES: '/settings/contract-types',
};

// The one real link to a specific contract's Contract Documents page — used by
// anything that needs to build that URL (e.g. a "Copy link" action), never a raw
// template string, so it can never drift from PATHS.CONTRACT_DOCUMENTS above.
export const contractDocumentsPath = contractNo => `/contract-documents/${encodeURIComponent(contractNo)}`;
