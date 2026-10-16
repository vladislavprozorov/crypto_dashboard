import { useQuery } from '@tanstack/react-query';
import { fetchMarketChart, fetchMarkets, fetchProfile } from '../../../shared/api/coingecko';
import { fetchKlines, fetchUsdtPairs, type KlineInterval } from '../../../shared/api/binance';
import { fetchBinanceMarkets } from '../../../shared/api/binanceMarkets';
import { readStored, writeStored } from '../../../shared/lib/storage/useStoredState';
import type { MarketCoin, PricePoint } from '../model/types';

const MARKETS_CACHE_KEY = 'cache:markets:v1';
const CACHE_MAX_AGE = 24 * 60 * 60_000;

interface CachedMarkets {
  at: number;
  data: MarketCoin[];
}

export type MarketsSource = 'coingecko' | 'cache' | 'binance';

export interface MarketsResult {
  coins: MarketCoin[];
  source: MarketsSource;
  /** Когда данные были получены у источника */
  at: number;
  /** Почему пришлось взять запасной источник */
  reason?: string;
}

/**
 * Каскад источников: CoinGecko → снимок из localStorage (до суток) → упрощённый
 * список по данным Binance. Демо на GitHub Pages не должно оставаться пустым
 * из-за лимитов бесплатного API.
 */
export async function loadMarkets(deps: {
  primary: () => Promise<MarketCoin[]>;
  fallback: () => Promise<MarketCoin[]>;
  readCache: () => CachedMarkets | null;
  writeCache: (c: CachedMarkets) => void;
  now?: () => number;
}): Promise<MarketsResult> {
  const now = deps.now ?? Date.now;
  try {
    const coins = await deps.primary();
    const at = now();
    deps.writeCache({ at, data: coins });
    return { coins, source: 'coingecko', at };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    const cached = deps.readCache();
    if (cached?.data.length && now() - cached.at < CACHE_MAX_AGE) {
      return { coins: cached.data, source: 'cache', at: cached.at, reason };
    }
    try {
      return { coins: await deps.fallback(), source: 'binance', at: now(), reason };
    } catch {
      throw error;
    }
  }
}

const readCache = () => readStored<CachedMarkets | null>(MARKETS_CACHE_KEY, null);

export function useMarketsQuery() {
  return useQuery<MarketsResult>({
    queryKey: ['markets'],
    queryFn: () =>
      loadMarkets({
        primary: () => fetchMarkets(50),
        fallback: fetchBinanceMarkets,
        readCache,
        writeCache: (c) => writeStored(MARKETS_CACHE_KEY, c),
      }),
    // снимок из localStorage показываем сразу, но считаем устаревшим — сверху придёт свежий
    initialData: () => {
      const c = readCache();
      return c?.data.length ? { coins: c.data, source: 'cache' as const, at: c.at } : undefined;
    },
    initialDataUpdatedAt: 0,
    staleTime: 60_000,
    refetchInterval: 120_000,
    retry: 1,
    retryDelay: 5_000,
  });
}

export function usePairsQuery() {
  return useQuery({
    queryKey: ['binance', 'pairs'],
    queryFn: fetchUsdtPairs,
    staleTime: 60 * 60_000,
    gcTime: 2 * 60 * 60_000,
    retry: 2,
  });
}

/** Пара на Binance для монеты, если она там торгуется. */
export function pairFor(symbol: string, pairs: Set<string> | undefined) {
  if (!pairs) return null;
  const pair = `${symbol.toUpperCase()}USDT`;
  return pairs.has(pair) ? pair : null;
}

export const RANGES = ['1Д', '7Д', '1М', '1Г', 'ВСЁ'] as const;
export type Range = (typeof RANGES)[number];

const RANGE_CONFIG: Record<
  Range,
  { interval: KlineInterval; limit: number; days: number | 'max' }
> = {
  '1Д': { interval: '15m', limit: 96, days: 1 },
  '7Д': { interval: '1h', limit: 168, days: 7 },
  '1М': { interval: '4h', limit: 180, days: 30 },
  '1Г': { interval: '1d', limit: 365, days: 365 },
  ВСЁ: { interval: '1w', limit: 1000, days: 'max' },
};

/**
 * История цены. Если монета торгуется на Binance — свечи оттуда (лимиты мягкие),
 * иначе — market_chart CoinGecko.
 */
export function useHistoryQuery(coinId: string | undefined, pair: string | null, range: Range) {
  const cfg = RANGE_CONFIG[range];
  // источник выбираем только когда известен список пар, иначе зря дёрнем CoinGecko
  const pairsReady = !usePairsQuery().isPending;
  return useQuery<PricePoint[]>({
    queryKey: ['history', coinId, pair, range],
    queryFn: () =>
      pair ? fetchKlines(pair, cfg.interval, cfg.limit) : fetchMarketChart(coinId!, cfg.days),
    enabled: Boolean(coinId) && pairsReady,
    staleTime: range === '1Д' ? 60_000 : 5 * 60_000,
    placeholderData: (prev) => prev,
  });
}

export function useProfileQuery(coinId: string | undefined) {
  return useQuery({
    queryKey: ['profile', coinId],
    queryFn: () => fetchProfile(coinId!),
    enabled: Boolean(coinId),
    staleTime: 60 * 60_000,
    retry: 0,
  });
}
