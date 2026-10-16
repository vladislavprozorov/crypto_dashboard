import { useMemo } from 'react';
import type { MiniTicker } from '../../../shared/api/binance';
import { pairFor, useMarketsQuery, usePairsQuery } from '../../../entities/coin/api/queries';
import type { Coin, MarketCoin } from '../../../entities/coin/model/types';
import { useLiveSnapshot } from './context';

/** Расхождение, после которого считаем, что тикер Binance — другая монета с тем же символом. */
const MAX_DEVIATION = 0.2;

export function mergeLive(
  market: MarketCoin,
  pair: string | null,
  tick: MiniTicker | undefined,
): Coin {
  const base: Coin = {
    ...market,
    pair,
    liveAt: null,
    change24h: market.price_change_percentage_24h_in_currency ?? market.price_change_percentage_24h,
    change7d: market.price_change_percentage_7d_in_currency ?? null,
  };
  if (!pair || !tick || !market.current_price) return base;
  if (Math.abs(tick.price / market.current_price - 1) > MAX_DEVIATION) {
    return { ...base, pair: null };
  }
  return {
    ...base,
    current_price: tick.price,
    high_24h: tick.high,
    low_24h: tick.low,
    change24h: tick.open ? ((tick.price - tick.open) / tick.open) * 100 : base.change24h,
    liveAt: tick.time,
  };
}

/** Список рынка с наложенными live-ценами. */
export function useCoins() {
  const query = useMarketsQuery();
  const { data: pairs } = usePairsQuery();
  const { ticks } = useLiveSnapshot();

  const coins = useMemo(
    () =>
      (query.data?.coins ?? []).map((m) => {
        const pair = pairFor(m.symbol, pairs);
        return mergeLive(m, pair, pair ? ticks[pair] : undefined);
      }),
    [query.data, pairs, ticks],
  );

  return { coins, query };
}

export function useCoin(id: string | undefined) {
  const { coins, query } = useCoins();
  const coin = useMemo(() => coins.find((c) => c.id === id), [coins, id]);
  return { coin, query };
}
