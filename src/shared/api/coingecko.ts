import axios, { AxiosError } from 'axios';
import type { CoinProfile, MarketCoin, PricePoint } from '../../entities/coin/model/types';

const BASE_URL = import.meta.env.VITE_COINGECKO_API || 'https://api.coingecko.com/api/v3';

export class ApiError extends Error {
  readonly status: number | undefined;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const http = axios.create({ baseURL: BASE_URL, timeout: 15000 });

http.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    const status = error.response?.status;
    const message =
      status === 429
        ? 'CoinGecko ограничил частоту запросов — показываем последние сохранённые данные'
        : status
          ? `CoinGecko ответил ошибкой ${status}`
          : 'Нет соединения с CoinGecko';
    return Promise.reject(new ApiError(message, status));
  },
);

export async function fetchMarkets(perPage = 50): Promise<MarketCoin[]> {
  const { data } = await http.get<MarketCoin[]>('/coins/markets', {
    params: {
      vs_currency: 'usd',
      order: 'market_cap_desc',
      per_page: perPage,
      page: 1,
      sparkline: true,
      price_change_percentage: '24h,7d',
    },
  });
  return data;
}

export async function fetchMarketChart(id: string, days: number | 'max'): Promise<PricePoint[]> {
  const { data } = await http.get<{ prices: [number, number][] }>(`/coins/${id}/market_chart`, {
    params: { vs_currency: 'usd', days },
  });
  return data.prices.map(([t, price]) => ({ t, price }));
}

interface RawProfile {
  id: string;
  description?: { en?: string };
  links?: { homepage?: string[] };
  genesis_date?: string | null;
  categories?: (string | null)[];
}

/** Описание из CoinGecko приходит с HTML-ссылками — оставляем только текст. */
export function stripHtml(html: string) {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\r\n/g, '\n')
    .trim();
}

export async function fetchProfile(id: string): Promise<CoinProfile> {
  const { data } = await http.get<RawProfile>(`/coins/${id}`, {
    params: {
      localization: false,
      tickers: false,
      market_data: false,
      community_data: false,
      developer_data: false,
      sparkline: false,
    },
  });
  return {
    id: data.id,
    description: stripHtml(data.description?.en ?? ''),
    homepage: data.links?.homepage?.find((h) => h && h.startsWith('http')) ?? null,
    genesisDate: data.genesis_date ?? null,
    categories: (data.categories ?? []).filter((c): c is string => Boolean(c)).slice(0, 4),
  };
}
