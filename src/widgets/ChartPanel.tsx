import { lazy, Suspense, useMemo, useState, type ReactNode } from 'react';
import { RANGES, useHistoryQuery, type Range } from '../entities/coin/api/queries';
import type { Coin, PricePoint } from '../entities/coin/model/types';
import { useAlerts } from '../features/alerts/model/useAlerts';
import { formatUsd } from '../shared/lib/format';
import { useStoredState } from '../shared/lib/storage/useStoredState';
import { PriceChart, type TimeScale } from '../shared/ui/PriceChart';
import { Segmented } from '../shared/ui/Segmented';
import { Skeleton } from '../shared/ui/Skeleton';

// lightweight-charts (~160 КБ) грузится только при переключении на свечи
const CandlePanelBody = lazy(() => import('../features/candles/ui/CandlePanelBody'));

const SCALE: Record<Range, TimeScale> = {
  '1Д': 'intraday',
  '7Д': 'days',
  '1М': 'days',
  '1Г': 'months',
  ВСЁ: 'months',
};

const MODES = ['line', 'candles'] as const;
type Mode = (typeof MODES)[number];
const MODE_LABELS = { line: 'Линия', candles: 'Свечи' };

/** Последнюю точку графика двигаем вместе с live-ценой — график «дышит» без перезапросов. */
function withLivePoint(points: PricePoint[] | undefined, coin: Coin) {
  if (!points?.length || !coin.liveAt) return points;
  const last = points[points.length - 1];
  if (coin.liveAt <= last.t) {
    return [...points.slice(0, -1), { t: last.t, price: coin.current_price }];
  }
  return [...points, { t: coin.liveAt, price: coin.current_price }];
}

function LineBody({ coin, range, height }: { coin: Coin; range: Range; height: number }) {
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
    <>
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
    </>
  );
}

export function ChartPanel({
  coin,
  header,
  footer,
  height = 320,
  allowCandles = false,
}: {
  coin: Coin;
  header?: ReactNode;
  footer?: ReactNode;
  height?: number;
  /** Свечной режим с индикаторами (нужна пара на Binance) */
  allowCandles?: boolean;
}) {
  const [range, setRange] = useState<Range>('7Д');
  const [storedMode, setMode] = useStoredState<Mode>('chart:mode', 'line');
  const canCandles = allowCandles && Boolean(coin.pair);
  const mode: Mode = canCandles ? storedMode : 'line';

  return (
    <section aria-label={`График ${coin.name}`} className="panel min-w-0">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rule px-5 py-4 md:px-6">
        {header}
        <div className="flex flex-wrap gap-2">
          {canCandles && (
            <Segmented
              options={MODES}
              labels={MODE_LABELS}
              value={mode}
              onChange={setMode}
              label="Вид графика"
            />
          )}
          <Segmented options={RANGES} value={range} onChange={setRange} label="Период графика" />
        </div>
      </div>
      <div className="px-3 pb-2 pt-4 md:px-6">
        {mode === 'candles' && coin.pair ? (
          <Suspense
            fallback={
              <div style={{ height: height + 44 }}>
                <Skeleton className="h-full w-full" />
              </div>
            }
          >
            <CandlePanelBody pair={coin.pair} range={range} name={coin.name} height={height + 60} />
          </Suspense>
        ) : (
          <LineBody coin={coin} range={range} height={height} />
        )}
        {allowCandles && !coin.pair && (
          <p className="m-0 mt-2 text-xs text-muted">
            Свечи и индикаторы доступны для монет, которые торгуются на Binance.
          </p>
        )}
      </div>
      {footer}
    </section>
  );
}
