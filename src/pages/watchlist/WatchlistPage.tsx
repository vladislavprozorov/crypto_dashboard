import { useCoins } from '../../features/live-prices/model/useCoins';
import { DataNote } from '../../widgets/DataNote';
import { MarketSection } from '../../widgets/MarketSection';

export default function WatchlistPage() {
  const { coins, query } = useCoins();
  return (
    <div className="mx-auto flex max-w-page flex-col gap-4 px-4 py-4 md:gap-6 md:px-8 md:py-6">
      <header className="flex flex-col gap-1">
        <h1 className="m-0 text-2xl font-semibold">Вотчлист</h1>
        <p className="m-0 text-muted">
          Хранится в браузере и синхронизируется между открытыми вкладками.
        </p>
      </header>
      <MarketSection
        coins={coins}
        title="Отмеченные монеты"
        loading={query.isPending}
        watchlistOnly
        empty="Пока пусто. Отмечайте монеты звёздочкой на странице рынка."
        footer={<DataNote result={query.data} />}
      />
    </div>
  );
}
