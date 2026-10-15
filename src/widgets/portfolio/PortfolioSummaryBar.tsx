import type { PortfolioSummary } from '../../features/portfolio/model/calc';
import { formatPct, formatUsd, trendOf } from '../../shared/lib/format';
import { LivePrice } from '../../shared/ui/LivePrice';

const TONE = { up: 'text-up', down: 'text-down', flat: 'text-muted' } as const;

function Signed({ value, pct }: { value: number; pct?: number | null }) {
  const tone = TONE[trendOf(value, 0.005)];
  return (
    <span className={`num ${tone}`}>
      <span className="whitespace-nowrap">
        {value > 0 ? '+' : ''}
        {formatUsd(value)}
      </span>
      {pct != null && <span className="block text-[13px] sm:ml-2 sm:inline">{formatPct(pct)}</span>}
    </span>
  );
}

export function PortfolioSummaryBar({ summary }: { summary: PortfolioSummary }) {
  const cells = [
    {
      label: 'Вложено в позиции',
      value: <span className="num">{formatUsd(summary.costBasis)}</span>,
    },
    {
      label: 'Нереализованная прибыль',
      value: <Signed value={summary.unrealized} pct={summary.unrealizedPct} />,
    },
    { label: 'Зафиксировано продажами', value: <Signed value={summary.realized} /> },
    { label: 'За 24 часа', value: <Signed value={summary.change24h} pct={summary.change24hPct} /> },
  ];

  return (
    <section aria-label="Итоги портфеля" className="panel grid lg:grid-cols-[1.3fr_repeat(4,1fr)]">
      <div className="border-b border-rule px-5 py-4 lg:border-b-0 lg:border-r md:px-6">
        <div className="text-xs text-muted">Стоимость портфеля</div>
        <LivePrice
          value={summary.value}
          className="mt-1 block text-[32px] font-medium leading-tight tracking-tight md:text-[40px]"
        />
      </div>
      <dl className="m-0 grid grid-cols-2 lg:col-span-4 lg:grid-cols-4">
        {cells.map((c, i) => (
          <div
            key={c.label}
            className={`flex flex-col justify-center px-5 py-3 md:px-6 ${
              i % 2 === 0 ? 'border-r border-rule-soft' : ''
            } ${i < 2 ? 'border-b border-rule-soft lg:border-b-0' : ''} lg:border-r lg:last:border-r-0`}
          >
            <dt className="text-xs text-muted">{c.label}</dt>
            <dd className="m-0 mt-1 text-[15px]">{c.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
