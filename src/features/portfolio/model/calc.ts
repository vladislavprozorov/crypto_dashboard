import type { PricePoint } from '../../../entities/coin/model/types';
import type { Transaction } from '../../../entities/transaction/model/types';

/** Остатки меньше этого считаем нулём — защита от хвостов вроде 1e-17 после продаж. */
const DUST = 1e-9;

export interface Holding {
  coinId: string;
  symbol: string;
  name: string;
  /** Текущее количество */
  amount: number;
  /** Себестоимость остатка (по средней цене, с комиссиями покупок) */
  costBasis: number;
  /** Средняя цена покупки остатка */
  avgPrice: number;
  /** Зафиксированная прибыль по продажам */
  realized: number;
  txCount: number;
}

export interface TxIssue {
  txId: string;
  message: string;
}

/** Хронологический порядок: по дате сделки, при равенстве — по времени ввода. */
export function sortTransactions(txs: Transaction[]) {
  return [...txs].sort((a, b) => a.date - b.date || a.createdAt - b.createdAt);
}

/**
 * Пересчитывает позиции методом средней цены:
 * покупка увеличивает количество и себестоимость (вместе с комиссией),
 * продажа списывает себестоимость пропорционально и фиксирует прибыль.
 * Продажа сверх остатка не исполняется и попадает в `issues`.
 */
export function computeHoldings(txs: Transaction[], until = Infinity) {
  const map = new Map<string, Holding>();
  const issues: TxIssue[] = [];

  for (const tx of sortTransactions(txs)) {
    if (tx.date > until) break;
    const h =
      map.get(tx.coinId) ??
      ({
        coinId: tx.coinId,
        symbol: tx.symbol,
        name: tx.name,
        amount: 0,
        costBasis: 0,
        avgPrice: 0,
        realized: 0,
        txCount: 0,
      } satisfies Holding);
    h.txCount += 1;

    if (tx.type === 'buy') {
      h.amount += tx.amount;
      h.costBasis += tx.amount * tx.price + tx.fee;
    } else {
      if (tx.amount > h.amount + DUST) {
        issues.push({
          txId: tx.id,
          message: `Продажа ${tx.amount} ${tx.symbol.toUpperCase()} больше остатка ${+h.amount.toFixed(8)}`,
        });
        map.set(tx.coinId, h);
        continue;
      }
      const avg = h.amount > 0 ? h.costBasis / h.amount : 0;
      h.realized += tx.amount * tx.price - tx.fee - avg * tx.amount;
      h.amount -= tx.amount;
      h.costBasis -= avg * tx.amount;
      if (h.amount < DUST) {
        h.amount = 0;
        h.costBasis = 0;
      }
    }
    h.avgPrice = h.amount > 0 ? h.costBasis / h.amount : 0;
    map.set(tx.coinId, h);
  }

  return { holdings: [...map.values()], issues };
}

/** Сколько монеты на руках к моменту `date` — для проверки продажи в форме. */
export function amountAt(txs: Transaction[], coinId: string, date: number, excludeId?: string) {
  const { holdings } = computeHoldings(
    txs.filter((t) => t.coinId === coinId && t.id !== excludeId),
    date,
  );
  return holdings[0]?.amount ?? 0;
}

export interface Quote {
  price: number;
  change24h: number | null;
}

export interface PositionRow extends Holding {
  price: number | null;
  value: number;
  pnl: number;
  pnlPct: number | null;
  share: number;
  change24h: number | null;
}

export interface PortfolioSummary {
  value: number;
  costBasis: number;
  unrealized: number;
  unrealizedPct: number | null;
  realized: number;
  change24h: number;
  change24hPct: number | null;
  rows: PositionRow[];
  /** Монеты без текущей цены — их стоимость считается по себестоимости */
  unpriced: string[];
}

export function summarize(holdings: Holding[], quotes: Record<string, Quote | undefined>) {
  const unpriced: string[] = [];
  const open = holdings.filter((h) => h.amount > 0);
  const rows = open.map((h) => {
    const q = quotes[h.coinId];
    if (!q) unpriced.push(h.symbol);
    const value = q ? h.amount * q.price : h.costBasis;
    const pnl = value - h.costBasis;
    return {
      ...h,
      price: q?.price ?? null,
      value,
      pnl,
      pnlPct: h.costBasis > 0 ? (pnl / h.costBasis) * 100 : null,
      share: 0,
      change24h: q?.change24h ?? null,
    };
  });
  const value = rows.reduce((s, r) => s + r.value, 0);
  const costBasis = rows.reduce((s, r) => s + r.costBasis, 0);
  // сколько портфель заработал за сутки: цена сутки назад = price / (1 + ch)
  const change24h = rows.reduce((s, r) => {
    if (r.change24h == null || r.price == null) return s;
    return s + r.value - r.value / (1 + r.change24h / 100);
  }, 0);
  for (const r of rows) r.share = value > 0 ? r.value / value : 0;
  rows.sort((a, b) => b.value - a.value);

  const summary: PortfolioSummary = {
    value,
    costBasis,
    unrealized: value - costBasis,
    unrealizedPct: costBasis > 0 ? ((value - costBasis) / costBasis) * 100 : null,
    realized: holdings.reduce((s, h) => s + h.realized, 0),
    change24h,
    change24hPct: value - change24h > 0 ? (change24h / (value - change24h)) * 100 : null,
    rows,
    unpriced,
  };
  return summary;
}

export interface ValuePoint {
  t: number;
  value: number;
  invested: number;
}

/** Цена монеты на момент t: последняя точка ряда не позже t (ряд отсортирован по времени). */
export function priceAt(series: PricePoint[], t: number) {
  if (!series.length) return null;
  let lo = 0;
  let hi = series.length - 1;
  if (t < series[0].t) return series[0].price;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (series[mid].t <= t) lo = mid;
    else hi = mid - 1;
  }
  return series[lo].price;
}

/**
 * История стоимости портфеля: на каждую отметку времени восстанавливаем остатки
 * по сделкам и умножаем на цену того момента. Вторая линия — сколько было вложено.
 */
export function valueHistory(
  txs: Transaction[],
  series: Record<string, PricePoint[] | undefined>,
  times: number[],
  fallbackPrice: Record<string, number | undefined> = {},
): ValuePoint[] {
  const sorted = sortTransactions(txs);
  return times.map((t) => {
    const { holdings } = computeHoldings(sorted, t);
    let value = 0;
    let invested = 0;
    for (const h of holdings) {
      if (h.amount <= 0) continue;
      const s = series[h.coinId];
      const p = (s && priceAt(s, t)) ?? fallbackPrice[h.coinId] ?? h.avgPrice;
      value += h.amount * p;
      invested += h.costBasis;
    }
    return { t, value, invested };
  });
}
