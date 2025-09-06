// src/hooks/useCryptoData.ts
import { useTopCoins, useCoinHistory } from '../features/coins/model/useCoins';
import type { PricePoint, Coin } from '../types/crypto';

export function useCryptoData(selectedCoin = 'bitcoin', days = 7) {
  const topQuery = useTopCoins();
  const historyQuery = useCoinHistory(selectedCoin, days);

  return {
    coins: topQuery.data ?? ([] as Coin[]),
    history: historyQuery.data ?? ([] as PricePoint[]),
    loading: topQuery.isLoading || historyQuery.isLoading,
    error: topQuery.error ?? historyQuery.error ?? null,
    // полезные методы, которые раньше могли быть в хуке:
    refetch: async () => {
      await Promise.all([topQuery.refetch(), historyQuery.refetch()]);
    },
    // expose raw queries if needed
    _topQuery: topQuery,
    _historyQuery: historyQuery,
  };
}
