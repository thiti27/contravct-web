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
    let cancelled = false;
    fetchMeta({ createdBy: user?.em_id, legal: user?.legal })
      .then(data => !cancelled && setMeta({ ...EMPTY_META, ...data }))
      .catch(() => !cancelled && setMeta(EMPTY_META));
    return () => {
      cancelled = true;
    };
  }, [user?.em_id, user?.legal, refreshKey]);

  const refreshMeta = useCallback(() => setRefreshKey(k => k + 1), []);

  return { ...meta, refreshMeta };
}
