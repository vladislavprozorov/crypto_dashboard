import { useId, useState, type ReactNode } from 'react';
import type { Coin } from '../entities/coin/model/types';
import { exportCsv, exportPdf } from '../features/export/exportCoins';
import { useWatchlist } from '../features/watchlist/model/useWatchlist';
import { DownloadIcon, SearchIcon } from '../shared/ui/icons';
import { Panel } from '../shared/ui/Panel';
import { Skeleton } from '../shared/ui/Skeleton';
import { MarketList, MarketTable } from './MarketTable';
import { useFilteredCoins } from './useFilteredCoins';

export function MarketSection({
  coins,
  title,
  loading,
  watchlistOnly = false,
  empty,
  footer,
}: {
  coins: Coin[];
  title: string;
  loading?: boolean;
  /** Страница вотчлиста: показываем только отмеченные и прячем переключатель */
  watchlistOnly?: boolean;
  empty?: ReactNode;
  footer?: ReactNode;
}) {
  const searchId = useId();
  const [query, setQuery] = useState('');
  const [onlyWatch, setOnlyWatch] = useState(false);
  const { ids } = useWatchlist();
  const visible = useFilteredCoins(coins, query, watchlistOnly || onlyWatch ? ids : undefined);

  return (
    <Panel
      id="market"
      title={title}
      aside={
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <label
            htmlFor={searchId}
            className="flex h-9 min-w-0 flex-1 items-center gap-2 border border-rule bg-paper px-3 focus-within:border-ink sm:w-52 sm:flex-none"
          >
            <SearchIcon size={14} className="shrink-0 text-muted" />
            <span className="sr-only">Фильтр по названию</span>
            <input
              id={searchId}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Фильтр"
              className="w-full min-w-0 bg-transparent text-[13px] outline-none"
            />
          </label>
          {!watchlistOnly && (
            <label className="btn-ghost select-none">
              <input
                type="checkbox"
                checked={onlyWatch}
                onChange={(e) => setOnlyWatch(e.target.checked)}
                className="accent-[rgb(var(--accent))]"
              />
              Вотчлист
            </label>
          )}
          <button
            type="button"
            className="btn-ghost"
            onClick={() => exportCsv(visible)}
            disabled={!visible.length}
          >
            <DownloadIcon size={14} /> CSV
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => exportPdf(visible)}
            disabled={!visible.length}
          >
            <DownloadIcon size={14} /> PDF
          </button>
        </div>
      }
    >
      {loading && !coins.length ? (
        <div className="flex flex-col gap-2 p-5">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-11" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="px-5 py-10 text-center text-muted">
          {query ? `Ничего не нашлось по запросу «${query}»` : (empty ?? 'Список пуст')}
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <MarketTable coins={visible} />
          </div>
          <div className="md:hidden">
            <MarketList coins={visible} />
          </div>
        </>
      )}
      {footer}
    </Panel>
  );
}
