import { useEffect, useRef, useState } from 'react';
import type { Candle } from '../../../shared/api/binance';
import type { IndicatorId, IndicatorResult } from '../../../shared/lib/indicators';
import { indicatorsClient } from '../../../shared/lib/indicatorsClient';

const THROTTLE_MS = 1000;

/**
 * Индикаторы по ценам закрытия, посчитанные в Web Worker.
 * Живая свеча меняется каждые ~2 с — пересчёт не чаще раза в секунду,
 * а ответ на устаревший запрос отбрасывается.
 */
export function useIndicators(candles: Candle[], ids: readonly IndicatorId[]) {
  const [state, setState] = useState<{
    result: IndicatorResult;
    ms: number | null;
    via: 'worker' | 'main' | null;
    /** Для скольких свечей посчитан результат — чтобы не рисовать его поверх другого ряда */
    length: number;
    firstTime: number | null;
  }>({ result: {}, ms: null, via: null, length: 0, firstTime: null });
  const latest = useRef(0);
  const lastRun = useRef(0);
  const idsKey = ids.join(',');

  useEffect(() => {
    if (!candles.length || !ids.length) {
      setState({ result: {}, ms: null, via: null, length: 0, firstTime: null });
      return;
    }
    const run = () => {
      const req = ++latest.current;
      lastRun.current = performance.now();
      const length = candles.length;
      const firstTime = candles[0].time;
      indicatorsClient()
        .compute(
          candles.map((c) => c.close),
          ids,
        )
        .then((res) => {
          if (req !== latest.current) return;
          setState({ result: res.result, ms: res.ms, via: res.via, length, firstTime });
        })
        .catch(() => {
          // воркер упал — следующий запуск уйдёт в основной поток
        });
    };
    const wait = THROTTLE_MS - (performance.now() - lastRun.current);
    if (wait <= 0) {
      run();
      return;
    }
    const t = setTimeout(run, wait);
    return () => clearTimeout(t);
    // ids сравниваем по строковому ключу, а не по ссылке на массив
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candles, idsKey]);

  return state;
}
