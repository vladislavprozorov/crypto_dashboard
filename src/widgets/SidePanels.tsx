import { Link } from 'react-router-dom';
import type { Coin } from '../entities/coin/model/types';
import { useAlerts } from '../features/alerts/model/useAlerts';
import { AlertList } from '../features/alerts/ui/AlertList';
import { useWatchlist } from '../features/watchlist/model/useWatchlist';
import { Change } from '../shared/ui/Change';
import { LivePrice } from '../shared/ui/LivePrice';
import { Panel } from '../shared/ui/Panel';

function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

export function WatchlistPanel({ coins }: { coins: Coin[] }) {
  const { ids } = useWatchlist();
  const list = ids.map((id) => coins.find((c) => c.id === id)).filter((c): c is Coin => Boolean(c));

  return (
    <Panel
      id="watch"
      title={
        <Link to="/watchlist" className="hover:text-accent">
          Вотчлист
        </Link>
      }
      aside={
        <span className="num text-xs text-muted">
          {ids.length} {plural(ids.length, 'монета', 'монеты', 'монет')}
        </span>
      }
    >
      {list.length === 0 ? (
        <p className="m-0 px-5 py-4 text-muted">
          Отмечайте монеты звёздочкой в таблице — они появятся здесь.
        </p>
      ) : (
        <ul className="m-0 list-none p-0">
          {list.map((c) => (
            <li key={c.id} className="border-b border-rule-soft last:border-b-0">
              <Link
                to={`/coin/${c.id}`}
                className="grid min-h-[48px] grid-cols-[1fr_auto_72px] items-center gap-4 px-5 hover:bg-paper/60"
              >
                <span className="truncate">
                  <span className="font-medium uppercase">{c.symbol}</span>{' '}
                  <span className="text-xs text-muted">{c.name}</span>
                </span>
                <LivePrice value={c.current_price} />
                <Change value={c.change24h} className="text-right text-xs" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export function AlertsPanel({ coins, newAlertFor }: { coins: Coin[]; newAlertFor?: string }) {
  const { alerts } = useAlerts();
  const prices = Object.fromEntries(coins.map((c) => [c.id, c.current_price]));
  const shown = [...alerts]
    .sort((a, b) => Number(a.triggeredAt != null) - Number(b.triggeredAt != null))
    .slice(0, 5);

  return (
    <Panel
      id="alerts"
      title={
        <Link to="/alerts" className="hover:text-accent">
          Алерты
        </Link>
      }
      aside={
        newAlertFor && (
          <Link to={`/coin/${newAlertFor}#alert`} className="btn-ghost h-8">
            + Новый
          </Link>
        )
      }
    >
      <AlertList
        alerts={shown}
        prices={prices}
        empty="Создайте алерт на странице монеты — уведомим, когда цена дойдёт до цели."
      />
      {alerts.length > shown.length && (
        <Link
          to="/alerts"
          className="block border-t border-rule-soft px-5 py-3 text-xs text-muted hover:text-ink"
        >
          Все алерты ({alerts.length}) →
        </Link>
      )}
    </Panel>
  );
}
