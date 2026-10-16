import { describe, expect, test } from 'vitest';
import { niceDomain, niceStep, timeTicks } from '../chartTicks';

describe('niceStep', () => {
  test.each([
    [6000, 2000],
    [4657, 2000],
    [3000, 1000],
    [0.03, 0.01],
    [90, 25],
  ])('диапазон %s → шаг %s', (range, step) => expect(niceStep(range, 4)).toBeCloseTo(step));
});

describe('niceDomain', () => {
  test('округляет границы до шага и охватывает данные', () => {
    const { domain, ticks } = niceDomain(79888, 84545, 4);
    expect(domain).toEqual([78000, 86000]);
    expect(ticks).toEqual([78000, 80000, 82000, 84000, 86000]);
  });
  test('плоский ряд не ломает ось', () => {
    const { domain } = niceDomain(1, 1);
    expect(domain[0]).toBeLessThan(1);
    expect(domain[1]).toBeGreaterThan(1);
  });
});

describe('timeTicks', () => {
  const day = 24 * 3600_000;
  const start = new Date(2026, 9, 8, 14, 30).getTime();

  test('дни — по полуночи, без повторов', () => {
    const ticks = timeTicks(start, start + 7 * day, 'days');
    const labels = ticks.map((t) => new Date(t).getDate());
    expect(new Set(labels).size).toBe(labels.length);
    ticks.forEach((t) => expect(new Date(t).getHours()).toBe(0));
  });
  test('прореживает до max', () => {
    expect(timeTicks(start, start + day, 'intraday', 6).length).toBeLessThanOrEqual(6);
  });
  test('месяцы — первое число', () => {
    const ticks = timeTicks(start, start + 365 * day, 'months');
    ticks.forEach((t) => expect(new Date(t).getDate()).toBe(1));
  });
});
