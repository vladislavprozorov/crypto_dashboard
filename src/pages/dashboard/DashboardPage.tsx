import { Link, useSearchParams } from 'react-router-dom';
import { useCoins } from '../../features/live-prices/model/useCoins';
import { formatCompactUsd, formatUsd } from '../../shared/lib/format';
import { ArrowRightIcon } from '../../shared/ui/icons';
import { Skeleton } from '../../shared/ui/Skeleton';
import { ChartPanel } from '../../widgets/ChartPanel';
import { CoinHeadline } from '../../widgets/CoinHeadline';
import { DataNote } from '../../widgets/DataNote';
import { MarketSection } from '../../widgets/MarketSection';
import { MarketStrip } from '../../widgets/MarketStrip';
import { PortfolioPanel } from '../../widgets/portfolio/PortfolioPanel';
import { AlertsPanel, WatchlistPanel } from '../../widgets/SidePanels';
import { StatGrid } from '../../widgets/StatGrid';

export default function DashboardPage() {
  const { coins, query } = useCoins();
  const [params, setParams] = useSearchParams();
  const selectedId = params.get('coin') ?? 'bitcoin';
  const selected = coins.find((c) => c.id === selectedId) ?? coins[0];

  const select = (id: string) =>
    setParams(id === 'bitcoin' ? {} : { coin: id }, { replace: true, preventScrollReset: true });

  return (
    <div className="mx-auto flex max-w-page flex-col gap-4 px-4 py-4 md:gap-6 md:px-8 md:py-6">
      <h1 className="sr-only">Рынок криптовалют</h1>
      {query.isError && !query.data && (
        <p role="alert" className="m-0 border border-down px-4 py-3 text-down">
          {query.error.message}
        </p>
      )}

      <MarketStrip coins={coins} selectedId={selected?.id ?? selectedId} onSelect={select} />

      <div className="flex flex-wrap items-start gap-4 md:gap-6">
        <div className="min-w-0 flex-[999_1_640px]">
          {selected ? (
            <ChartPanel
              coin={selected}
              header={<CoinHeadline coin={selected} />}
              footer={
                <>
                  <StatGrid
                    variant="stack"
                    stats={[
                      { label: 'Капитализация', value: formatCompactUsd(selected.market_cap) },
                      { label: 'Объём 24ч', value: formatCompactUsd(selected.total_volume) },
                      { label: 'Макс. 24ч', value: formatUsd(selected.high_24h) },
                      { label: 'Мин. 24ч', value: formatUsd(selected.low_24h) },
                    ]}
                  />
                  <Link
                    to={`/coin/${selected.id}`}
                    className="flex items-center justify-between border-t border-rule px-5 py-3 text-[13px] hover:bg-paper/60 md:px-6"
                  >
                    Страница {selected.name}: показатели, алерты, конвертер
                    <ArrowRightIcon />
                  </Link>
                </>
              }
            />
          ) : (
            <div className="panel p-6">
              <Skeleton className="mb-4 h-14 w-72" />
              <Skeleton className="h-[320px]" />
            </div>
          )}
        </div>
        <aside className="flex min-w-0 flex-[1_1_320px] flex-col gap-4 md:gap-6">
          <PortfolioPanel />
          <WatchlistPanel coins={coins} />
          <AlertsPanel coins={coins} newAlertFor={selected?.id} />
        </aside>
      </div>

      <MarketSection
        coins={coins}
        title={`Топ-${coins.length || 50} по капитализации`}
        loading={query.isPending}
        footer={<DataNote result={query.data} />}
      />
    </div>
  );
}
