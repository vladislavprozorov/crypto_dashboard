import { Link } from 'react-router-dom';
import { usePortfolioSummary } from '../../features/portfolio/model/usePortfolioSummary';
import { formatPct, formatUsd, trendOf } from '../../shared/lib/format';
import { LivePrice } from '../../shared/ui/LivePrice';
import { Panel } from '../../shared/ui/Panel';

const TONE = { up: 'text-up', down: 'text-down', flat: 'text-muted' } as const;

/** Короткая сводка портфеля для боковой колонки дашборда. */
export function PortfolioPanel() {
  const { summary, txs, status } = usePortfolioSummary();
  const empty = status === 'ready' && txs.length === 0;

  return (
    <Panel
      id="portfolio"
      title={
        <Link to="/portfolio" className="hover:text-accent">
          Портфель
        </Link>
      }
      aside={
        <Link to="/portfolio" className="text-xs text-muted hover:text-ink">
          {empty ? 'Начать →' : 'Открыть →'}
        </Link>
      }
    >
      {empty ? (
        <p className="m-0 px-5 py-4 text-muted">
          Записывайте сделки — посчитаем стоимость, среднюю цену и прибыль в реальном времени.
        </p>
      ) : (
        <div className="flex flex-col gap-2 px-5 py-4">
          <LivePrice value={summary.value} className="text-[26px] font-medium tracking-tight" />
          <div className="num flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <span className={TONE[trendOf(summary.unrealized)]}>
              {summary.unrealized > 0 ? '+' : ''}
              {formatUsd(summary.unrealized)} · {formatPct(summary.unrealizedPct)}
            </span>
            <span className="text-muted">
              24ч{' '}
              <span className={TONE[trendOf(summary.change24h)]}>
                {formatPct(summary.change24hPct)}
              </span>
            </span>
          </div>
        </div>
      )}
    </Panel>
  );
}
