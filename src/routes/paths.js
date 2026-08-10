// Single source of truth for every route path in the app.
// Import PATHS instead of hardcoding strings so links, redirects and route
// definitions can never drift apart.
export const PATHS = {
  LOGIN: '/login',
  UNAUTHORIZED: '/unauthorized',

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

  SETTINGS: '/settings',
  SETTINGS_ROLE: '/settings/role',
  SETTINGS_CONTRACT_TYPES: '/settings/contract-types',
};
