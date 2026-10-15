import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAlerts } from '../../features/alerts/model/useAlerts';
import { AlertList } from '../../features/alerts/ui/AlertList';
import { useCoins } from '../../features/live-prices/model/useCoins';
import {
  notificationPermission,
  requestNotifications,
  type NotifyPermission,
} from '../../shared/lib/notifications';
import { Panel } from '../../shared/ui/Panel';
import { Segmented } from '../../shared/ui/Segmented';

const FILTERS = ['active', 'fired'] as const;

export default function AlertsPage() {
  const { coins } = useCoins();
  const { alerts, clearTriggered } = useAlerts();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('active');
  const [permission, setPermission] = useState<NotifyPermission>(notificationPermission);

  const prices = Object.fromEntries(coins.map((c) => [c.id, c.current_price]));
  const active = alerts.filter((a) => a.triggeredAt == null);
  const fired = alerts.filter((a) => a.triggeredAt != null);
  const shown = filter === 'active' ? active : fired;

  return (
    <div className="mx-auto flex max-w-page flex-col gap-4 px-4 py-4 md:gap-6 md:px-8 md:py-6">
      <header className="flex flex-col gap-1">
        <h1 className="m-0 text-2xl font-semibold">Ценовые алерты</h1>
        <p className="m-0 max-w-[64ch] text-muted">
          Проверяются на каждом тике WebSocket, пока дашборд открыт. Создать алерт можно на странице
          любой монеты.
        </p>
      </header>

      {permission !== 'granted' && permission !== 'unsupported' && (
        <div className="flex flex-wrap items-center justify-between gap-3 border border-ink px-5 py-4">
          <span>
            {permission === 'denied'
              ? 'Уведомления браузера запрещены — алерты будут приходить только внутри страницы.'
              : 'Разрешите уведомления, чтобы видеть алерты, даже когда вкладка в фоне.'}
          </span>
          {permission === 'default' && (
            <button
              type="button"
              className="btn-solid"
              onClick={async () => setPermission(await requestNotifications())}
            >
              Разрешить уведомления
            </button>
          )}
        </div>
      )}

      <div className="max-w-3xl">
        <Panel
          id="all-alerts"
          title={
            <Segmented
              options={FILTERS}
              labels={{
                active: `Активные · ${active.length}`,
                fired: `Сработали · ${fired.length}`,
              }}
              value={filter}
              onChange={setFilter}
              label="Фильтр алертов"
              className="normal-case tracking-normal"
            />
          }
          aside={
            filter === 'fired' &&
            fired.length > 0 && (
              <button type="button" className="btn-ghost h-8" onClick={clearTriggered}>
                Очистить
              </button>
            )
          }
        >
          <AlertList
            alerts={shown}
            prices={prices}
            empty={filter === 'active' ? 'Активных алертов нет.' : 'Ещё ни один алерт не сработал.'}
          />
          {filter === 'active' && (
            <Link
              to="/coin/bitcoin#alert"
              className="block border-t border-rule-soft px-5 py-3 text-[13px] hover:bg-paper/60"
            >
              + Новый алерт для Bitcoin
            </Link>
          )}
        </Panel>
      </div>
    </div>
  );
}
