'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { loadSnapshot } from '../lib/near';
import { PREVIEW_LEDGER, PREVIEW_QUOTE } from '../lib/preview';
import type { Quote, Snapshot } from '../lib/types';

type DataContextValue = Snapshot & {
  loading: boolean;
  refresh: () => Promise<void>;
  previewQuote: Quote;
};

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = useState<Snapshot>({ mode: 'live', ledger: null, policy: null, proposals: [], error: null });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const preview = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('mode') === 'preview';
    if (preview) {
      setSnapshot({ mode: 'preview', ledger: PREVIEW_LEDGER, policy: null, proposals: [], error: null });
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await loadSnapshot();
      setSnapshot({ mode: 'live', ...result, error: null });
    } catch (error) {
      setSnapshot((current) => ({ ...current, mode: 'live', ledger: null, policy: null, proposals: [], error: error instanceof Error ? error.message : String(error) }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(() => ({ ...snapshot, loading, refresh, previewQuote: PREVIEW_QUOTE }), [snapshot, loading, refresh]);
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const value = useContext(DataContext);
  if (!value) throw new Error('useData must be used inside DataProvider');
  return value;
}
