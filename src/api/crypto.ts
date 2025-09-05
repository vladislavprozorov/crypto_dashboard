import api from './axios';
import type { Coin } from '../types/crypto';

export async function getTopCoins(): Promise<Coin[]> {
  const { data } = await api.get<Coin[]>('/coins/markets', {
    params: {
      vs_currency: 'usd',
      order: 'market_cap_desc',
      per_page: 10,
      page: 1,
      sparkline: false,
    },
  });
  return data;
}

export interface CoinHistoryResponse {
  prices: number[][];
  market_caps?: number[][];
  total_volumes?: number[][];
}

export async function getCoinHistory(
  coinId = 'bitcoin',
  days = 7
): Promise<CoinHistoryResponse> {
  const { data } = await api.get<CoinHistoryResponse>(
    `/coins/${coinId}/market_chart`,
    {
      params: { vs_currency: 'usd', days },
    }
  );
  return data;
}
