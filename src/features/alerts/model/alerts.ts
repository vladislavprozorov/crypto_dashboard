export type AlertDirection = 'above' | 'below';

export interface PriceAlert {
  id: string;
  coinId: string;
  symbol: string;
  name: string;
  direction: AlertDirection;
  target: number;
  createdAt: number;
  triggeredAt: number | null;
  triggeredPrice: number | null;
}

export type NewAlert = Pick<PriceAlert, 'coinId' | 'symbol' | 'name' | 'direction' | 'target'>;

export function createAlert(input: NewAlert, now = Date.now()): PriceAlert {
  return {
    ...input,
    id: `${input.coinId}-${now.toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: now,
    triggeredAt: null,
    triggeredPrice: null,
  };
}

/** Какое условие разумно предложить: цель выше текущей цены — ждём роста, ниже — падения. */
export function suggestDirection(target: number, current: number): AlertDirection {
  return target >= current ? 'above' : 'below';
}

export function isHit(alert: PriceAlert, price: number) {
  return alert.direction === 'above' ? price >= alert.target : price <= alert.target;
}

/** Сколько процентов цене осталось до цели (со знаком). */
export function distanceToTarget(alert: Pick<PriceAlert, 'target'>, price: number) {
  if (!price) return null;
  return ((alert.target - price) / price) * 100;
}

/**
 * Проверяет активные алерты по текущим ценам. Чистая функция:
 * возвращает обновлённый список и сработавшие алерты.
 */
export function checkAlerts(
  alerts: PriceAlert[],
  prices: Record<string, number | undefined>,
  now = Date.now(),
): { alerts: PriceAlert[]; fired: PriceAlert[] } {
  const fired: PriceAlert[] = [];
  const next = alerts.map((a) => {
    if (a.triggeredAt != null) return a;
    const price = prices[a.coinId];
    if (price == null || !isHit(a, price)) return a;
    const done = { ...a, triggeredAt: now, triggeredPrice: price };
    fired.push(done);
    return done;
  });
  return { alerts: fired.length ? next : alerts, fired };
}
