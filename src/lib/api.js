import axios from 'axios';

export const SERVER_BASE = 'http://localhost:1312';
// export const SERVER_BASE = 'http://159.228.251.234:1312';
export const API_BASE = `${SERVER_BASE}/api`;

export const fileUrl = path => `${SERVER_BASE}${path}`;

export const apiClient = axios.create({ baseURL: API_BASE });

// AuthContext persists the full login response (including `token`) under this key —
// exported so both modules share one source of truth for the storage key instead of
// duplicating the string literal.
export const AUTH_STORAGE_KEY = 'contract-auth';

// Every backend route except /login now requires `Authorization: Bearer <token>`
// (see contract-server's app/middleware/auth.js) — attach it here once for every
// request instead of threading it through each individual api.js function. Harmless
// on /login itself: that route doesn't check the header, and there's no token to send
// yet on a user's very first login anyway.
apiClient.interceptors.request.use(config => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    const token = raw ? JSON.parse(raw)?.token : null;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {
    // Malformed/unavailable storage just means the request goes out unauthenticated —
    // the backend will 401 it like any other missing-token request.
  }
  return config;
});

// A token that expires mid-session (JWT_EXP) would otherwise fail every subsequent
// request silently — every page would just show empty data with no indication why.
// Clearing the stale auth and bouncing to /login makes that recoverable instead of a
// dead end. A wrong-password 401 from /login itself also passes through here, but the
// pathname check below skips the redirect when already on /login — login()'s own
// catch block (see below) still turns that rejection into the usual error message.
apiClient.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    }
    return Promise.reject(err);
  }
);

export function fetchMeta(params = {}) {
  const query = Object.fromEntries(Object.entries(params).filter(([, value]) => value));
  return apiClient.get('/meta', { params: query }).then(res => res.data);
}

export function fetchContracts(filters = {}) {
  const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
  return apiClient.get('/contracts', { params }).then(res => res.data);
}

// Approval > My History — Approve/Return/Reject actions taken by the given em_id.
export function fetchApprovalHistory(params = {}) {
  const query = Object.fromEntries(Object.entries(params).filter(([, value]) => value));
  return apiClient.get('/approval-history', { params: query }).then(res => res.data);
}

// Legal > History — Check/Terminate actions by any legal user (shared queue, not
// filtered by who's logged in).
export function fetchLegalHistory(params = {}) {
  const query = Object.fromEntries(Object.entries(params).filter(([, value]) => value));
  return apiClient.get('/legal-history', { params: query }).then(res => res.data);
}

export function fetchForms() {
  return apiClient.get('/forms').then(res => res.data);
}

// `params.search` (em_id / first name / last name) is optional — omitted, the
// backend returns its first 10 active employees instead of the full company
// directory. See ApprovalSection.jsx for the AsyncSelect that drives this.
export function fetchEmployees(params = {}) {
  return apiClient.get('/employees', { params }).then(res => res.data);
}

export function fetchContractTypes() {
  return apiClient.get('/contract-types').then(res => res.data);
}

// ---------------------------------------------------------------------------
// Admin: Settings > Contract Type management
// ---------------------------------------------------------------------------
export function fetchAdminContractTypes() {
  return apiClient.get('/admin/contract-types').then(res => res.data);
}

export function createContractType(payload) {
  return apiClient.post('/admin/contract-types', payload).then(res => res.data);
}

export function updateContractType(id, payload) {
  return apiClient.patch(`/admin/contract-types/${id}`, payload).then(res => res.data);
}

export function createPurpose(contractTypeId, payload) {
  return apiClient.post(`/admin/contract-types/${contractTypeId}/purposes`, payload).then(res => res.data);
}

export function updatePurpose(id, payload) {
  return apiClient.patch(`/admin/purposes/${id}`, payload).then(res => res.data);
}

export function attachFormItemLang(purposeId, lang, fileId) {
  return apiClient.post(`/admin/purposes/${purposeId}/form-item/${lang}`, { fileId }).then(res => res.data);
}

