/** «Красивый» шаг сетки: 1, 2, 2.5 или 5 × 10ⁿ. */
export function niceStep(range: number, targetTicks = 4) {
  if (!(range > 0)) return 1;
  const raw = range / targetTicks;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const unit = raw / pow;
  const nice = unit <= 1 ? 1 : unit <= 2 ? 2 : unit <= 2.5 ? 2.5 : unit <= 5 ? 5 : 10;
  return nice * pow;
}

/** Ось Y с круглыми значениями, охватывающая [min, max]. */
export function niceDomain(min: number, max: number, targetTicks = 4) {
  if (min === max) {
    const pad = Math.abs(min) * 0.01 || 1;
    min -= pad;
    max += pad;
  }
  const step = niceStep(max - min, targetTicks);
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Number(v.toPrecision(12)));
  return { domain: [lo, hi] as [number, number], ticks, step };
}

export type TimeScale = 'intraday' | 'days' | 'months';

/**
 * Подписи оси X по границам естественных периодов (часы, сутки, месяцы),
 * прореженные до `max` штук — без повторов «9 окт, 9 окт».
 */
export function timeTicks(from: number, to: number, scale: TimeScale, max = 7) {
  const ticks: number[] = [];
  const d = new Date(from);
  if (scale === 'intraday') {
    d.setMinutes(0, 0, 0);
    d.setHours(d.getHours() + 1);
    for (; d.getTime() <= to; d.setHours(d.getHours() + 1)) ticks.push(d.getTime());
  } else if (scale === 'days') {
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 1);
    for (; d.getTime() <= to; d.setDate(d.getDate() + 1)) ticks.push(d.getTime());
  } else {
    d.setHours(0, 0, 0, 0);
    d.setDate(1);
    d.setMonth(d.getMonth() + 1);
    for (; d.getTime() <= to; d.setMonth(d.getMonth() + 1)) ticks.push(d.getTime());
  }
  // подпись у самого левого края обрезается — пропускаем её
  const span = to - from;
  const inside = ticks.filter((t) => (t - from) / span >= 0.04);
  if (inside.length <= max) return inside;
  const every = Math.ceil(inside.length / max);
  return inside.filter((_, i) => i % every === 0);
}
