import { describe, expect, test } from 'vitest';
import type { Transaction } from '../../../../entities/transaction/model/types';
import { amountAt, computeHoldings, priceAt, summarize, valueHistory } from '../calc';

let seq = 0;
const tx = (
  p: Partial<Transaction> & Pick<Transaction, 'type' | 'amount' | 'price' | 'date'>,
): Transaction => ({
  id: `t${++seq}`,
  coinId: 'bitcoin',
  symbol: 'btc',
  name: 'Bitcoin',
  fee: 0,
  createdAt: seq,
  ...p,
});

describe('computeHoldings — метод средней цены', () => {
  test('несколько покупок усредняют цену, комиссия входит в себестоимость', () => {
    const { holdings } = computeHoldings([
      tx({ type: 'buy', amount: 1, price: 100, fee: 2, date: 1 }),
      tx({ type: 'buy', amount: 1, price: 200, fee: 0, date: 2 }),
    ]);
    expect(holdings[0]).toMatchObject({ amount: 2, costBasis: 302, avgPrice: 151 });
  });

  test('продажа фиксирует прибыль и списывает себестоимость по средней', () => {
    const { holdings } = computeHoldings([
      tx({ type: 'buy', amount: 2, price: 100, date: 1 }),
      tx({ type: 'sell', amount: 1, price: 150, fee: 1, date: 2 }),
    ]);
    // выручка 150 − комиссия 1 − себестоимость 100 = 49
    expect(holdings[0]).toMatchObject({ amount: 1, costBasis: 100, avgPrice: 100, realized: 49 });
  });

  test('сделки считаются по дате, а не по порядку ввода', () => {
    const { holdings, issues } = computeHoldings([
      tx({ type: 'sell', amount: 1, price: 150, date: 5 }),
      tx({ type: 'buy', amount: 1, price: 100, date: 1 }),
    ]);
    expect(issues).toHaveLength(0);
    expect(holdings[0]).toMatchObject({ amount: 0, realized: 50 });
  });

  test('продажа сверх остатка не исполняется и попадает в issues', () => {
    const sell = tx({ type: 'sell', amount: 3, price: 100, date: 2 });
    const { holdings, issues } = computeHoldings([
      tx({ type: 'buy', amount: 1, price: 100, date: 1 }),
      sell,
    ]);
    expect(holdings[0].amount).toBe(1);
    expect(issues).toEqual([{ txId: sell.id, message: expect.stringContaining('больше остатка') }]);
  });

  test('полная продажа обнуляет «пыль» от округлений', () => {
    const { holdings } = computeHoldings([
      tx({ type: 'buy', amount: 0.1, price: 10, date: 1 }),
      tx({ type: 'buy', amount: 0.2, price: 10, date: 2 }),
      tx({ type: 'sell', amount: 0.3, price: 10, date: 3 }),
    ]);
    expect(holdings[0]).toMatchObject({ amount: 0, costBasis: 0, avgPrice: 0 });
  });

  test('amountAt учитывает только сделки до даты и умеет исключать редактируемую', () => {
    const buy = tx({ type: 'buy', amount: 2, price: 1, date: 10 });
    const txs = [buy, tx({ type: 'sell', amount: 0.5, price: 1, date: 20 })];
    expect(amountAt(txs, 'bitcoin', 15)).toBe(2);
    expect(amountAt(txs, 'bitcoin', 25)).toBe(1.5);
    expect(amountAt(txs, 'bitcoin', 5)).toBe(0);
    expect(amountAt(txs, 'bitcoin', 15, buy.id)).toBe(0);
  });
});

describe('summarize', () => {
  const eth = { coinId: 'ethereum', symbol: 'eth', name: 'Ethereum' };
  const sol = { coinId: 'solana', symbol: 'sol', name: 'Solana' };
  const { holdings } = computeHoldings([
    tx({ type: 'buy', amount: 1, price: 100, date: 1 }),
    tx({ ...eth, type: 'buy', amount: 10, price: 10, date: 1 }),
    tx({ ...sol, type: 'buy', amount: 1, price: 50, date: 1 }),
    tx({ ...sol, type: 'sell', amount: 1, price: 80, date: 2 }),
  ]);

  test('стоимость, P&L, доли и изменение за 24ч', () => {
    const s = summarize(holdings, {
      bitcoin: { price: 150, change24h: 50 },
      ethereum: { price: 5, change24h: 0 },
    });
    expect(s.value).toBe(200);
    expect(s.costBasis).toBe(200);
    expect(s.unrealized).toBe(0);
    expect(s.realized).toBe(30);
    // BTC вырос со 100 до 150 за сутки → +50 к портфелю, который вчера стоил 150
    expect(s.change24h).toBeCloseTo(50);
    expect(s.change24hPct).toBeCloseTo(33.33, 1);
    expect(s.rows.map((r) => [r.symbol, r.share])).toEqual([
      ['btc', 0.75],
      ['eth', 0.25],
    ]);
    expect(s.rows[1]).toMatchObject({ pnl: -50, pnlPct: -50 });
  });

  test('закрытые позиции не попадают в строки; без цены — оценка по себестоимости', () => {
    const s = summarize(holdings, { bitcoin: { price: 100, change24h: null } });
    expect(s.rows.map((r) => r.symbol)).not.toContain('sol');
    expect(s.unpriced).toEqual(['eth']);
    expect(s.rows.find((r) => r.symbol === 'eth')?.value).toBe(100);
  });
});

describe('история стоимости', () => {
  const series = [
    { t: 10, price: 100 },
    { t: 20, price: 200 },
    { t: 30, price: 300 },
  ];

  test('priceAt берёт последнюю точку не позже t', () => {
    expect(priceAt(series, 5)).toBe(100);
    expect(priceAt(series, 20)).toBe(200);
    expect(priceAt(series, 29)).toBe(200);
    expect(priceAt(series, 99)).toBe(300);
    expect(priceAt([], 1)).toBeNull();
  });

  test('valueHistory восстанавливает остатки на каждую дату', () => {
    const txs = [
      tx({ type: 'buy', amount: 1, price: 100, date: 10 }),
      tx({ type: 'buy', amount: 1, price: 200, date: 20 }),
    ];
    expect(valueHistory(txs, { bitcoin: series }, [5, 15, 25, 30])).toEqual([
      { t: 5, value: 0, invested: 0 },
      { t: 15, value: 100, invested: 100 },
      { t: 25, value: 400, invested: 300 },
      { t: 30, value: 600, invested: 300 },
    ]);
  });
});
