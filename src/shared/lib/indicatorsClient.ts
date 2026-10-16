import { computeIndicators, type IndicatorId, type IndicatorResult } from './indicators';

export interface IndicatorResponse {
  result: IndicatorResult;
  /** Время расчёта в мс и где он шёл */
  ms: number;
  via: 'worker' | 'main';
}

type Pending = { resolve: (r: IndicatorResponse) => void; reject: (e: Error) => void };

/**
 * Клиент воркера индикаторов. Один воркер на приложение, запросы различаются по id,
 * поэтому ответы на устаревшие запросы (пользователь уже сменил период) не путаются.
 * Если Worker недоступен — считаем в основном потоке, результат тот же.
 */
export function createIndicatorsClient(createWorker?: () => Worker | null) {
  let worker: Worker | null = null;
  let broken = false;
  let seq = 0;
  const pending = new Map<number, Pending>();

  const getWorker = () => {
    if (broken) return null;
    if (!worker) {
      try {
        worker =
          createWorker?.() ??
          (typeof Worker !== 'undefined'
            ? new Worker(new URL('./indicators.worker.ts', import.meta.url), { type: 'module' })
            : null);
      } catch {
        worker = null;
      }
      if (!worker) {
        broken = true;
        return null;
      }
      worker.onmessage = (e: MessageEvent<{ id: number; result: IndicatorResult; ms: number }>) => {
        const p = pending.get(e.data.id);
        if (!p) return;
        pending.delete(e.data.id);
        p.resolve({ result: e.data.result, ms: e.data.ms, via: 'worker' });
      };
      worker.onerror = (e) => {
        // воркер упал — отклоняем ожидающих и дальше считаем в основном потоке
        broken = true;
        pending.forEach((p) => p.reject(new Error(e.message || 'Indicators worker failed')));
        pending.clear();
        worker?.terminate();
        worker = null;
      };
    }
    return worker;
  };

  function compute(closes: number[], ids: readonly IndicatorId[]): Promise<IndicatorResponse> {
    const w = getWorker();
    if (!w) {
      const started = performance.now();
      const result = computeIndicators(closes, ids);
      return Promise.resolve({ result, ms: performance.now() - started, via: 'main' });
    }
    const id = ++seq;
    const buffer = Float64Array.from(closes);
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      // буфер передаётся без копирования (transferable)
      w.postMessage({ id, closes: buffer, ids: [...ids] }, [buffer.buffer]);
    });
  }

  return {
    compute,
    terminate() {
      worker?.terminate();
      worker = null;
      pending.clear();
    },
  };
}

let shared: ReturnType<typeof createIndicatorsClient> | null = null;
export const indicatorsClient = () => (shared ??= createIndicatorsClient());
