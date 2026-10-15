import axios from 'axios';
import type { PricePoint } from '../../entities/coin/model/types';

/**
 * Публичное зеркало рыночных данных Binance: без ключей и без гео-блокировки,
 * которая есть у api.binance.com.
 */
export const BINANCE_REST = 'https://data-api.binance.vision/api/v3';
export const BINANCE_WS = 'wss://data-stream.binance.vision/stream';

const http = axios.create({ baseURL: BINANCE_REST, timeout: 15000 });

/** Все торгуемые пары к USDT — чтобы подписываться только на существующие потоки. */
export async function fetchUsdtPairs(): Promise<Set<string>> {
  const { data } = await http.get<{ symbol: string; price: string }[]>('/ticker/price');
  return new Set(data.map((t) => t.symbol).filter((s) => s.endsWith('USDT')));
}

export type KlineInterval = '15m' | '1h' | '4h' | '1d' | '1w';

export async function fetchKlines(
  pair: string,
  interval: KlineInterval,
  limit: number,
): Promise<PricePoint[]> {
  const { data } = await http.get<(string | number)[][]>('/klines', {
    params: { symbol: pair, interval, limit },
  });
  // [openTime, open, high, low, close, ...] — берём время закрытия свечи и цену закрытия
  return data.map((k) => ({ t: Number(k[6]), price: Number(k[4]) }));
}

export interface MiniTicker {
  pair: string;
  price: number;
  open: number;
  high: number;
  low: number;
  quoteVolume: number;
  time: number;
}

interface RawMiniTicker {
  e: string;
  E: number;
  s: string;
  c: string;
  o: string;
  h: string;
  l: string;
  q: string;
}

/** Разбор сообщения комбинированного потока `<pair>@miniTicker`. */
export function parseMiniTicker(raw: string): MiniTicker | null {
  let msg: { data?: RawMiniTicker } | RawMiniTicker;
  try {
    msg = JSON.parse(raw);
  } catch {
    return null;
  }
  const d = 'data' in msg && msg.data ? msg.data : (msg as RawMiniTicker);
  if (!d || d.e !== '24hrMiniTicker' || typeof d.s !== 'string') return null;
  const price = Number(d.c);
  const open = Number(d.o);
  if (!Number.isFinite(price) || !Number.isFinite(open)) return null;
  return {
    pair: d.s,
    price,
    open,
    high: Number(d.h),
    low: Number(d.l),
    quoteVolume: Number(d.q),
    time: d.E,
  };
}

export function miniTickerStreamUrl(pairs: string[]) {
  const streams = pairs.map((p) => `${p.toLowerCase()}@miniTicker`).join('/');
  return `${BINANCE_WS}?streams=${streams}`;
}
