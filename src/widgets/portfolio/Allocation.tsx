import type { PositionRow } from '../../features/portfolio/model/calc';
import { formatUsd } from '../../shared/lib/format';

const MAX_SLICES = 5;
/** Оттенки одного цвета вместо радуги: доли различаются светлотой и подписями. */
const SHADES = [1, 0.72, 0.5, 0.34, 0.22, 0.12];

export function Allocation({ rows }: { rows: PositionRow[] }) {
  const top = rows.slice(0, MAX_SLICES);
  const rest = rows.slice(MAX_SLICES);
  const slices = [
    ...top.map((r) => ({
      key: r.coinId,
      label: r.symbol.toUpperCase(),
      share: r.share,
      value: r.value,
    })),
    ...(rest.length
      ? [
          {
            key: 'rest',
            label: `Ещё ${rest.length}`,
            share: rest.reduce((s, r) => s + r.share, 0),
            value: rest.reduce((s, r) => s + r.value, 0),
          },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-4 p-5">
      <div
        className="flex h-8 w-full overflow-hidden border border-ink"
        role="img"
        aria-label={`Распределение: ${slices.map((s) => `${s.label} ${(s.share * 100).toFixed(1)}%`).join(', ')}`}
      >
        {slices.map((s, i) => (
          <span
            key={s.key}
            className="h-full border-r border-panel last:border-r-0"
            style={{
              width: `${s.share * 100}%`,
              background: `rgb(var(--ink) / ${SHADES[i] ?? 0.1})`,
            }}
          />
        ))}
      </div>
      <ul className="m-0 grid list-none gap-2 p-0">
        {slices.map((s, i) => (
          <li key={s.key} className="flex items-center gap-3 text-[13px]">
            <span
              aria-hidden="true"
              className="h-3 w-3 shrink-0 border border-ink"
              style={{ background: `rgb(var(--ink) / ${SHADES[i] ?? 0.1})` }}
            />
            <span className="font-medium">{s.label}</span>
            <span className="num ml-auto text-muted">{formatUsd(s.value)}</span>
            <span className="num w-14 text-right">{(s.share * 100).toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
