import { describe, expect, test } from 'vitest';
import { miniTickerStreamUrl, parseMiniTicker } from '../binance';

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
