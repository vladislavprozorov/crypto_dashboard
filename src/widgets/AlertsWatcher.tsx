import { useEffect } from 'react';
import { useCoins } from '../features/live-prices/model/useCoins';
import { formatUsd } from '../shared/lib/format';
import { systemNotify } from '../shared/lib/notifications';
import { toast } from '../shared/lib/toast';
import { checkAlerts } from '../features/alerts/model/alerts';
import { readAlerts, writeAlerts } from '../features/alerts/model/useAlerts';

/**
 * Невидимый компонент: на каждое обновление цен проверяет алерты.
 * Живёт отдельно от страниц, чтобы его ежесекундные рендеры никого не задевали.
 */
export function AlertsWatcher() {
  const { coins } = useCoins();

  useEffect(() => {
    const alerts = readAlerts();
    if (!coins.length || !alerts.some((a) => a.triggeredAt == null)) return;
    const prices = Object.fromEntries(coins.map((c) => [c.id, c.current_price]));
    const { alerts: next, fired } = checkAlerts(alerts, prices);
    if (!fired.length) return;
    writeAlerts(next);
    for (const a of fired) {
      const cond = a.direction === 'above' ? 'выше' : 'ниже';
      const title = `${a.symbol.toUpperCase()} ${cond} ${formatUsd(a.target)}`;
      const body = `Цена сейчас ${formatUsd(a.triggeredPrice)}`;
      toast({ title, body, tone: 'accent' }, 10_000);
      systemNotify(title, body);
    }
  }, [coins]);

  return null;
}
