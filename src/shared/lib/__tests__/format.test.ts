import { describe, expect, test } from 'vitest';
import {
  formatCompactUsd,
  formatPct,
  formatUsd,
  parseAmount,
  priceDigits,
  trendOf,
} from '../format';

const T = ' ';

describe('formatUsd', () => {
  test('группирует разряды тонким пробелом', () => {
    expect(formatUsd(82284.17)).toBe(`$82${T}284.17`);
  });
  test('мелким монетам даёт больше знаков', () => {
    expect(formatUsd(0.15872)).toBe('$0.1587');
    expect(formatUsd(0.00001234)).toBe('$0.00001234');
  });
  test('отрицательные — с настоящим минусом', () => {
    expect(formatUsd(-12.5)).toBe('−$12.50');
  });
  test('пустые значения — прочерк', () => {
    expect(formatUsd(null)).toBe('—');
    expect(formatUsd(Number.NaN)).toBe('—');
  });
});

describe('priceDigits', () => {
  test.each([
    [65000, 2],
    [1.5, 2],
    [0.5, 4],
    [0.000012, 8],
  ])('%s → %s', (v, d) => expect(priceDigits(v)).toBe(d));
});

describe('formatPct', () => {
  test('знак и минус', () => {
    expect(formatPct(5.744)).toBe('+5.74%');
    expect(formatPct(-1.84)).toBe('−1.84%');
  });
  test('почти ноль — без знака', () => {
    expect(formatPct(-0.001)).toBe('0.00%');
  });
});

test('formatCompactUsd', () => {
  expect(formatCompactUsd(1_630_000_000_000)).toBe('$1.63T');
  expect(formatCompactUsd(41_200_000_000)).toBe('$41.2B');
});

test('trendOf', () => {
  expect(trendOf(1)).toBe('up');
  expect(trendOf(-1)).toBe('down');
  expect(trendOf(0.001)).toBe('flat');
  expect(trendOf(null)).toBe('flat');
});

describe('parseAmount', () => {
  test('понимает пробелы и запятую', () => {
    expect(parseAmount('85 000')).toBe(85000);
    expect(parseAmount(`82${T}284.17`)).toBe(82284.17);
    expect(parseAmount('0,25')).toBe(0.25);
  });
  test('отвергает мусор', () => {
    expect(parseAmount('')).toBeNull();
    expect(parseAmount('abc')).toBeNull();
    expect(parseAmount('1.2.3')).toBeNull();
    expect(parseAmount('-5')).toBeNull();
  });
});
