import { describe, expect, test, vi } from 'vitest';
import type { MarketCoin } from '../../model/types';
import { loadMarkets } from '../queries';

const coin = { id: 'bitcoin', symbol: 'btc', current_price: 1 } as MarketCoin;
const fail = () => Promise.reject(new Error('429'));

describe('loadMarkets — каскад источников', () => {
  test('CoinGecko отвечает → сохраняем снимок', async () => {
    const writeCache = vi.fn();
    const res = await loadMarkets({
      primary: async () => [coin],
      fallback: fail,
      readCache: () => null,
      writeCache,
      now: () => 10,
    });
    expect(res).toEqual({ coins: [coin], source: 'coingecko', at: 10 });
    expect(writeCache).toHaveBeenCalledWith({ at: 10, data: [coin] });
  });

  test('CoinGecko упал → свежий снимок из кэша', async () => {
    const fallback = vi.fn(fail);
    const res = await loadMarkets({
      primary: fail,
      fallback,
      readCache: () => ({ at: 5, data: [coin] }),
      writeCache: vi.fn(),
      now: () => 10,
    });
    expect(res).toMatchObject({ source: 'cache', at: 5, reason: '429' });
    expect(fallback).not.toHaveBeenCalled();
  });

  test('кэш старше суток → Binance', async () => {
    const res = await loadMarkets({
      primary: fail,
      fallback: async () => [coin],
      readCache: () => ({ at: 0, data: [coin] }),
      writeCache: vi.fn(),
      now: () => 25 * 3600_000,
    });
    expect(res.source).toBe('binance');
  });

  test('все источники недоступны → исходная ошибка', async () => {
    await expect(
      loadMarkets({ primary: fail, fallback: fail, readCache: () => null, writeCache: vi.fn() }),
    ).rejects.toThrow('429');
  });
});
