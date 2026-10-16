import { expect, test } from 'vitest';
import type { MarketCoin } from '../../../../entities/coin/model/types';
import { mergeLive } from '../useCoins';

const market = {
  id: 'bitcoin',
  symbol: 'btc',
  current_price: 80000,
  high_24h: 81000,
  low_24h: 79000,
  price_change_percentage_24h: 1,
  price_change_percentage_24h_in_currency: 1.1,
  price_change_percentage_7d_in_currency: 3,
} as MarketCoin;

const tick = {
  pair: 'BTCUSDT',
  price: 82000,
  open: 80000,
  high: 82100,
  low: 79500,
  quoteVolume: 1,
  time: 123,
};

test('без тика — данные CoinGecko', () => {
  const c = mergeLive(market, 'BTCUSDT', undefined);
  expect(c).toMatchObject({ current_price: 80000, change24h: 1.1, change7d: 3, liveAt: null });
});

test('тик перекрывает цену и пересчитывает изменение за 24ч', () => {
  const c = mergeLive(market, 'BTCUSDT', tick);
  expect(c.current_price).toBe(82000);
  expect(c.change24h).toBeCloseTo(2.5);
  expect(c).toMatchObject({ high_24h: 82100, low_24h: 79500, liveAt: 123 });
});

test('тикер с тем же символом, но другой монетой — отбрасываем', () => {
  const c = mergeLive(market, 'BTCUSDT', { ...tick, price: 3 });
  expect(c.current_price).toBe(80000);
  expect(c.pair).toBeNull();
});
