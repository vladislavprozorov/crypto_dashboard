import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useProfileQuery } from '../../entities/coin/api/queries';
import { useAlerts } from '../../features/alerts/model/useAlerts';
import { AlertForm } from '../../features/alerts/ui/AlertForm';
import { AlertList } from '../../features/alerts/ui/AlertList';
import { exportPdf } from '../../features/export/exportCoins';
import { useCoin } from '../../features/live-prices/model/useCoins';
import { WatchToggle } from '../../features/watchlist/ui/WatchToggle';
import { formatCompact, formatCompactUsd, formatPct, formatUsd } from '../../shared/lib/format';
import { Change } from '../../shared/ui/Change';
import { DownloadIcon } from '../../shared/ui/icons';
import { Panel } from '../../shared/ui/Panel';
import { Skeleton } from '../../shared/ui/Skeleton';
import { ChartPanel } from '../../widgets/ChartPanel';
import { CoinHeadline } from '../../widgets/CoinHeadline';
import { Converter } from '../../widgets/Converter';
import { StatGrid } from '../../widgets/StatGrid';

function About({ coinId, name }: { coinId: string; name: string }) {
  const { data, isPending, isError } = useProfileQuery(coinId);
  const [open, setOpen] = useState(false);
  if (isError) return null;
  const text = data?.description ?? '';
  const long = text.length > 600;

  return (
    <Panel id="about" title={`О проекте ${name}`}>
      <div className="flex flex-col gap-3 px-5 py-4">
        {isPending ? (
          <>
            <Skeleton className="h-4" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
          </>
        ) : text ? (
          <>
            <p className="m-0 max-w-[72ch] whitespace-pre-line leading-relaxed">
              {open || !long ? text : `${text.slice(0, 600).trimEnd()}…`}
            </p>
            {long && (
              <button
                type="button"
                className="self-start text-[13px] underline underline-offset-4 hover:text-accent"
                onClick={() => setOpen((v) => !v)}
              >
                {open ? 'Свернуть' : 'Читать полностью'}
              </button>
            )}
          </>
        ) : (
          <p className="m-0 text-muted">Описание отсутствует.</p>
        )}
        {data && (data.homepage || data.categories.length > 0 || data.genesisDate) && (
          <dl className="m-0 flex flex-wrap gap-x-8 gap-y-2 border-t border-rule-soft pt-3 text-[13px]">
            {data.homepage && (
              <div className="flex gap-2">
                <dt className="text-muted">Сайт</dt>
                <dd className="m-0">
                  <a
                    href={data.homepage}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-4 hover:text-accent"
                  >
                    {new URL(data.homepage).hostname.replace(/^www\./, '')}
                  </a>
                </dd>
              </div>
            )}
            {data.genesisDate && (
              <div className="flex gap-2">
                <dt className="text-muted">Запуск</dt>
                <dd className="num m-0">{data.genesisDate}</dd>
              </div>
            )}
            {data.categories.length > 0 && (
              <div className="flex gap-2">
                <dt className="text-muted">Категории</dt>
                <dd className="m-0">{data.categories.join(', ')}</dd>
              </div>
            )}
          </dl>
        )}
      </div>
    </Panel>
  );
}

export default function CoinPage() {
  const { coinId } = useParams<{ coinId: string }>();
  const { coin, query } = useCoin(coinId);
  const { alerts } = useAlerts();
  const { hash } = useLocation();

  useEffect(() => {
    if (coin) document.title = `${coin.name} ${formatUsd(coin.current_price)} — Crypto Dashboard`;
  }, [coin]);
  useEffect(() => () => void (document.title = 'Crypto Dashboard — рынок в реальном времени'), []);

  useEffect(() => {
    if (hash === '#alert' && coin) {
      document.getElementById('alert-form')?.scrollIntoView({ block: 'start' });
      document.querySelector<HTMLInputElement>('#alert-form input')?.focus({ preventScroll: true });
    }
    // скроллим один раз, когда монета появилась
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hash, Boolean(coin)]);

  if (!coin) {
    return (
      <div className="mx-auto max-w-page px-4 py-10 md:px-8">
        {query.isPending ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-16 w-96 max-w-full" />
            <Skeleton className="h-[360px]" />
          </div>
        ) : (
          <div className="panel flex flex-col items-start gap-4 p-8">
            <h1 className="m-0 text-xl font-semibold">Монета «{coinId}» не найдена</h1>
            <p className="m-0 text-muted">Дашборд отслеживает топ-50 монет по капитализации.</p>
            <Link to="/" className="btn">
              К рынку
            </Link>
          </div>
        )}
      </div>
    );
  }

  const coinAlerts = alerts.filter((a) => a.coinId === coin.id);
  const sup = coin.symbol.toUpperCase();

  return (
    <div className="mx-auto flex max-w-page flex-col gap-4 px-4 py-4 md:gap-6 md:px-8 md:py-5">
      <nav aria-label="Навигация" className="flex gap-2 text-[13px] text-muted">
        <Link to="/" className="hover:text-ink">
          Рынок
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-ink">{coin.name}</span>
      </nav>

      <div className="flex flex-wrap items-end justify-between gap-5 border-b border-rule pb-5 md:pb-6">
        <CoinHeadline coin={coin} size="lg" as="h1" />
        <div className="flex gap-2">
          <WatchToggle coinId={coin.id} name={coin.name} variant="button" />
          <button
            type="button"
            className="btn h-11"
            onClick={() => exportPdf([coin], `${coin.name} (${sup}) snapshot`)}
          >
            <DownloadIcon /> PDF
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-4 md:gap-6">
        <div className="flex min-w-0 flex-[999_1_640px] flex-col gap-4 md:gap-6">
          <ChartPanel coin={coin} height={360} allowCandles />
          <Panel id="stats" title="Показатели">
            <StatGrid
              stats={[
                { label: 'Капитализация', value: formatCompactUsd(coin.market_cap) },
                { label: 'Объём 24ч', value: formatCompactUsd(coin.total_volume) },
                { label: 'Макс. 24ч', value: formatUsd(coin.high_24h) },
                { label: 'Мин. 24ч', value: formatUsd(coin.low_24h) },
                { label: 'Изменение 7д', value: <Change value={coin.change7d} /> },
                { label: 'В обращении', value: formatCompact(coin.circulating_supply, sup) },
                {
                  label: 'Макс. эмиссия',
                  value: coin.max_supply ? formatCompact(coin.max_supply, sup) : '∞',
                },
                { label: 'Исторический максимум', value: formatUsd(coin.ath) },
                {
                  label: 'От максимума',
                  value: formatPct(
                    coin.ath
                      ? (coin.current_price / coin.ath - 1) * 100
                      : coin.ath_change_percentage,
                  ),
                },
                {
                  label: 'Источник цены',
                  value: coin.liveAt ? `Binance ${coin.pair}` : 'CoinGecko',
                },
              ]}
            />
          </Panel>
          <About coinId={coin.id} name={coin.name} />
        </div>

        <aside className="flex min-w-0 flex-[1_1_340px] flex-col gap-4 md:gap-6">
          <div id="alert-form" className="scroll-mt-24">
            <AlertForm coin={coin} />
          </div>
          <Panel id="coin-alerts" title={`Алерты по ${sup}`}>
            <AlertList
              alerts={coinAlerts}
              prices={{ [coin.id]: coin.current_price }}
              showCoin={false}
              empty="Для этой монеты алертов нет"
            />
          </Panel>
          <Converter coin={coin} />
        </aside>
      </div>
    </div>
  );
}
