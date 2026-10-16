import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts';
import type { PricePoint } from '../../entities/coin/model/types';
import { niceDomain, timeTicks, type TimeScale } from '../lib/chartTicks';
import { formatNumber, formatUsd, priceDigits } from '../lib/format';
import { Skeleton } from './Skeleton';

export type { TimeScale };

const tickFormatters: Record<TimeScale, (t: number) => string> = {
  intraday: (t) => new Date(t).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
  days: (t) => new Date(t).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
  months: (t) => new Date(t).toLocaleDateString('ru-RU', { month: 'short', year: '2-digit' }),
};

function ChartTooltip({ active, payload }: TooltipContentProps<number, string>) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload as PricePoint;
  return (
    <div className="num bg-ink px-3 py-2 text-xs leading-relaxed text-on-ink">
      <div className="opacity-70">
        {new Date(point.t).toLocaleString('ru-RU', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </div>
      <div className="text-[13px]">{formatUsd(point.price)}</div>
    </div>
  );
}

export interface ChartMarker {
  value: number;
  label: string;
}

export function PriceChart({
  data,
  scale,
  loading,
  markers = [],
  height = 320,
  label,
}: {
  data: PricePoint[] | undefined;
  scale: TimeScale;
  loading?: boolean;
  markers?: ChartMarker[];
  height?: number;
  label: string;
}) {
  const axes = useMemo(() => {
    if (!data?.length) return null;
    let min = Infinity;
    let max = -Infinity;
    for (const p of data) {
      min = Math.min(min, p.price);
      max = Math.max(max, p.price);
    }
    // алерты рядом с графиком подтягиваем в видимую область, далёкие — не искажают масштаб
    for (const m of markers) {
      if (m.value >= min * 0.85 && m.value <= max * 1.15) {
        min = Math.min(min, m.value);
        max = Math.max(max, m.value);
      }
    }
    const y = niceDomain(min, max, 4);
    const x = timeTicks(data[0].t, data[data.length - 1].t, scale, 7);
    return { y, x };
  }, [data, markers, scale]);

  if (!data?.length) {
    return loading ? (
      <div style={{ height }}>
        <Skeleton className="h-full w-full" />
      </div>
    ) : (
      <div
        style={{ height }}
        className="flex items-center justify-center border border-dashed border-rule text-muted"
      >
        Нет данных для графика
      </div>
    );
  }

  const step = axes?.y.step ?? 1;
  const yDigits = step >= 1 ? 0 : Math.min(priceDigits(step), Math.ceil(-Math.log10(step)));
  const yFormat = (v: number) => formatNumber(v, yDigits);

  return (
    <figure
      aria-label={label}
      style={{ height }}
      className={`m-0 transition-opacity ${loading ? 'opacity-50' : ''}`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="rgb(var(--rule-soft))" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="t"
            type="number"
            domain={['dataMin', 'dataMax']}
            scale="time"
            ticks={axes?.x}
            tickFormatter={tickFormatters[scale]}
            tick={{ fill: 'rgb(var(--muted))', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
            tickLine={false}
            axisLine={{ stroke: 'rgb(var(--ink))' }}
            minTickGap={24}
          />
          <YAxis
            orientation="right"
            domain={axes?.y.domain}
            ticks={axes?.y.ticks}
            tickFormatter={yFormat}
            tick={{ fill: 'rgb(var(--muted))', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
            tickLine={false}
            axisLine={false}
            width={72}
          />
          <Tooltip
            content={ChartTooltip}
            cursor={{ stroke: 'rgb(var(--ink))', strokeDasharray: '3 3' }}
            isAnimationActive={false}
          />
          {markers.map((m) => (
            <ReferenceLine
              key={`${m.label}-${m.value}`}
              y={m.value}
              stroke="rgb(var(--ink))"
              strokeDasharray="6 4"
              ifOverflow="hidden"
              label={{
                value: m.label,
                position: 'insideTopLeft',
                fill: 'rgb(var(--ink))',
                fontSize: 11,
                fontFamily: 'IBM Plex Mono',
              }}
            />
          ))}
          <Area
            type="linear"
            dataKey="price"
            stroke="rgb(var(--accent))"
            strokeWidth={1.75}
            fill="rgb(var(--accent))"
            fillOpacity={0.06}
            isAnimationActive={false}
            dot={false}
            activeDot={{ r: 3.5, fill: 'rgb(var(--accent))', stroke: 'rgb(var(--panel))' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </figure>
  );
}
