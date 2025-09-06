// src/features/coins/model/useCoins.ts
import { useQuery } from '@tanstack/react-query';
import { getTopCoins, getCoinHistory } from '../../../api/crypto';
import type { Coin, PricePoint } from '../../../types/crypto';

export function useTopCoins() {
  return useQuery<Coin[], Error>({
    queryKey: ['coins', 'top10'],
    queryFn: () => getTopCoins(),
    staleTime: 1000 * 60, // 1 min
    gcTime: 1000 * 60 * 10,
    retry: 2,
  });
}

export function useCoinHistory(coinId = 'bitcoin', days = 7) {
  return useQuery<PricePoint[], Error>({
    queryKey: ['coins', coinId, 'history', days],
    queryFn: async () => {
      const data = await getCoinHistory(coinId, days);
      return (data.prices || []).map((p: number[]) => ({
        date: new Date(p[0]).toLocaleDateString(),
        price: p[1],
      }));
    },
    enabled: !!coinId,
    staleTime: 1000 * 30,
  });
}
