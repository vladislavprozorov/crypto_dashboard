import { useMemo, useState } from 'react';
import {
  Area,
  ComposedChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts';
import type { Transaction } from '../../entities/transaction/model/types';
import type { ValuePoint } from '../../features/portfolio/model/calc';
import {
  HISTORY_RANGES,
  usePortfolioHistory,
  type HistoryRange,
} from '../../features/portfolio/model/usePortfolioHistory';
import { niceDomain, timeTicks } from '../../shared/lib/chartTicks';
import { formatNumber, formatPct, formatUsd } from '../../shared/lib/format';
import { Segmented } from '../../shared/ui/Segmented';
import { Skeleton } from '../../shared/ui/Skeleton';

function TooltipBox({ active, payload }: TooltipContentProps<number, string>) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as ValuePoint;
  const pnl = p.value - p.invested;
  return (
    <div className="num bg-ink px-3 py-2 text-xs leading-relaxed text-on-ink">
      <div className="opacity-70">
        {new Date(p.t).toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}
      </div>
      <div>Стоимость {formatUsd(p.value)}</div>
      <div className="opacity-70">Вложено {formatUsd(p.invested)}</div>
      <div>
        {pnl >= 0 ? '+' : ''}
        {formatUsd(pnl)} {p.invested > 0 && `(${formatPct((pnl / p.invested) * 100)})`}
      </div>
    </div>
  );
}

const dayTick = (t: number) =>
  new Date(t).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
const monthTick = (t: number) =>
  new Date(t).toLocaleDateString('ru-RU', { month: 'short', year: '2-digit' });

export function ValueChart({
  txs,
  currentPrices,
}: {
  txs: Transaction[];
  currentPrices: Record<string, number | undefined>;
}) {
  const [range, setRange] = useState<HistoryRange>('3М');
  const { points, loading } = usePortfolioHistory(txs, range, currentPrices);

  const axes = useMemo(() => {
    if (points.length < 2) return null;
    const vals = points.flatMap((p) => [p.value, p.invested]);
    const y = niceDomain(Math.min(...vals), Math.max(...vals), 4);
    const from = points[0].t;
    const to = points[points.length - 1].t;
    const months = to - from > 120 * 24 * 3600_000;
    return { y, x: timeTicks(from, to, months ? 'months' : 'days', 6), months };
  }, [points]);

  return (
    <section aria-label="Стоимость портфеля" className="panel min-w-0">
      <div className="flex min-h-[52px] flex-wrap items-center justify-between gap-3 border-b border-rule px-5 py-2">
        <h2 className="panel-title">Динамика</h2>
        <Segmented options={HISTORY_RANGES} value={range} onChange={setRange} label="Период" />
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-1 px-5 pt-4 text-xs text-muted">
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="h-0.5 w-5 bg-accent" /> Стоимость
        </span>
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="w-5 border-t border-dashed border-ink" /> Вложено
        </span>
      </div>
      <div className="px-3 pb-3 pt-2 md:px-5" style={{ height: 300 }}>
        {!axes ? (
          loading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted">
              Недостаточно данных
            </div>
          )
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={points} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
              <CartesianGrid
                stroke="rgb(var(--rule-soft))"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                dataKey="t"
                type="number"
                scale="time"
                domain={['dataMin', 'dataMax']}
                ticks={axes.x}
                tickFormatter={axes.months ? monthTick : dayTick}
                tick={{ fill: 'rgb(var(--muted))', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
                tickLine={false}
                axisLine={{ stroke: 'rgb(var(--ink))' }}
                interval="preserveStart"
                minTickGap={20}
              />
              <YAxis
                orientation="right"
                domain={axes.y.domain}
                ticks={axes.y.ticks}
                tickFormatter={(v: number) => formatNumber(v, 0)}
                tick={{ fill: 'rgb(var(--muted))', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
                tickLine={false}
                axisLine={false}
                width={72}
              />
              <Tooltip
                content={TooltipBox}
                cursor={{ stroke: 'rgb(var(--ink))', strokeDasharray: '3 3' }}
              />
              <Area
                type="linear"
                dataKey="value"
                stroke="rgb(var(--accent))"
                strokeWidth={1.75}
                fill="rgb(var(--accent))"
                fillOpacity={0.06}
                isAnimationActive={false}
                dot={false}
              />
              <Line
                type="stepAfter"
                dataKey="invested"
                stroke="rgb(var(--ink))"
                strokeWidth={1}
                strokeDasharray="5 4"
                dot={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
