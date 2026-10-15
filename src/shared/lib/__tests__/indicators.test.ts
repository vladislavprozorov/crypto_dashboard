import { describe, expect, test } from 'vitest';
import { bollinger, computeIndicators, ema, rsi, sma } from '../indicators';

const near = (a: (number | null)[], b: (number | null)[], digits = 6) => {
  expect(a).toHaveLength(b.length);
  a.forEach((v, i) => {
    if (b[i] == null) expect(v).toBeNull();
    else expect(v).toBeCloseTo(b[i] as number, digits);
  });
};

describe('sma', () => {
  test('окно 3', () => {
    near(sma([1, 2, 3, 4, 5, 6], 3), [null, null, 2, 3, 4, 5]);
  });
  test('данных меньше окна — всё null', () => {
    expect(sma([1, 2], 3)).toEqual([null, null]);
  });
});

describe('ema', () => {
  test('старт с SMA, дальше α = 2/(n+1)', () => {
    // period 3 → α = 0.5; старт = (2+4+6)/3 = 4; дальше 4·0.5+8·0.5 = 6; 6·0.5+10·0.5 = 8
    near(ema([2, 4, 6, 8, 10], 3), [null, null, 4, 6, 8]);
  });
  test('на постоянном ряде совпадает со значением', () => {
    near(ema(new Array(60).fill(7), 50).slice(49), new Array(11).fill(7));
  });
});

describe('bollinger', () => {
  test('ширина полос — 2 стандартных отклонения', () => {
    const { middle, upper, lower } = bollinger([2, 4, 4, 4, 5, 5, 7, 9], 8, 2);
    // классический пример: среднее 5, σ = 2
    expect(middle[7]).toBeCloseTo(5);
    expect(upper[7]).toBeCloseTo(9);
    expect(lower[7]).toBeCloseTo(1);
    expect(upper[6]).toBeNull();
  });
  test('на плоском ряде полосы схлопываются в среднюю', () => {
    const { upper, lower } = bollinger(new Array(25).fill(100), 20, 2);
    expect(upper[24]).toBeCloseTo(100);
    expect(lower[24]).toBeCloseTo(100);
  });
});

describe('rsi', () => {
  // эталонный ряд StockCharts. В их таблице 70.53 — из округлённых до сотых средних;
  // при точной арифметике RSI(14) = 70.46, 66.25, 66.48, 69.35, 66.29, 57.92
  const closes = [
    44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.1, 45.42, 45.84, 46.08, 45.89, 46.03, 45.61, 46.28,
    46.28, 46.0, 46.03, 46.41, 46.22, 45.64,
  ];
  test('совпадает с эталонным расчётом Уайлдера', () => {
    const r = rsi(closes, 14);
    expect(r[13]).toBeNull();
    near(r.slice(14), [70.46, 66.25, 66.48, 69.35, 66.29, 57.92], 1);
  });
  test('только рост — 100, плоско — 50', () => {
    expect(rsi([1, 2, 3, 4, 5], 3)[4]).toBe(100);
    expect(rsi([5, 5, 5, 5, 5], 3)[4]).toBe(50);
  });
  test('всегда в пределах 0..100', () => {
    const noisy = Array.from({ length: 300 }, (_, i) => 100 + Math.sin(i / 3) * 10 + (i % 7));
    rsi(noisy, 14)
      .filter((v): v is number => v != null)
      .forEach((v) => {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(100);
      });
  });
});

test('computeIndicators считает только запрошенное', () => {
  const closes = Array.from({ length: 60 }, (_, i) => i + 1);
  const res = computeIndicators(closes, ['sma20', 'rsi']);
  expect(Object.keys(res).sort()).toEqual(['rsi', 'sma20']);
  expect(res.sma20?.[59]).toBeCloseTo(50.5);
});
