import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAlerts } from '../../features/alerts/model/useAlerts';
import { ThemeToggle } from '../../features/theme/ThemeToggle';
import { useWatchlist } from '../../features/watchlist/model/useWatchlist';
import { useMetaMask } from '../../shared/lib/wallet/useMetaMask';
import { BellIcon, MarketIcon, StarIcon, WalletIcon } from '../../shared/ui/icons';
import { toast } from '../../shared/lib/toast';
import { Toaster } from '../../shared/ui/Toaster';
import { AlertsWatcher } from '../../widgets/AlertsWatcher';
import { CoinSearch } from '../../widgets/CoinSearch';
import { LiveStatus } from '../../widgets/LiveStatus';

function useNavItems() {
  const { ids } = useWatchlist();
  const { alerts } = useAlerts();
  const active = alerts.filter((a) => a.triggeredAt == null).length;
  return [
    { to: '/', label: 'Рынок', icon: MarketIcon, count: null, end: true },
    { to: '/portfolio', label: 'Портфель', icon: WalletIcon, count: null, end: false },
    { to: '/watchlist', label: 'Вотчлист', icon: StarIcon, count: ids.length, end: false },
    { to: '/alerts', label: 'Алерты', icon: BellIcon, count: active || null, end: false },
  ];
}

function WalletButton() {
  const { account, connect } = useMetaMask();
  const onClick = async () => {
    if (!window.ethereum) {
      toast({
        title: 'MetaMask не найден',
        body: 'Установите расширение MetaMask и обновите страницу',
      });
      return;
    }
    await connect();
  };
  return (
    <button type="button" className="btn-solid hidden lg:inline-flex" onClick={onClick}>
      {account ? (
        <span className="num">
          {account.slice(0, 6)}…{account.slice(-4)}
        </span>
      ) : (
        'Подключить кошелёк'
      )}
    </button>
  );
}

export function AppLayout() {
  const nav = useNavItems();

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-ink focus:px-3 focus:py-2 focus:text-on-ink"
      >
        К содержимому
      </a>
      <header className="sticky top-0 z-30 border-b border-ink bg-paper">
        <div className="mx-auto flex min-h-[56px] max-w-page items-center gap-4 px-4 md:min-h-[64px] md:gap-8 md:px-8">
          <Link to="/" className="num text-[15px] font-medium tracking-[0.02em]">
            CRYPTO/DASH
          </Link>
          <nav aria-label="Разделы" className="hidden gap-1 md:flex">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex h-16 items-center gap-2 border-b-2 px-3 ${
                    isActive
                      ? 'border-ink font-medium'
                      : 'border-transparent text-muted hover:text-ink'
                  }`
                }
              >
                {item.label}
                {item.count != null && <span className="num text-xs text-muted">{item.count}</span>}
              </NavLink>
            ))}
          </nav>
          <div className="flex-1" />
          <div className="hidden sm:block">
            <LiveStatus />
          </div>
          <div className="sm:hidden">
            <LiveStatus compact />
          </div>
          <div className="hidden lg:block">
            <CoinSearch />
          </div>
          <ThemeToggle />
          <WalletButton />
        </div>
      </header>

      <main id="content" className="flex-1 pb-24 md:pb-0">
        <Outlet />
      </main>

      <footer className="hidden border-t border-rule md:block">
        <div className="mx-auto flex max-w-page flex-wrap justify-between gap-2 px-8 py-5 text-xs text-muted">
          <span>
            Цены: CoinGecko · live-тики: Binance WebSocket · данные не являются инвестсоветом
          </span>
          <a
            href="https://github.com/vladislavprozorov/crypto_dashboard"
            className="hover:text-ink"
            target="_blank"
            rel="noreferrer"
          >
            github.com/vladislavprozorov/crypto_dashboard
          </a>
        </div>
      </footer>

      <nav
        aria-label="Разделы"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-ink bg-paper pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `relative flex h-16 flex-col items-center justify-center gap-1 text-xs ${
                isActive ? 'font-semibold text-ink' : 'text-muted'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span aria-hidden="true" className="absolute inset-x-6 top-0 h-0.5 bg-ink" />
                )}
                <item.icon size={18} />
                <span>
                  {item.label}
                  {item.count != null && <span className="num ml-1 font-normal">{item.count}</span>}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <AlertsWatcher />
      <Toaster />
    </div>
  );
}
