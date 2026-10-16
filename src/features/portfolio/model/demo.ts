import type { PricePoint } from '../../../entities/coin/model/types';
import type { Transaction } from '../../../entities/transaction/model/types';
import { priceAt } from './calc';
import { newTxId } from './store';

const DAY = 24 * 3600_000;

/** Сценарий демо-портфеля: [монета, тип, дней назад, сумма в USD или доля продажи]. */
const PLAN: [coinId: string, type: 'buy' | 'sell', daysAgo: number, usdOrShare: number][] = [
  ['bitcoin', 'buy', 170, 6000],
  ['ethereum', 'buy', 160, 3000],
  ['solana', 'buy', 140, 1500],
  ['bitcoin', 'buy', 95, 2500],
  ['chainlink', 'buy', 80, 800],
  ['ethereum', 'buy', 60, 1200],
  ['solana', 'sell', 40, 0.4],
  ['bitcoin', 'sell', 20, 0.15],
  ['ripple', 'buy', 12, 700],
];

export const DEMO_COINS: Record<string, { symbol: string; name: string; pair: string }> = {
  bitcoin: { symbol: 'btc', name: 'Bitcoin', pair: 'BTCUSDT' },
  ethereum: { symbol: 'eth', name: 'Ethereum', pair: 'ETHUSDT' },
  solana: { symbol: 'sol', name: 'Solana', pair: 'SOLUSDT' },
  chainlink: { symbol: 'link', name: 'Chainlink', pair: 'LINKUSDT' },
  ripple: { symbol: 'xrp', name: 'XRP', pair: 'XRPUSDT' },
};

const round = (v: number, digits: number) => Number(v.toFixed(digits));

/**
 * Собирает демо-портфель по реальным историческим ценам: цена каждой сделки —
 * дневное закрытие на её дату. Так прибыль и график выглядят правдоподобно.
 */
export function buildDemo(series: Record<string, PricePoint[]>, now = Date.now()): Transaction[] {
  const held: Record<string, number> = {};
  const txs: Transaction[] = [];
  PLAN.forEach(([coinId, type, daysAgo, x], i) => {
    const s = series[coinId];
    const date = now - daysAgo * DAY + i * 60_000;
    const price = s ? priceAt(s, date) : null;
    if (!price) return;
    const meta = DEMO_COINS[coinId];
    const amount =
      type === 'buy' ? round(x / price, price > 1000 ? 6 : 4) : round((held[coinId] ?? 0) * x, 6);
    if (!(amount > 0)) return;
    held[coinId] = (held[coinId] ?? 0) + (type === 'buy' ? amount : -amount);
    txs.push({
      id: newTxId(date),
      coinId,
      symbol: meta.symbol,
      name: meta.name,
      type,
      amount,
      price: round(price, price < 10 ? 4 : 2),
      fee: round(amount * price * 0.001, 2),
      date,
      ...(i === 0 ? { note: 'Демо-портфель' } : {}),
      createdAt: now + i,
    });
  });
  return txs;
}
