import { expect, test, vi } from 'vitest';
import { createLiveStore } from '../liveStore';

const tick = (pair: string, price: number, time: number) => ({
  pair,
  price,
  open: price,
  high: price,
  low: price,
  quoteVolume: 0,
  time,
});

test('тики копятся и публикуются одной пачкой', () => {
  const store = createLiveStore();
  const listener = vi.fn();
  store.subscribe(listener);

  store.push(tick('BTCUSDT', 1, 10));
  store.push(tick('BTCUSDT', 2, 20));
  store.push(tick('ETHUSDT', 3, 15));
  expect(listener).not.toHaveBeenCalled();

  store.flush();
  expect(listener).toHaveBeenCalledTimes(1);
  const snap = store.getSnapshot();
  expect(snap.ticks.BTCUSDT.price).toBe(2);
  expect(snap.ticks.ETHUSDT.price).toBe(3);
  expect(snap.lastTickAt).toBe(20);
  expect(snap.receivedAt).not.toBeNull();
});

test('пустой flush не будит подписчиков и не меняет снимок', () => {
  const store = createLiveStore();
  const before = store.getSnapshot();
  const listener = vi.fn();
  store.subscribe(listener);
  store.flush();
  expect(listener).not.toHaveBeenCalled();
  expect(store.getSnapshot()).toBe(before);
});

test('статус меняется только при реальном изменении', () => {
  const store = createLiveStore();
  const listener = vi.fn();
  store.subscribe(listener);
  store.setStatus('live');
  store.setStatus('live');
  expect(listener).toHaveBeenCalledTimes(1);
});
