import type { Range } from '../../../entities/coin/api/queries';
import { INDICATORS, type IndicatorId } from '../../../shared/lib/indicators';
import { useStoredState } from '../../../shared/lib/storage/useStoredState';
import { Skeleton } from '../../../shared/ui/Skeleton';
import { useIndicators } from '../model/useIndicators';
import { useLiveCandles } from '../model/useLiveCandles';
import { CandleChart } from './CandleChart';

const LABELS: Record<IndicatorId, string> = {
  sma20: 'SMA 20',
  ema50: 'EMA 50',
  bb: 'Bollinger 20, 2',
  rsi: 'RSI 14',
};
const HINTS: Record<IndicatorId, string> = {
  sma20: 'Простая скользящая средняя за 20 свечей',
  ema50: 'Экспоненциальная средняя за 50 свечей — сильнее реагирует на последние цены',
  bb: 'Коридор SMA 20 ± 2 стандартных отклонения: выход за край — необычно сильное движение',
  rsi: 'Индекс относительной силы: выше 70 — перекупленность, ниже 30 — перепроданность',
};
const DEFAULT: IndicatorId[] = ['sma20', 'rsi'];

/** Свечной режим графика монеты. Загружается лениво вместе с lightweight-charts. */
export default function CandlePanelBody({
  pair,
  range,
  name,
  height,
}: {
  pair: string;
  range: Range;
  name: string;
  height: number;
}) {
  const [selected, setSelected] = useStoredState<IndicatorId[]>('chart:indicators', DEFAULT);
  const { candles, visible, interval, query } = useLiveCandles(pair, range);
  const indicators = useIndicators(candles, selected);

  const toggle = (id: IndicatorId) =>
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : INDICATORS.filter((x) => x === id || prev.includes(x)),
    );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Индикаторы">
        {INDICATORS.map((id) => {
          const on = selected.includes(id);
          return (
            <button
              key={id}
              type="button"
              aria-pressed={on}
              title={HINTS[id]}
              onClick={() => toggle(id)}
              className={`num h-8 cursor-pointer border px-2.5 text-xs transition-colors ${
                on ? 'border-ink bg-ink text-on-ink' : 'border-rule text-ink hover:border-ink'
              }`}
            >
              {LABELS[id]}
            </button>
          );
        })}
        <span className="num ml-auto text-[11px] text-muted">
          свечи {interval}
          {indicators.ms != null &&
            ` · индикаторы: ${indicators.via === 'worker' ? 'Web Worker' : 'основной поток'}, ${indicators.ms.toFixed(1)} мс`}
        </span>
      </div>
      {query.isPending ? (
        <div style={{ height }}>
          <Skeleton className="h-full w-full" />
        </div>
      ) : query.isError ? (
        <div
          style={{ height }}
          className="flex items-center justify-center border border-dashed border-rule text-muted"
        >
          Не удалось загрузить свечи
        </div>
      ) : (
        <CandleChart
          candles={candles}
          visible={visible}
          indicators={indicators}
          selected={selected}
          height={height}
          label={`Свечной график ${name}, интервал ${interval}`}
        />
      )}
    </div>
  );
}
