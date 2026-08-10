import { useEffect, useState } from 'react';
import { fetchContracts } from '../lib/api';

// `filters.statuses` (array) scopes the request to a fixed set of statuses
// (e.g. the "Contract Making" tab only ever shows Saved/Waiting Approver *),
// while `filters.status` is the free-choice status dropdown on top of that scope.
export function useContracts(filters) {
  const [contracts, setContracts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    // eslint-disable-next-line no-unused-vars
    const { statuses, refreshKey, ...rest } = filters;
    const query = { ...rest, ...(statuses?.length ? { statuses: statuses.join(',') } : {}) };
    fetchContracts(query)
      .then(data => {
        if (cancelled) return;
        setContracts(data.items || []);
        setTotal(data.total || 0);
      })
      .catch(() => {
        if (cancelled) return;
        setContracts([]);
        setTotal(0);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  return { contracts, total, loading };
}