export function deleteFormItemLang(purposeId, lang) {
  return apiClient.delete(`/admin/purposes/${purposeId}/form-item/${lang}`).then(res => res.data);
}

// ---------------------------------------------------------------------------
// Global documents: Contract Procedure, User Manual (both Home page), and Check
// Sheet (every row on Download Form). Exactly one of each, managed from
// Settings > Contract Type.
// ---------------------------------------------------------------------------
export function fetchGlobalDocuments() {
  return apiClient.get('/global-documents').then(res => res.data);
}

export function attachGlobalDocument(key, fileId, { emId, updatedName } = {}) {
  return apiClient.post(`/admin/global-documents/${key}`, { fileId, emId, updatedName }).then(res => res.data);
}

export function submitContractRequest(payload) {
  return apiClient.post('/requests', payload).then(res => res.data);
}

export function fetchContractRequest(id) {
  return apiClient.get(`/requests/${id}`).then(res => res.data);
}

export function updateContractRequest(id, payload) {
  return apiClient.patch(`/requests/${id}`, payload).then(res => res.data);
}

// ---------------------------------------------------------------------------
// Approval workflow (Waiting Approve screen) — Approve / Return / Reject.
// ---------------------------------------------------------------------------
export function approveContractRequest(id, payload) {
  return apiClient.post(`/contract-request/${id}/approve`, payload).then(res => res.data);
}

export function returnContractRequest(id, payload) {
  return apiClient.post(`/contract-request/${id}/return`, payload).then(res => res.data);
}

export function rejectContractRequest(id, payload) {
  return apiClient.post(`/contract-request/${id}/reject`, payload).then(res => res.data);
}

// ---------------------------------------------------------------------------
// Legal Review Mode (Legal > Waiting screen) — Comment / Check / Terminate.
// ---------------------------------------------------------------------------
export function commentOnLegalRequest(id, payload) {
  return apiClient.post(`/contract-request/${id}/legal-comment`, payload).then(res => res.data);
}

export function checkLegalRequest(id, payload) {
  return apiClient.post(`/contract-request/${id}/legal-check`, payload).then(res => res.data);
}

export function terminateLegalRequest(id, payload) {
  return apiClient.post(`/contract-request/${id}/legal-terminate`, payload).then(res => res.data);
}

export function markNoNeedLegalRequest(id, payload) {
  return apiClient.post(`/contract-request/${id}/legal-no-need`, payload).then(res => res.data);
}

export function cancelLegalRequest(id, payload) {
  return apiClient.post(`/contract-request/${id}/legal-cancel`, payload).then(res => res.data);
}

// ---------------------------------------------------------------------------
// Upload Sign Contract (More > Upload Sign Contract, only while status = 'Drafted').
// ---------------------------------------------------------------------------
export function uploadSignedContract(id, payload) {
  return apiClient.post(`/contract-request/${id}/upload-signed`, payload).then(res => res.data);
}

export function uploadFiles(files) {
  const formData = new FormData();
  Array.from(files).forEach(file => formData.append('files', file));
  return apiClient.post('/uploads', formData).then(res => res.data);
}

export function deleteUpload(id) {
  return apiClient.delete(`/uploads/${id}`).then(res => res.data);
}

// Every route requires the Bearer token now (see the request interceptor above), but
// a plain <a href={...}> download link is a raw browser navigation — it can't attach
// that header, so it always 401'd. Fetching the file through apiClient (blob response,
// same auth interceptor as every other request) and saving it via a throwaway object
// URL keeps the request authenticated. Passing `displayName` straight to the anchor's
// `download` attribute — a real JS string, no header/encoding involved — also means
// non-ASCII (e.g. Thai) filenames come through correctly regardless of what the
// server's Content-Disposition header says.
export async function downloadUploadFile(id, displayName) {
  const res = await apiClient.get(`/uploads/${id}/download`, { responseType: 'blob' });
  const blobUrl = URL.createObjectURL(res.data);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = displayName || '';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(blobUrl);
}

export async function login(username, password) {
  try {
    const res = await apiClient.post('/login', { username, password });
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'เข้าสู่ระบบไม่สำเร็จ');
  }
}
