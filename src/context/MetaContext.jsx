import { createContext, useContext } from 'react';
import { useMeta } from '../hooks/useMeta';

const MetaContext = createContext({ types: [], sections: [], years: [], statuses: [], counts: {}, refreshMeta: () => {} });

export function MetaProvider({ children }) {
  const meta = useMeta();
  return <MetaContext.Provider value={meta}>{children}</MetaContext.Provider>;
}

export function useMetaContext() {
  return useContext(MetaContext);
}
