/**
 * Технические индикаторы. Все функции возвращают массив той же длины, что и вход;
 * пока данных для окна не хватает — null (на графике там просто нет линии).
 */

export type Series = (number | null)[];

/** Простая скользящая средняя за `period` значений. Скользящая сумма — O(n). */
export function sma(values: number[], period: number): Series {
  const out: Series = new Array(values.length).fill(null);
  if (period <= 0) return out;
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

/**
 * Экспоненциальная скользящая средняя: α = 2 / (period + 1).
 * Стартовое значение — SMA первых `period` точек, как в большинстве терминалов.
 */
export function ema(values: number[], period: number): Series {
  const out: Series = new Array(values.length).fill(null);
  if (period <= 0 || values.length < period) return out;
  const k = 2 / (period + 1);
  let prev = 0;
  for (let i = 0; i < period; i++) prev += values[i];
  prev /= period;
  out[period - 1] = prev;
  for (let i = period; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
    out[i] = prev;
  }
  return out;
}

export interface BollingerBands {
  middle: Series;
  upper: Series;
  lower: Series;
}

/** Полосы Боллинджера: SMA ± mult × стандартное отклонение (по генеральной совокупности). */
export function bollinger(values: number[], period = 20, mult = 2): BollingerBands {
  const middle = sma(values, period);
  const upper: Series = new Array(values.length).fill(null);
  const lower: Series = new Array(values.length).fill(null);
  let sumSq = 0;
  for (let i = 0; i < values.length; i++) {
    sumSq += values[i] * values[i];
    if (i >= period) sumSq -= values[i - period] * values[i - period];
    const m = middle[i];
    if (m == null) continue;
    // max(0, …) — защита от отрицательной дисперсии из-за погрешности float
    const sd = Math.sqrt(Math.max(0, sumSq / period - m * m));
    upper[i] = m + mult * sd;
    lower[i] = m - mult * sd;
  }
  return { middle, upper, lower };
}

/**
 * RSI Уайлдера: средние рост и падение сглаживаются как
 * avg = (prev × (period − 1) + current) / period. Значение 0..100.
 */
export function rsi(values: number[], period = 14): Series {
  const out: Series = new Array(values.length).fill(null);
  if (values.length <= period) return out;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const d = values[i] - values[i - 1];
    if (d >= 0) gain += d;
    else loss -= d;
  }
  gain /= period;
  loss /= period;
  const value = () => (loss === 0 ? (gain === 0 ? 50 : 100) : 100 - 100 / (1 + gain / loss));
  out[period] = value();
  for (let i = period + 1; i < values.length; i++) {
    const d = values[i] - values[i - 1];
    gain = (gain * (period - 1) + Math.max(d, 0)) / period;
    loss = (loss * (period - 1) + Math.max(-d, 0)) / period;
    out[i] = value();
  }
  return out;
}

export const INDICATORS = ['sma20', 'ema50', 'bb', 'rsi'] as const;
export type IndicatorId = (typeof INDICATORS)[number];

export interface IndicatorResult {
  sma20?: Series;
  ema50?: Series;
  bb?: BollingerBands;
  rsi?: Series;
}

/** Считает выбранные индикаторы по ценам закрытия — эту функцию вызывает воркер. */
export function computeIndicators(closes: number[], ids: readonly IndicatorId[]): IndicatorResult {
  const res: IndicatorResult = {};
  for (const id of ids) {
    if (id === 'sma20') res.sma20 = sma(closes, 20);
    else if (id === 'ema50') res.ema50 = ema(closes, 50);
    else if (id === 'bb') res.bb = bollinger(closes, 20, 2);
    else if (id === 'rsi') res.rsi = rsi(closes, 14);
  }
  return res;
}
