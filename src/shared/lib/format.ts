const THIN_SPACE = '\u2009';
const MINUS = '−';

/** Группирует разряды тонким пробелом: 82 284.17 — читается как в биржевых сводках. */
function group(value: string) {
  return value.replace(/,/g, THIN_SPACE);
}

/** Сколько знаков после запятой показывать для цены, чтобы мелкие монеты не превращались в $0.00. */
export function priceDigits(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1000) return 2;
  if (abs >= 1) return 2;
  if (abs >= 0.01) return 4;
  if (abs === 0) return 2;
  return 8;
}

export function formatNumber(value: number, digits = 2) {
  if (!Number.isFinite(value)) return '—';
  return group(
    value.toLocaleString('en-US', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }),
  );
}

export function formatUsd(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return '—';
  const sign = value < 0 ? MINUS : '';
  return `${sign}$${formatNumber(Math.abs(value), priceDigits(value))}`;
}

/** $1.63T, $41.2B — для капитализации и объёмов. */
export function formatCompactUsd(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return '—';
  return `$${value.toLocaleString('en-US', {
    notation: 'compact',
    maximumFractionDigits: 2,
  })}`;
}

export function formatCompact(value: number | null | undefined, suffix = '') {
  if (value == null || !Number.isFinite(value)) return '—';
  const text = value.toLocaleString('en-US', { notation: 'compact', maximumFractionDigits: 2 });
  return suffix ? `${text} ${suffix}` : text;
}

/** +5.74% / −1.84% / 0.00% — со знаком и настоящим минусом. */
export function formatPct(value: number | null | undefined, digits = 2) {
  if (value == null || !Number.isFinite(value)) return '—';
  const abs = Math.abs(value).toFixed(digits);
  if (Number(abs) === 0) return `${(0).toFixed(digits)}%`;
  return `${value > 0 ? '+' : MINUS}${abs}%`;
}

export type Trend = 'up' | 'down' | 'flat';

export function trendOf(value: number | null | undefined, epsilon = 0.005): Trend {
  if (value == null || !Number.isFinite(value) || Math.abs(value) < epsilon) return 'flat';
  return value > 0 ? 'up' : 'down';
}

export function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatDateTime(ts: number) {
  return new Date(ts).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Разбор числа из поля ввода: допускает пробелы-разделители и запятую. */
export function parseAmount(input: string): number | null {
  const normalized = input.replace(/[\s\u2009\u00a0]/g, '').replace(',', '.');
  if (!normalized || !/^\d*\.?\d+$|^\d+\.$/.test(normalized)) return null;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}
