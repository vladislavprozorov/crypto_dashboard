import { useMemo } from 'react';
import { useCoins } from '../../live-prices/model/useCoins';
import { computeHoldings, summarize, type Quote } from './calc';
import { usePortfolio } from './store';

/** Портфель + текущие (live) цены → позиции, P&L и проблемные сделки. */
export function usePortfolioSummary() {
  const portfolio = usePortfolio();
  const { coins } = useCoins();

  const { holdings, issues } = useMemo(() => computeHoldings(portfolio.txs), [portfolio.txs]);

  const quotes = useMemo(() => {
    const q: Record<string, Quote> = {};
    for (const c of coins) q[c.id] = { price: c.current_price, change24h: c.change24h };
    return q;
  }, [coins]);

  const summary = useMemo(() => summarize(holdings, quotes), [holdings, quotes]);

  return { ...portfolio, holdings, issues, summary, coins, quotes };
}
