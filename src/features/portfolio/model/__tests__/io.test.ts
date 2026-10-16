import { describe, expect, test } from 'vitest';
import type { Transaction } from '../../../../entities/transaction/model/types';
import { normalizeTx, parseCsv, parseImport, toCsv, toJson } from '../io';

const txs: Transaction[] = [
  {
    id: 'a',
    coinId: 'bitcoin',
    symbol: 'btc',
    name: 'Bitcoin',
    type: 'buy',
    amount: 0.5,
    price: 60000,
    fee: 3,
    date: Date.UTC(2026, 0, 2, 10),
    note: 'первая, "долгосрок"',
    createdAt: 1,
  },
  {
    id: 'b',
    coinId: 'ethereum',
    symbol: 'eth',
    name: 'Ethereum',
    type: 'sell',
    amount: 1,
    price: 2500,
    fee: 0,
    date: Date.UTC(2026, 1, 3),
    createdAt: 2,
  },
];

// id и createdAt в CSV не сохраняются — сравниваем без них
const strip = (list: Transaction[]) => list.map((t) => ({ ...t, id: '', createdAt: 0 }));

describe('экспорт → импорт без потерь', () => {
  test('JSON', () => {
    const res = parseImport(toJson(txs), 'p.json');
    expect(res.errors).toEqual([]);
    expect(res.txs).toEqual(txs);
  });

  test('CSV, включая кавычки и запятые в заметке', () => {
    const res = parseImport(toCsv(txs), 'p.csv');
    expect(res.errors).toEqual([]);
    expect(strip(res.txs)).toEqual(strip(txs));
  });
});

test('parseCsv: экранированные кавычки, CRLF и перевод строки внутри поля', () => {
  expect(parseCsv('a,b\r\n"x ""y""","1\n2"\r\n')).toEqual([
    ['a', 'b'],
    ['x "y"', '1\n2'],
  ]);
});

describe('валидация', () => {
  test.each([
    [{ type: 'hold' }, 'тип'],
    [{ coin_id: 'Bit Coin' }, 'coin_id'],
    [{ amount: '0' }, 'количество'],
    [{ amount: 'abc' }, 'количество'],
    [{ price: '-1' }, 'цена'],
    [{ date: 'вчера' }, 'дата'],
    [{ date: '2999-01-01' }, 'будущем'],
  ])('%o → ошибка «%s»', (patch, msg) => {
    const base = { type: 'buy', coin_id: 'bitcoin', amount: '1', price: '10', date: '2026-01-01' };
    const res = normalizeTx({ ...base, ...patch }, Date.UTC(2026, 5, 1));
    expect(typeof res).toBe('string');
    expect(res).toContain(msg);
  });

  test('комиссия по умолчанию 0, символ и имя выводятся из coin_id', () => {
    const res = normalizeTx(
      { type: 'BUY', coin_id: 'solana', amount: '2', price: '100', date: '2026-01-01' },
      Date.UTC(2026, 5, 1),
    );
    expect(res).toMatchObject({ type: 'buy', fee: 0, symbol: 'solana', name: 'SOLANA' });
  });

  test('импорт собирает ошибки построчно и оставляет корректные сделки', () => {
    const csv =
      'date,type,coin_id,amount,price\n2026-01-01,buy,bitcoin,1,100\n2026-01-02,buy,bitcoin,0,100';
    const res = parseImport(csv, 'x.csv');
    expect(res.txs).toHaveLength(1);
    expect(res.errors).toEqual(['Строка 3: количество должно быть больше нуля']);
  });

  test('понятные ошибки формата', () => {
    expect(parseImport('', 'x.csv').errors).toEqual(['Файл пустой']);
    expect(parseImport('{oops', 'x.json').errors[0]).toMatch(/JSON/);
    expect(parseImport('{"a":1}', 'x.json').errors[0]).toMatch(/transactions/);
    expect(parseImport('foo,bar\n1,2', 'x.csv').errors[0]).toMatch(/нет колонок/);
  });
});
