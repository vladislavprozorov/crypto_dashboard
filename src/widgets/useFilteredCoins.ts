import { useMemo } from 'react';
import type { Coin } from '../entities/coin/model/types';

export function useFilteredCoins(coins: Coin[], query: string, onlyIds?: string[]) {
  return useMemo(() => {
    const q = query.trim().toLowerCase();
    return coins.filter(
      (c) =>
        (!onlyIds || onlyIds.includes(c.id)) &&
        (!q || c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q)),
    );
  }, [coins, query, onlyIds]);
}
