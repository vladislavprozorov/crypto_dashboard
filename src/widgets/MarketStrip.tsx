import type { Coin } from '../entities/coin/model/types';
import { Change } from '../shared/ui/Change';
import { LivePrice } from '../shared/ui/LivePrice';
import { Skeleton } from '../shared/ui/Skeleton';
import { Sparkline } from '../shared/ui/Sparkline';

const isStable = (c: Coin) => c.current_price > 0.97 && c.current_price < 1.03;

/** Верхняя полоса: крупнейшие монеты без стейблкоинов. Клик выбирает монету для графика. */
export function MarketStrip({
  coins,
  selectedId,
  onSelect,
}: {
  coins: Coin[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const top = coins.filter((c) => !isStable(c)).slice(0, 4);

  return (
    <section
      aria-label="Крупнейшие монеты"
      className="grid grid-cols-2 border-l border-t border-rule lg:grid-cols-4"
    >
      {top.length === 0 &&
        Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="border-b border-r border-rule p-4">
            <Skeleton className="h-[58px]" />
          </div>
        ))}
      {top.map((c) => {
        const on = c.id === selectedId;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c.id)}
            aria-pressed={on}
            className={`relative flex cursor-pointer flex-col gap-2 border-b border-r border-rule px-4 py-3 text-left transition-colors md:px-5 md:py-4 ${
              on ? 'bg-panel' : 'hover:bg-panel/60'
            }`}
          >
            {on && <span aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5 bg-ink" />}
            <span className="flex items-baseline justify-between gap-2">
              <span className="truncate font-medium">
                {c.name}{' '}
                <span className="num text-xs font-normal uppercase text-muted">{c.symbol}</span>
              </span>
              <Change value={c.change24h} className="text-xs" />
            </span>
            <span className="flex items-end justify-between gap-3">
              <LivePrice value={c.current_price} className="text-lg md:text-[22px]" />
              <Sparkline values={c.sparkline_in_7d?.price} className="hidden text-ink sm:block" />
            </span>
          </button>
        );
      })}
    </section>
  );
}
