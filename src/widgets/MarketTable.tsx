import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table';
import type { Coin } from '../entities/coin/model/types';
import { WatchToggle } from '../features/watchlist/ui/WatchToggle';
import { formatCompactUsd } from '../shared/lib/format';
import { Change } from '../shared/ui/Change';
import { CoinMark } from '../shared/ui/CoinMark';
import { LivePrice } from '../shared/ui/LivePrice';
import { Sparkline } from '../shared/ui/Sparkline';

const col = createColumnHelper<Coin>();

const columns = [
  col.accessor('market_cap_rank', {
    header: '#',
    cell: (c) => <span className="text-muted">{c.getValue() ?? '—'}</span>,
    meta: { align: 'left', width: 'w-12' },
  }),
  col.accessor('name', {
    header: 'Монета',
    cell: ({ row }) => (
      <Link
        to={`/coin/${row.original.id}`}
        className="flex h-[52px] items-center gap-3 font-sans text-sm hover:text-accent"
      >
        <CoinMark symbol={row.original.symbol} size="sm" />
        <span className="font-medium">{row.original.name}</span>
        <span className="num text-xs uppercase text-muted">{row.original.symbol}</span>
      </Link>
    ),
    sortingFn: 'alphanumeric',
    meta: { align: 'left' },
  }),
  col.accessor('current_price', {
    header: 'Цена',
    cell: (c) => <LivePrice value={c.getValue()} className="px-1" />,
  }),
  col.accessor('change24h', {
    header: '24ч',
    cell: (c) => <Change value={c.getValue()} />,
    sortUndefined: 'last',
  }),
  col.accessor('change7d', {
    header: '7д',
    cell: (c) => <Change value={c.getValue()} />,
    sortUndefined: 'last',
  }),
  col.accessor('market_cap', {
    header: 'Капитализация',
    cell: (c) => formatCompactUsd(c.getValue()),
  }),
  col.accessor('total_volume', {
    header: 'Объём 24ч',
    cell: (c) => formatCompactUsd(c.getValue()),
  }),
  col.display({
    id: 'spark',
    header: '7 дней',
    cell: ({ row }) => (
      <Sparkline
        values={row.original.sparkline_in_7d?.price}
        className={(row.original.change7d ?? 0) >= 0 ? 'ml-auto text-ink' : 'ml-auto text-muted'}
      />
    ),
  }),
  col.display({
    id: 'watch',
    header: () => <span className="sr-only">Вотчлист</span>,
    cell: ({ row }) => <WatchToggle coinId={row.original.id} name={row.original.name} />,
    meta: { width: 'w-14' },
  }),
];

type Meta = { align?: 'left'; width?: string };

export function MarketTable({ coins }: { coins: Coin[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const table = useReactTable({
    data: coins,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (c) => c.id,
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[960px] border-collapse">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => {
                const meta = (h.column.columnDef.meta ?? {}) as Meta;
                const sorted = h.column.getIsSorted();
                const canSort = h.column.getCanSort();
                return (
                  <th
                    key={h.id}
                    scope="col"
                    aria-sort={
                      sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined
                    }
                    className={`px-3 py-2 text-xs font-medium text-muted first:pl-5 last:pr-3 ${
                      meta.align === 'left' ? 'text-left' : 'text-right'
                    } ${meta.width ?? ''}`}
                  >
                    {canSort ? (
                      <button
                        type="button"
                        onClick={h.column.getToggleSortingHandler()}
                        className={`inline-flex cursor-pointer items-center gap-1 hover:text-ink ${
                          sorted ? 'text-ink' : ''
                        }`}
                      >
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        <span aria-hidden="true" className="num w-2">
                          {sorted === 'asc' ? '↑' : sorted === 'desc' ? '↓' : ''}
                        </span>
                      </button>
                    ) : (
                      flexRender(h.column.columnDef.header, h.getContext())
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="num border-t border-rule-soft text-[13px] transition-colors hover:bg-paper/60"
            >
              {row.getVisibleCells().map((cell) => {
                const meta = (cell.column.columnDef.meta ?? {}) as Meta;
                return (
                  <td
                    key={cell.id}
                    className={`px-3 first:pl-5 last:pr-3 ${
                      meta.align === 'left' ? 'text-left' : 'text-right'
                    }`}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Компактный список для телефона: монета слева, цена и изменение справа. */
export function MarketList({ coins }: { coins: Coin[] }) {
  return (
    <ul className="m-0 list-none p-0">
      {coins.map((c) => (
        <li key={c.id} className="flex items-center border-t border-rule-soft">
          <Link
            to={`/coin/${c.id}`}
            className="grid min-h-[60px] min-w-0 flex-1 grid-cols-[28px_1fr_auto] items-center gap-3 py-2 pl-4"
          >
            <CoinMark symbol={c.symbol} size="sm" />
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-medium uppercase">{c.symbol}</span>
              <span className="truncate text-xs text-muted">{c.name}</span>
            </span>
            <span className="flex flex-col items-end">
              <LivePrice value={c.current_price} />
              <Change value={c.change24h} className="text-xs" />
            </span>
          </Link>
          <WatchToggle coinId={c.id} name={c.name} />
        </li>
      ))}
    </ul>
  );
}
