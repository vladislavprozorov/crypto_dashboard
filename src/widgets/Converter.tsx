import { useId, useState } from 'react';
import type { Coin } from '../entities/coin/model/types';
import { formatNumber, parseAmount } from '../shared/lib/format';
import { Panel } from '../shared/ui/Panel';

const plain = (n: number, digits: number) => formatNumber(n, digits).replace(/\u2009/g, ' ');

/** Конвертер монета ↔ USD. Пересчёт идёт от последнего изменённого поля и следует за live-ценой. */
export function Converter({ coin }: { coin: Coin }) {
  const id = useId();
  const [amount, setAmount] = useState('1');
  const [source, setSource] = useState<'coin' | 'usd'>('coin');

  const value = parseAmount(amount);
  const price = coin.current_price;
  const coinValue =
    source === 'coin' ? amount : value != null && price ? plain(value / price, 6) : '';
  const usdValue =
    source === 'usd' ? amount : value != null ? plain(value * price, price < 1 ? 4 : 2) : '';

  return (
    <Panel id="converter" title="Конвертер">
      <div className="grid grid-cols-2 gap-3 p-5">
        <label
          htmlFor={`${id}-coin`}
          className="flex min-w-0 flex-col gap-1.5 text-xs uppercase text-muted"
        >
          {coin.symbol}
          <input
            id={`${id}-coin`}
            className="field num min-w-0 text-[15px]"
            inputMode="decimal"
            value={coinValue}
            onChange={(e) => {
              setSource('coin');
              setAmount(e.target.value);
            }}
          />
        </label>
        <label htmlFor={`${id}-usd`} className="flex min-w-0 flex-col gap-1.5 text-xs text-muted">
          USD
          <input
            id={`${id}-usd`}
            className="field num min-w-0 text-[15px]"
            inputMode="decimal"
            value={usdValue}
            onChange={(e) => {
              setSource('usd');
              setAmount(e.target.value);
            }}
          />
        </label>
      </div>
    </Panel>
  );
}
