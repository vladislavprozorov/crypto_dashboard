import { describe, expect, test } from 'vitest';
import { computeIndicators } from '../indicators';
import { createIndicatorsClient } from '../indicatorsClient';

const closes = Array.from({ length: 80 }, (_, i) => 100 + Math.sin(i / 4) * 5);

/** Фейковый воркер: отвечает асинхронно и умеет отвечать в обратном порядке. */
function fakeWorker({ reverse = false } = {}) {
  const queue: { id: number; closes: Float64Array; ids: never[] }[] = [];
  const w = {
    onmessage: null as ((e: MessageEvent) => void) | null,
    onerror: null as ((e: ErrorEvent) => void) | null,
    transferred: [] as ArrayBuffer[],
    postMessage(msg: (typeof queue)[number], transfer: ArrayBuffer[]) {
      queue.push(msg);
      w.transferred.push(...transfer);
    },
    terminate() {},
    flush() {
      const items = reverse ? [...queue].reverse() : [...queue];
      queue.length = 0;
      for (const m of items) {
        w.onmessage?.({
          data: { id: m.id, result: computeIndicators(Array.from(m.closes), m.ids), ms: 1 },
        } as MessageEvent);
      }
    },
    crash() {
      w.onerror?.({ message: 'boom' } as ErrorEvent);
    },
  };
  return w;
}

describe('indicatorsClient', () => {
  test('без воркера считает в основном потоке', async () => {
    const client = createIndicatorsClient(() => null);
    const res = await client.compute(closes, ['sma20']);
    expect(res.via).toBe('main');
    expect(res.result.sma20).toEqual(computeIndicators(closes, ['sma20']).sma20);
  });

  test('ответы сопоставляются по id, даже если пришли не по порядку', async () => {
    const w = fakeWorker({ reverse: true });
    const client = createIndicatorsClient(() => w as unknown as Worker);
    const a = client.compute(closes, ['sma20']);
    const b = client.compute(closes, ['rsi']);
    w.flush();
    const [ra, rb] = await Promise.all([a, b]);
    expect(Object.keys(ra.result)).toEqual(['sma20']);
    expect(Object.keys(rb.result)).toEqual(['rsi']);
    expect(ra.via).toBe('worker');
    // цены переданы как transferable-буфер, без копирования
    expect(w.transferred).toHaveLength(2);
  });

  test('после падения воркера переключается на основной поток', async () => {
    const w = fakeWorker();
    const client = createIndicatorsClient(() => w as unknown as Worker);
    const p = client.compute(closes, ['ema50']);
    w.crash();
    await expect(p).rejects.toThrow('boom');
    expect((await client.compute(closes, ['ema50'])).via).toBe('main');
  });
});
