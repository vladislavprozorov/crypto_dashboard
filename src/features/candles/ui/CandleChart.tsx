import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CandlestickSeries,
  createChart,
  CrosshairMode,
  HistogramSeries,
  LineSeries,
  LineStyle,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type LineData,
  type MouseEventParams,
  type Time,
  type UTCTimestamp,
} from 'lightweight-charts';
import type { Candle } from '../../../shared/api/binance';
import { formatCompact, formatNumber, formatUsd, priceDigits } from '../../../shared/lib/format';
import type { IndicatorId, IndicatorResult, Series } from '../../../shared/lib/indicators';

/** Цвет токена темы: «22 24 29» → «rgba(22, 24, 29, a)» (формат, который понимает библиотека). */
function token(name: string, alpha = 1) {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();
  const [r, g, b] = raw.split(/\s+/).map(Number);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** lightweight-charts рисует время в UTC — сдвигаем на локальный пояс пользователя. */
const TZ = -new Date().getTimezoneOffset() * 60;
const toTime = (t: number) => (t + TZ) as UTCTimestamp;

function palette() {
  return {
    ink: token('ink'),
    muted: token('muted'),
    rule: token('rule-soft'),
    panel: token('panel'),
    accent: token('accent'),
    up: token('up'),
    down: token('down'),
    upVol: token('up', 0.25),
    downVol: token('down', 0.25),
    band: token('muted', 0.8),
  };
}

function lineData(candles: Candle[], series: Series | undefined, offset: number): LineData<Time>[] {
  if (!series) return [];
  const out: LineData<Time>[] = [];
  for (let i = offset; i < candles.length && i < series.length; i++) {
    const v = series[i];
    if (v != null) out.push({ time: toTime(candles[i].time), value: v });
  }
  return out;
}

interface Legend {
  candle: Candle;
  values: Partial<Record<'sma20' | 'ema50' | 'bbU' | 'bbL' | 'rsi', number>>;
}

export function CandleChart({
  candles,
  visible,
  indicators,
  selected,
  height = 420,
  label,
}: {
  candles: Candle[];
  visible: number;
  indicators: { result: IndicatorResult; length: number; firstTime: number | null };
  selected: readonly IndicatorId[];
  height?: number;
  label: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const chart = useRef<IChartApi | null>(null);
  const series = useRef<{
    candles?: ISeriesApi<'Candlestick'>;
    volume?: ISeriesApi<'Histogram'>;
    sma20?: ISeriesApi<'Line'>;
    ema50?: ISeriesApi<'Line'>;
    bbU?: ISeriesApi<'Line'>;
    bbM?: ISeriesApi<'Line'>;
    bbL?: ISeriesApi<'Line'>;
    rsi?: ISeriesApi<'Line'>;
    rsiLines?: IPriceLine[];
  }>({});
  const loaded = useRef<{ first: number | null; length: number }>({ first: null, length: 0 });
  const [legend, setLegend] = useState<Legend | null>(null);
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme);

  // следим за сменой темы, чтобы перекрасить холст
  useEffect(() => {
    const obs = new MutationObserver(() => setTheme(document.documentElement.dataset.theme));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  // создание графика один раз
  useEffect(() => {
    if (!box.current) return;
    const p = palette();
    const c = createChart(box.current, {
      autoSize: true,
      layout: {
        background: { color: 'transparent' },
        textColor: p.muted,
        fontFamily: 'IBM Plex Mono, monospace',
        fontSize: 11,
        panes: { separatorColor: p.rule, separatorHoverColor: p.rule, enableResize: false },
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: p.rule, style: LineStyle.Dashed },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderColor: p.ink, timeVisible: true, secondsVisible: false, rightOffset: 4 },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: p.ink, style: LineStyle.Dashed, labelBackgroundColor: p.ink },
        horzLine: { color: p.ink, style: LineStyle.Dashed, labelBackgroundColor: p.ink },
      },
      localization: {
        locale: 'ru-RU',
        priceFormatter: (v: number) => formatNumber(v, Math.min(priceDigits(v), 6)),
      },
    });
    chart.current = c;
    series.current.candles = c.addSeries(CandlestickSeries, {
      upColor: p.panel,
      borderUpColor: p.up,
      wickUpColor: p.up,
      downColor: p.down,
      borderDownColor: p.down,
      wickDownColor: p.down,
      priceLineColor: p.ink,
      priceLineStyle: LineStyle.Dotted,
    });
    series.current.volume = c.addSeries(HistogramSeries, {
      priceScaleId: 'volume',
      priceFormat: { type: 'volume' },
      lastValueVisible: false,
      priceLineVisible: false,
    });
    c.priceScale('volume').applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });

    const onMove = (param: MouseEventParams<Time>) => {
      const s = series.current;
      const bar = param.time && s.candles ? param.seriesData.get(s.candles) : undefined;
      if (!bar || !('open' in bar)) {
        setLegend(null);
        return;
      }
      const values: Legend['values'] = {};
      (['sma20', 'ema50', 'bbU', 'bbL', 'rsi'] as const).forEach((k) => {
        const api = s[k];
        const d = api ? param.seriesData.get(api) : undefined;
        if (d && 'value' in d) values[k] = d.value;
      });
      const vol = s.volume ? param.seriesData.get(s.volume) : undefined;
      setLegend({
        candle: {
          time: Number(param.time),
          open: bar.open,
          high: bar.high,
          low: bar.low,
          close: bar.close,
          volume: vol && 'value' in vol ? vol.value : 0,
        },
        values,
      });
    };
    c.subscribeCrosshairMove(onMove);
    return () => {
      c.unsubscribeCrosshairMove(onMove);
      c.remove();
      chart.current = null;
      series.current = {};
      loaded.current = { first: null, length: 0 };
    };
  }, []);

  // перекраска при смене темы
  useEffect(() => {
    const c = chart.current;
    if (!c) return;
    const p = palette();
    c.applyOptions({
      layout: { textColor: p.muted, panes: { separatorColor: p.rule } },
      grid: { horzLines: { color: p.rule } },
      timeScale: { borderColor: p.ink },
      crosshair: {
        vertLine: { color: p.ink, labelBackgroundColor: p.ink },
        horzLine: { color: p.ink, labelBackgroundColor: p.ink },
      },
    });
    series.current.candles?.applyOptions({
      upColor: p.panel,
      borderUpColor: p.up,
      wickUpColor: p.up,
      downColor: p.down,
      borderDownColor: p.down,
      wickDownColor: p.down,
      priceLineColor: p.ink,
    });
    series.current.sma20?.applyOptions({ color: p.accent });
    series.current.ema50?.applyOptions({ color: p.ink });
    [series.current.bbU, series.current.bbM, series.current.bbL].forEach((s) =>
      s?.applyOptions({ color: p.band }),
    );
    series.current.rsi?.applyOptions({ color: p.accent });
    loaded.current = { first: null, length: 0 }; // перерисуем объём новыми цветами
  }, [theme]);

  // свечи и объём: полная загрузка при смене ряда, точечное обновление на тиках
  useEffect(() => {
    const s = series.current;
    const c = chart.current;
    if (!s.candles || !s.volume || !c || !candles.length) return;
    const p = palette();
    const bar = (k: Candle) => ({
      time: toTime(k.time),
      open: k.open,
      high: k.high,
      low: k.low,
      close: k.close,
    });
    const vol = (k: Candle) => ({
      time: toTime(k.time),
      value: k.volume,
      color: k.close >= k.open ? p.upVol : p.downVol,
    });
    const prev = loaded.current;
    const sameSeries = prev.first === candles[0].time;
    if (sameSeries && candles.length - prev.length <= 1 && candles.length >= prev.length) {
      const last = candles[candles.length - 1];
      s.candles.update(bar(last));
      s.volume.update(vol(last));
    } else {
      s.candles.setData(candles.map(bar));
      s.volume.setData(candles.map(vol));
      if (!sameSeries) {
        c.timeScale().setVisibleLogicalRange({
          from: Math.max(0, candles.length - visible),
          to: candles.length + 3,
        });
      }
    }
    loaded.current = { first: candles[0].time, length: candles.length };
  }, [candles, visible, theme]);

  // индикаторы: добавляем/убираем серии и обновляем данные
  const selectedKey = selected.join(',');
  useEffect(() => {
    const c = chart.current;
    const s = series.current;
    if (!c) return;
    const p = palette();
    const want = new Set(selected);
    const ensure = <K extends 'sma20' | 'ema50' | 'bbU' | 'bbM' | 'bbL' | 'rsi'>(
      key: K,
      on: boolean,
      opts: Parameters<IChartApi['addSeries']>[1],
      pane = 0,
    ) => {
      if (on && !s[key]) s[key] = c.addSeries(LineSeries, opts, pane) as never;
      if (!on && s[key]) {
        c.removeSeries(s[key]!);
        s[key] = undefined;
      }
    };
    const line = {
      lastValueVisible: false,
      priceLineVisible: false,
      crosshairMarkerVisible: false,
    };
    ensure('sma20', want.has('sma20'), { ...line, color: p.accent, lineWidth: 2 });
    ensure('ema50', want.has('ema50'), { ...line, color: p.ink, lineWidth: 1 });
    ensure('bbU', want.has('bb'), { ...line, color: p.band, lineWidth: 1 });
    ensure('bbM', want.has('bb'), {
      ...line,
      color: p.band,
      lineWidth: 1,
      lineStyle: LineStyle.Dotted,
    });
    ensure('bbL', want.has('bb'), { ...line, color: p.band, lineWidth: 1 });
    const hadRsi = Boolean(s.rsi);
    ensure(
      'rsi',
      want.has('rsi'),
      { ...line, color: p.accent, lineWidth: 1.5, lastValueVisible: true },
      1,
    );
    if (s.rsi && !hadRsi) {
      s.rsiLines = [70, 30].map((v) =>
        s.rsi!.createPriceLine({
          price: v,
          color: p.muted,
          lineStyle: LineStyle.Dashed,
          lineWidth: 1,
          axisLabelVisible: true,
          title: '',
        }),
      );
      s.rsi.priceScale().applyOptions({ scaleMargins: { top: 0.1, bottom: 0.1 } });
      s.rsi.applyOptions({
        autoscaleInfoProvider: () => ({ priceRange: { minValue: 0, maxValue: 100 } }),
      });
      c.panes()[1]?.setStretchFactor(0.4);
      c.panes()[0]?.setStretchFactor(1);
    }
    if (!s.rsi) s.rsiLines = undefined;

    // результат воркера считался для конкретного ряда — применяем, только если ряд тот же
    const { result, firstTime } = indicators;
    if (!candles.length || firstTime !== candles[0].time) return;
    const offset = 0;
    s.sma20?.setData(lineData(candles, result.sma20, offset));
    s.ema50?.setData(lineData(candles, result.ema50, offset));
    s.bbU?.setData(lineData(candles, result.bb?.upper, offset));
    s.bbM?.setData(lineData(candles, result.bb?.middle, offset));
    s.bbL?.setData(lineData(candles, result.bb?.lower, offset));
    s.rsi?.setData(lineData(candles, result.rsi, offset));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey, indicators, theme]);

  const shown = legend?.candle ?? candles[candles.length - 1];
  const last = useMemo(() => {
    if (!indicators.result || legend) return null;
    const pick = (s: Series | undefined) => {
      if (!s) return undefined;
      for (let i = s.length - 1; i >= 0; i--) if (s[i] != null) return s[i] as number;
      return undefined;
    };
    return {
      sma20: pick(indicators.result.sma20),
      ema50: pick(indicators.result.ema50),
      bbU: pick(indicators.result.bb?.upper),
      bbL: pick(indicators.result.bb?.lower),
      rsi: pick(indicators.result.rsi),
    };
  }, [indicators, legend]);
  const values = legend?.values ?? last ?? {};
  const change = shown ? ((shown.close - shown.open) / shown.open) * 100 : 0;

  return (
    <figure aria-label={label} className="relative m-0">
      {shown && (
        <figcaption className="num pointer-events-none mb-1 flex md:absolute md:left-1 md:top-0 md:z-10 md:mb-0 md:max-w-[calc(100%-80px)] flex-wrap gap-x-3 gap-y-0.5 bg-panel/80 px-1 text-[11px] text-muted">
          <span>
            O <span className="text-ink">{formatUsd(shown.open)}</span>
          </span>
          <span>
            H <span className="text-ink">{formatUsd(shown.high)}</span>
          </span>
          <span>
            L <span className="text-ink">{formatUsd(shown.low)}</span>
          </span>
          <span>
            C{' '}
            <span className={change >= 0 ? 'text-up' : 'text-down'}>{formatUsd(shown.close)}</span>
          </span>
          <span>
            V <span className="text-ink">{formatCompact(shown.volume)}</span>
          </span>
          {values.sma20 != null && (
            <span className="text-accent">SMA20 {formatNumber(values.sma20, 2)}</span>
          )}
          {values.ema50 != null && (
            <span className="text-ink">EMA50 {formatNumber(values.ema50, 2)}</span>
          )}
          {values.bbU != null && values.bbL != null && (
            <span>
              BB {formatNumber(values.bbL, 2)}–{formatNumber(values.bbU, 2)}
            </span>
          )}
          {values.rsi != null && <span className="text-accent">RSI {values.rsi.toFixed(1)}</span>}
        </figcaption>
      )}
      <div ref={box} style={{ height }} />
    </figure>
  );
}
