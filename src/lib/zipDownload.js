// Shared by every "bundle several files into one zip and save it" download (Drafted's
// full document package, Signed/Terminated's form + signed contract) — see
// downloadDraftedContractZip.js/downloadSignedContractZip.js.

// Sanitizes a display name into something safe as a zip entry — every OS-reserved
// character (Windows in particular disallows all of these in a file name) collapsed to
// "-" so nothing silently breaks extraction later.
export const safeZipEntryName = name => name.replace(/[\\/:*?"<>|]/g, '-');

// Same throwaway-blob-URL download pattern used everywhere else in this app (see
// lib/api.js's downloadUploadFile) — just handed a zip's generateAsync blob instead of
// a plain file blob.
export function triggerZipDownload(zipBlob, fileName) {
  const blobUrl = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(blobUrl);
}
