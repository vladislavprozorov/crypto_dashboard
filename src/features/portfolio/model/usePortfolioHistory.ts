import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { pairFor, usePairsQuery } from '../../../entities/coin/api/queries';
import type { PricePoint } from '../../../entities/coin/model/types';
import type { Transaction } from '../../../entities/transaction/model/types';
import { fetchKlines } from '../../../shared/api/binance';
import { valueHistory, type ValuePoint } from './calc';

export const HISTORY_RANGES = ['1М', '3М', '6М', '1Г', 'ВСЁ'] as const;
export type HistoryRange = (typeof HISTORY_RANGES)[number];

const DAY = 24 * 3600_000;
const RANGE_DAYS: Record<HistoryRange, number> = {
  '1М': 30,
  '3М': 90,
  '6М': 180,
  '1Г': 365,
  ВСЁ: 1000,
};

/**
 * Дневная история стоимости портфеля: для каждой монеты из сделок берём дневные
 * свечи Binance и восстанавливаем остатки на каждый день. Монеты без пары на Binance
 * оцениваются по текущей цене.
 */
export function usePortfolioHistory(
  txs: Transaction[],
  range: HistoryRange,
  currentPrices: Record<string, number | undefined>,
) {
  const { data: pairs, isPending: pairsPending } = usePairsQuery();

  const coins = useMemo(() => {
    const m = new Map<string, string>();
    for (const t of txs) if (!m.has(t.coinId)) m.set(t.coinId, t.symbol);
    return [...m.entries()].map(([coinId, symbol]) => ({ coinId, pair: pairFor(symbol, pairs) }));
  }, [txs, pairs]);

  const first = txs.length ? Math.min(...txs.map((t) => t.date)) : Date.now();
  const days = Math.min(RANGE_DAYS[range], Math.max(2, Math.ceil((Date.now() - first) / DAY) + 1));

  const results = useQueries({
    queries: coins.map((c) => ({
      queryKey: ['klines', c.pair, '1d', 1000],
      // одна загрузка 1000 дней на монету — все периоды режутся из неё
      queryFn: () => fetchKlines(c.pair!, '1d', 1000),
      enabled: Boolean(c.pair),
      staleTime: 30 * 60_000,
    })),
  });

  const loading = pairsPending || results.some((r) => r.isPending && r.fetchStatus !== 'idle');
  const dataKey = results.map((r) => r.dataUpdatedAt).join(',');

  const points = useMemo<ValuePoint[]>(() => {
    if (!txs.length) return [];
    const series: Record<string, PricePoint[] | undefined> = {};
    coins.forEach((c, i) => (series[c.coinId] = results[i]?.data));
    const now = Date.now();
    const start = Math.max(now - days * DAY, first - DAY);
    const times: number[] = [];
    for (let t = start; t < now; t += DAY) times.push(t);
    times.push(now);
    const pts = valueHistory(txs, series, times, currentPrices);
    // последняя точка — по live-ценам, остальные — по дневным закрытиям
    pts[pts.length - 1] = valueHistory(txs, {}, [now], currentPrices)[0] ?? pts[pts.length - 1];
    return pts;
    // results в зависимостях заменён на dataKey: массив useQueries новый на каждый рендер
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txs, coins, dataKey, days, first, currentPrices]);

  return { points, loading };
}
