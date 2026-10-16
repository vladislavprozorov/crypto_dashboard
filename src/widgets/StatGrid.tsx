import type { ReactNode } from 'react';

export interface Stat {
  label: string;
  value: ReactNode;
}

/** Сетка показателей: подпись слева, табличное число справа (или под ней — variant="stack"). */
export function StatGrid({
  stats,
  variant = 'row',
  className = '',
}: {
  stats: Stat[];
  variant?: 'row' | 'stack';
  className?: string;
}) {
  if (variant === 'stack') {
    return (
      <dl className={`m-0 grid grid-cols-2 border-t border-rule md:grid-cols-4 ${className}`}>
        {stats.map((s) => (
          <div
            key={s.label}
            className="border-b border-r border-rule-soft px-5 py-3 last:border-r-0 md:border-b-0 md:px-6"
          >
            <dt className="text-xs text-muted">{s.label}</dt>
            <dd className="num m-0 mt-1 text-[15px]">{s.value}</dd>
          </div>
        ))}
      </dl>
    );
  }
  return (
    <dl className={`m-0 grid sm:grid-cols-2 ${className}`}>
      {stats.map((s) => (
        <div
          key={s.label}
          className="flex justify-between gap-3 border-b border-rule-soft px-5 py-3 sm:odd:border-r"
        >
          <dt className="text-muted">{s.label}</dt>
          <dd className="num m-0 text-right">{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}
