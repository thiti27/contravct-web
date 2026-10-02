import { useCallback, useEffect, useState } from 'react';
import { fetchMeta } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const EMPTY_META = { types: [], sections: [], years: [], statuses: [], counts: {} };

// `refreshKey` exists purely so callers can force a refetch (e.g. after an
// Approve/Return/Reject action changes the badge counts) without a full page reload.
export function useMeta() {
  const { user } = useAuth();
  const [meta, setMeta] = useState(EMPTY_META);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // MetaProvider wraps the whole app, including public pages reachable while logged
    // out (ContractDocumentsPage.jsx — a "Download Contract Documents" link opened
    // straight from an email, no session at all). Without this guard, a logged-out
    // visitor's very first render fired this fetch anyway, /api/meta 401'd (it does
    // require a session), and api.js's global response interceptor treated that
    // unrelated background 401 as a dead session and hard-redirected the whole page to
    // /login — hijacking a page that never needed a login in the first place.
    if (!user?.em_id) {
      setMeta(EMPTY_META);
      return;
    }

    let cancelled = false;
    fetchMeta({ createdBy: user.em_id, legal: user.legal })
      .then(data => !cancelled && setMeta({ ...EMPTY_META, ...data }))
      .catch(() => !cancelled && setMeta(EMPTY_META));
    return () => {
      cancelled = true;
    };
  }, [user?.em_id, user?.legal, refreshKey]);

  const refreshMeta = useCallback(() => setRefreshKey(k => k + 1), []);

  return { ...meta, refreshMeta };
}
