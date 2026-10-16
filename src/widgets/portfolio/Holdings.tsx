import { Link } from 'react-router-dom';
import type { PositionRow } from '../../features/portfolio/model/calc';
import { formatPct, formatUsd, trendOf } from '../../shared/lib/format';
import { Change } from '../../shared/ui/Change';
import { CoinMark } from '../../shared/ui/CoinMark';
import { LivePrice } from '../../shared/ui/LivePrice';

const TONE = { up: 'text-up', down: 'text-down', flat: 'text-muted' } as const;

function Pnl({ row }: { row: PositionRow }) {
  return (
    <span className={`num flex flex-col items-end ${TONE[trendOf(row.pnl)]}`}>
      <span>
        {row.pnl > 0 ? '+' : ''}
        {formatUsd(row.pnl)}
      </span>
      <span className="text-xs">{formatPct(row.pnlPct)}</span>
    </span>
  );
}

const qty = (v: number) =>
  (+v.toFixed(v >= 1 ? 4 : 8)).toLocaleString('en-US', { maximumFractionDigits: 8 });

/** Позиции: таблица на десктопе, карточки-строки на телефоне. */
export function Holdings({ rows }: { rows: PositionRow[] }) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[820px] border-collapse text-[13px]">
          <thead>
            <tr className="text-right text-xs text-muted">
              <th scope="col" className="px-3 py-2 pl-5 text-left font-medium">
                Монета
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                Количество
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                Средняя цена
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                Цена · 24ч
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                Стоимость
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                Прибыль
              </th>
              <th scope="col" className="w-36 px-3 py-2 pr-5 font-medium">
                Доля
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.coinId} className="num border-t border-rule-soft text-right">
                <td className="px-3 py-2 pl-5 text-left font-sans">
                  <Link
                    to={`/coin/${r.coinId}`}
                    className="flex items-center gap-3 hover:text-accent"
                  >
                    <CoinMark symbol={r.symbol} size="sm" />
                    <span className="font-medium">{r.name}</span>
                    <span className="num text-xs uppercase text-muted">{r.symbol}</span>
                  </Link>
                </td>
                <td className="px-3">{qty(r.amount)}</td>
                <td className="px-3 text-muted">{formatUsd(r.avgPrice)}</td>
                <td className="px-3">
                  <span className="flex flex-col items-end">
                    {r.price != null ? (
                      <LivePrice value={r.price} />
                    ) : (
                      <span className="text-muted">нет цены</span>
                    )}
                    <Change value={r.change24h} className="text-xs" />
                  </span>
                </td>
                <td className="px-3 font-medium">{formatUsd(r.value)}</td>
                <td className="px-3">
                  <Pnl row={r} />
                </td>
                <td className="px-3 pr-5">
                  <span className="flex items-center justify-end gap-2">
                    <span className="h-1.5 w-16 bg-rule-soft" aria-hidden="true">
                      <span
                        className="block h-full bg-ink"
                        style={{ width: `${r.share * 100}%` }}
                      />
                    </span>
                    <span className="w-12">{(r.share * 100).toFixed(1)}%</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="m-0 list-none p-0 md:hidden">
        {rows.map((r) => (
          <li key={r.coinId} className="border-t border-rule-soft">
            <Link
              to={`/coin/${r.coinId}`}
              className="grid grid-cols-[28px_1fr_auto] items-center gap-3 px-4 py-3"
            >
              <CoinMark symbol={r.symbol} size="sm" />
              <span className="flex min-w-0 flex-col">
                <span className="font-medium uppercase">
                  {r.symbol}{' '}
                  <span className="num text-xs font-normal text-muted">
                    {(r.share * 100).toFixed(1)}%
                  </span>
                </span>
                <span className="num text-xs text-muted">
                  {qty(r.amount)} · ср. {formatUsd(r.avgPrice)}
                </span>
              </span>
              <span className="flex flex-col items-end">
                <span className="num font-medium">{formatUsd(r.value)}</span>
                <span className={`num text-xs ${TONE[trendOf(r.pnl)]}`}>
                  {r.pnl > 0 ? '+' : ''}
                  {formatUsd(r.pnl)} · {formatPct(r.pnlPct)}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
