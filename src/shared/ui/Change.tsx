import { formatPct, trendOf } from '../lib/format';

const COLOR = { up: 'text-up', down: 'text-down', flat: 'text-muted' } as const;
const ARROW = { up: '▲', down: '▼', flat: '' } as const;

/** Изменение в процентах: знак, стрелка и цвет вместе — чтобы не различать только по цвету. */
export function Change({
  value,
  className = '',
  arrow = true,
}: {
  value: number | null | undefined;
  className?: string;
  arrow?: boolean;
}) {
  const trend = trendOf(value);
  return (
    <span className={`num whitespace-nowrap ${COLOR[trend]} ${className}`}>
      {arrow && ARROW[trend] && (
        <span aria-hidden="true" className="mr-1 text-[0.8em]">
          {ARROW[trend]}
        </span>
      )}
      {formatPct(value)}
    </span>
  );
}
