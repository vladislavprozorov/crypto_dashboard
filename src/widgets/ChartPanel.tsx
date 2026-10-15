import { useMemo, useState, type ReactNode } from 'react';
import { RANGES, useHistoryQuery, type Range } from '../entities/coin/api/queries';
import type { Coin, PricePoint } from '../entities/coin/model/types';
import { useAlerts } from '../features/alerts/model/useAlerts';
import { formatUsd } from '../shared/lib/format';
import { PriceChart, type TimeScale } from '../shared/ui/PriceChart';
import { Segmented } from '../shared/ui/Segmented';

const SCALE: Record<Range, TimeScale> = {
  '1Д': 'intraday',
  '7Д': 'days',
  '1М': 'days',
  '1Г': 'months',
  ВСЁ: 'months',
};

/** Последнюю точку графика двигаем вместе с live-ценой — график «дышит» без перезапросов. */
function withLivePoint(points: PricePoint[] | undefined, coin: Coin) {
  if (!points?.length || !coin.liveAt) return points;
  const last = points[points.length - 1];
  if (coin.liveAt <= last.t) {
    return [...points.slice(0, -1), { t: last.t, price: coin.current_price }];
  }
  return [...points, { t: coin.liveAt, price: coin.current_price }];
}

export function ChartPanel({
  coin,
  header,
  footer,
  height = 320,
}: {
  coin: Coin;
  header?: ReactNode;
  footer?: ReactNode;
  height?: number;
}) {
  const [range, setRange] = useState<Range>('7Д');
  const history = useHistoryQuery(coin.id, coin.pair, range);
  const { alerts } = useAlerts();

  const data = withLivePoint(history.data, coin);
  const markers = useMemo(
    () =>
      alerts
        .filter((a) => a.coinId === coin.id && a.triggeredAt == null)
        .map((a) => ({
          value: a.target,
          label: `алерт · ${a.direction === 'above' ? 'выше' : 'ниже'} ${formatUsd(a.target)}`,
        })),
    [alerts, coin.id],
  );

  return (
    <section aria-label={`График ${coin.name}`} className="panel min-w-0">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rule px-5 py-4 md:px-6">
        {header}
        <Segmented options={RANGES} value={range} onChange={setRange} label="Период графика" />
      </div>
      <div className="px-3 pb-2 pt-4 md:px-6">
        <PriceChart
          data={data}
          scale={SCALE[range]}
          loading={history.isFetching}
          markers={markers}
          height={height}
          label={`Цена ${coin.name} за период ${range}`}
        />
        {history.isError && !history.data && (
          <p className="m-0 mt-2 text-xs text-down">Не удалось загрузить историю цены</p>
        )}
      </div>
      {footer}
    </section>
  );
}
