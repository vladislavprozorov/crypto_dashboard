import { useCallback } from 'react';
import { readStored, useStoredState } from '../../../shared/lib/storage/useStoredState';

const KEY = 'watchlist:v1';
/** Ключ из прошлой версии приложения — переносим избранное, чтобы оно не пропало. */
const LEGACY_KEY = 'favoriteCoins';

function initial(): string[] {
  const legacy = readStored<string[] | null>(LEGACY_KEY, null);
  return Array.isArray(legacy) && legacy.length ? legacy : ['bitcoin', 'ethereum'];
}

const DEFAULT = initial();

export function useWatchlist() {
  const [ids, setIds] = useStoredState<string[]>(KEY, DEFAULT);

  const has = useCallback((id: string) => ids.includes(id), [ids]);
  const toggle = useCallback(
    (id: string) =>
      setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])),
    [setIds],
  );

  return { ids, has, toggle };
}
