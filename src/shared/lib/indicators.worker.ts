/// <reference lib="webworker" />
import { computeIndicators, type IndicatorId } from './indicators';

export interface IndicatorRequest {
  id: number;
  closes: Float64Array;
  ids: IndicatorId[];
}

/** Фоновый поток: считает индикаторы, не блокируя отрисовку графика и live-тики. */
self.onmessage = (e: MessageEvent<IndicatorRequest>) => {
  const { id, closes, ids } = e.data;
  const started = performance.now();
  const result = computeIndicators(Array.from(closes), ids);
  (self as unknown as DedicatedWorkerGlobalScope).postMessage({
    id,
    result,
    ms: performance.now() - started,
  });
};
