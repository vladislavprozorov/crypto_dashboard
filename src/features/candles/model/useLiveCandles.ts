import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Range } from '../../../entities/coin/api/queries';
import {
  fetchCandles,
  klineStreamUrl,
  mergeCandle,
  parseKline,
  type Candle,
  type KlineInterval,
} from '../../../shared/api/binance';
import { createReconnectingSocket } from '../../../shared/lib/ws/createReconnectingSocket';

/** Интервал свечи и сколько свечей видно для каждого периода. */
export const CANDLE_RANGES: Record<Range, { interval: KlineInterval; visible: number }> = {
  '1Д': { interval: '15m', visible: 96 },
  '7Д': { interval: '1h', visible: 168 },
  '1М': { interval: '4h', visible: 180 },
  '1Г': { interval: '1d', visible: 365 },
  ВСЁ: { interval: '1w', visible: 600 },
};

/** Запас свечей слева, чтобы EMA(50) и Bollinger(20) были посчитаны с первой видимой свечи. */
export const WARMUP = 60;

/**
 * Свечи пары: история по REST + текущая свеча по WebSocket-потоку kline.
 * Тики приходят примерно раз в 2 секунды и вливаются в последнюю свечу.
 */
export function useLiveCandles(pair: string | null, range: Range) {
  const { interval, visible } = CANDLE_RANGES[range];
  const limit = Math.min(1000, visible + WARMUP);

  const query = useQuery({
    queryKey: ['candles', pair, interval, limit],
    queryFn: () => fetchCandles(pair!, interval, limit),
    enabled: Boolean(pair),
    staleTime: 60_000,
  });

  const [candles, setCandles] = useState<Candle[]>([]);

  useEffect(() => {
    setCandles(query.data ?? []);
  }, [query.data]);

  useEffect(() => {
    if (!pair) return;
    const socket = createReconnectingSocket({
      url: klineStreamUrl(pair, interval),
      onMessage: (raw) => {
        const k = parseKline(raw);
        if (!k || k.interval !== interval) return;
        const { interval: _i, ...candle } = k;
        void _i;
        setCandles((prev) => (prev.length ? mergeCandle(prev, candle) : prev));
      },
    });
    return () => socket.close();
  }, [pair, interval]);

  return { candles, visible, interval, query };
}
