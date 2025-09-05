import axios from 'axios';
import type { Coin } from '../types/crypto';

const API_URL = 'https://api.coingecko.com/api/v3';

export async function getTopCoins(): Promise<Coin[]> {
  const res = await axios.get<Coin[]>(`${API_URL}/coins/markets`, {
    params: {
      vs_currency: 'usd',
      order: 'market_cap_desc',
      per_page: 10,
      page: 1,
      sparkline: false,
    },
  });
  return res.data;
}

export async function getCoinHistory(coinId = 'bitcoin', days = 7) {
  const res = await axios.get(`${API_URL}/coins/${coinId}/market_chart`, {
    params: { vs_currency: 'usd', days },
  });
  return res.data;
}
