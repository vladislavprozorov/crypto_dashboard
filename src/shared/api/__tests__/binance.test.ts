import { describe, expect, test } from 'vitest';
import { mergeCandle, miniTickerStreamUrl, parseKline, parseMiniTicker } from '../binance';

const msg = {
  stream: 'btcusdt@miniTicker',
  data: {
    e: '24hrMiniTicker',
    E: 1792091001017,
    s: 'BTCUSDT',
    c: '82464.96000000',
    o: '81656.62000000',
    h: '82634.30000000',
    l: '79800.00000000',
    v: '22619.2',
    q: '1846000000.5',
  },
};

describe('parseMiniTicker', () => {
  test('разбирает сообщение комбинированного потока', () => {
    expect(parseMiniTicker(JSON.stringify(msg))).toEqual({
      pair: 'BTCUSDT',
      price: 82464.96,
      open: 81656.62,
      high: 82634.3,
      low: 79800,
      quoteVolume: 1846000000.5,
      time: 1792091001017,
    });
  });
  test('понимает одиночный поток без обёртки', () => {
    expect(parseMiniTicker(JSON.stringify(msg.data))?.pair).toBe('BTCUSDT');
  });
  test('игнорирует мусор и чужие события', () => {
    expect(parseMiniTicker('not json')).toBeNull();
    expect(parseMiniTicker(JSON.stringify({ result: null, id: 1 }))).toBeNull();
    expect(parseMiniTicker(JSON.stringify({ data: { ...msg.data, e: 'trade' } }))).toBeNull();
    expect(parseMiniTicker(JSON.stringify({ data: { ...msg.data, c: 'NaN' } }))).toBeNull();
  });
});

test('miniTickerStreamUrl', () => {
  expect(miniTickerStreamUrl(['BTCUSDT', 'ETHUSDT'])).toBe(
    'wss://data-stream.binance.vision/stream?streams=btcusdt@miniTicker/ethusdt@miniTicker',
  );
});

describe('свечи', () => {
  const kline = {
    stream: 'btcusdt@kline_1h',
    data: {
      e: 'kline',
      k: { t: 1792090800000, o: '1', h: '3', l: '0.5', c: '2', v: '10', x: false, i: '1h' },
    },
  };

  test('parseKline разбирает формирующуюся свечу', () => {
    expect(parseKline(JSON.stringify(kline))).toEqual({
      time: 1792090800,
      open: 1,
      high: 3,
      low: 0.5,
      close: 2,
      volume: 10,
      live: true,
      interval: '1h',
    });
    expect(parseKline(JSON.stringify(msgFor('trade')))).toBeNull();
    expect(parseKline('oops')).toBeNull();
  });

  const c = (time: number, close: number) => ({ time, open: 1, high: 1, low: 1, close, volume: 1 });

  test('mergeCandle обновляет текущую, добавляет новую и игнорирует старые', () => {
    const list = [c(1, 10), c(2, 20)];
    expect(mergeCandle(list, c(2, 25)).map((x) => x.close)).toEqual([10, 25]);
    expect(mergeCandle(list, c(3, 30)).map((x) => x.close)).toEqual([10, 20, 30]);
    expect(mergeCandle(list, c(1, 99))).toBe(list);
    expect(mergeCandle([], c(1, 1))).toHaveLength(1);
  });
});

function msgFor(e: string) {
  return { data: { e } };
}
