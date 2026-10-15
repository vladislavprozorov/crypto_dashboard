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

/** Свеча OHLCV. time — начало свечи в секундах UTC (формат lightweight-charts). */
export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  /** Свеча ещё формируется */
  live?: boolean;
}

export async function fetchCandles(
  pair: string,
  interval: KlineInterval,
  limit: number,
): Promise<Candle[]> {
  const { data } = await http.get<(string | number)[][]>('/klines', {
    params: { symbol: pair, interval, limit },
  });
  const now = Date.now();
  return data.map((k) => ({
    time: Math.floor(Number(k[0]) / 1000),
    open: Number(k[1]),
    high: Number(k[2]),
    low: Number(k[3]),
    close: Number(k[4]),
    volume: Number(k[5]),
    live: Number(k[6]) > now,
  }));
}

interface RawKline {
  e: string;
  k: { t: number; o: string; h: string; l: string; c: string; v: string; x: boolean; i: string };
}

/** Разбор сообщения потока `<pair>@kline_<interval>`. */
export function parseKline(raw: string): (Candle & { interval: string }) | null {
  let msg: { data?: RawKline } | RawKline;
  try {
    msg = JSON.parse(raw);
  } catch {
    return null;
  }
  const d = 'data' in msg && msg.data ? msg.data : (msg as RawKline);
  if (!d || d.e !== 'kline' || !d.k) return null;
  const k = d.k;
  const candle = {
    time: Math.floor(k.t / 1000),
    open: Number(k.o),
    high: Number(k.h),
    low: Number(k.l),
    close: Number(k.c),
    volume: Number(k.v),
    live: !k.x,
    interval: k.i,
  };
  return [candle.open, candle.high, candle.low, candle.close].every(Number.isFinite)
    ? candle
    : null;
}

export function klineStreamUrl(pair: string, interval: KlineInterval) {
  return `${BINANCE_WS}?streams=${pair.toLowerCase()}@kline_${interval}`;
}

/**
 * Вливает тик свечи в ряд: та же свеча — заменяем последнюю, следующая — добавляем.
 * Тики старше последней свечи игнорируем (могли прийти после перезагрузки истории).
 */
export function mergeCandle(list: Candle[], c: Candle): Candle[] {
  const last = list[list.length - 1];
  if (!last || c.time > last.time) return [...list, c];
  if (c.time === last.time) return [...list.slice(0, -1), c];
  return list;
}
