import type { Coin } from '../entities/coin/model/types';
import { formatUsd } from '../shared/lib/format';
import { Change } from '../shared/ui/Change';
import { CoinMark } from '../shared/ui/CoinMark';
import { LivePrice } from '../shared/ui/LivePrice';

/** Название и крупная цена монеты. size="lg" — для страницы монеты. */
export function CoinHeadline({
  coin,
  size = 'md',
  as: Heading = 'h2',
}: {
  coin: Coin;
  size?: 'md' | 'lg';
  as?: 'h1' | 'h2';
}) {
  const lg = size === 'lg';
  const delta =
    coin.change24h != null
      ? coin.current_price - coin.current_price / (1 + coin.change24h / 100)
      : null;
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <CoinMark symbol={coin.symbol} size={lg ? 'lg' : 'md'} />
        <Heading className={`m-0 font-semibold ${lg ? 'text-[28px]' : 'text-lg'}`}>
          {coin.name}
        </Heading>
        <span className="num border border-rule px-1.5 py-0.5 text-xs uppercase text-muted">
          {coin.symbol}
        </span>
        {coin.market_cap_rank && (
          <span className="num text-xs text-muted">#{coin.market_cap_rank}</span>
        )}
      </div>
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <LivePrice
          value={coin.current_price}
          className={`font-medium tracking-tight ${lg ? 'text-[40px] leading-none md:text-[56px]' : 'text-[32px] md:text-[40px]'}`}
        />
        <span className="flex items-baseline gap-2 text-sm">
          <Change value={coin.change24h} />
          {delta != null && (
            <span className="num text-muted">
              {delta >= 0 ? '+' : ''}
              {formatUsd(delta)} за 24ч
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
