import { Link } from 'react-router-dom';
import { formatDateTime, formatPct, formatUsd } from '../../../shared/lib/format';
import { CloseIcon } from '../../../shared/ui/icons';
import { distanceToTarget, type PriceAlert } from '../model/alerts';
import { useAlerts } from '../model/useAlerts';

export function AlertList({
  alerts,
  prices,
  showCoin = true,
  empty = 'Алертов пока нет',
}: {
  alerts: PriceAlert[];
  prices: Record<string, number | undefined>;
  showCoin?: boolean;
  empty?: string;
}) {
  const { remove } = useAlerts();

  if (!alerts.length) return <p className="m-0 px-5 py-4 text-muted">{empty}</p>;

  return (
    <ul className="m-0 list-none p-0">
      {alerts.map((a) => {
        const fired = a.triggeredAt != null;
        const price = prices[a.coinId];
        const dist = price != null ? distanceToTarget(a, price) : null;
        const cond = a.direction === 'above' ? 'выше' : 'ниже';
        return (
          <li
            key={a.id}
            className="flex items-center justify-between gap-3 border-b border-rule-soft py-1 pl-5 pr-1 last:border-b-0"
          >
            <div className={`min-w-0 py-2 ${fired ? 'text-muted' : ''}`}>
              {showCoin && (
                <Link to={`/coin/${a.coinId}`} className="font-medium hover:text-accent">
                  {a.symbol.toUpperCase()}
                </Link>
              )}{' '}
              {showCoin ? cond : cond[0].toUpperCase() + cond.slice(1)}{' '}
              <span className="num">{formatUsd(a.target)}</span>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <span className={`num text-xs ${fired ? 'text-accent' : 'text-muted'}`}>
                {fired
                  ? `сработал ${formatDateTime(a.triggeredAt!)}`
                  : dist != null
                    ? `ждёт · ${formatPct(dist)}`
                    : 'ждёт'}
              </span>
              <button
                type="button"
                onClick={() => remove(a.id)}
                aria-label={`Удалить алерт ${a.symbol.toUpperCase()} ${cond} ${formatUsd(a.target)}`}
                className="inline-flex h-11 w-11 cursor-pointer items-center justify-center text-muted hover:text-ink"
              >
                <CloseIcon size={12} />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
