import { lazy, Suspense } from 'react';
import { HashRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../layout/AppLayout';
import { Skeleton } from '../../shared/ui/Skeleton';

const DashboardPage = lazy(() => import('../../pages/dashboard/DashboardPage'));
const CoinPage = lazy(() => import('../../pages/coin/CoinPage'));
const WatchlistPage = lazy(() => import('../../pages/watchlist/WatchlistPage'));
const AlertsPage = lazy(() => import('../../pages/alerts/AlertsPage'));
const PortfolioPage = lazy(() => import('../../pages/portfolio/PortfolioPage'));

function PageFallback() {
  return (
    <div className="mx-auto flex max-w-page flex-col gap-4 px-4 py-6 md:px-8">
      <Skeleton className="h-20" />
      <Skeleton className="h-[360px]" />
    </div>
  );
}

function NotFound() {
  return (
    <div className="mx-auto flex max-w-page flex-col items-start gap-4 px-4 py-16 md:px-8">
      <h1 className="num m-0 text-4xl">404</h1>
      <p className="m-0 text-muted">Такой страницы нет.</p>
      <Link to="/" className="btn">
        К рынку
      </Link>
    </div>
  );
}

// HashRouter — потому что GitHub Pages не умеет отдавать index.html на любые пути
export default function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route
            index
            element={
              <Suspense fallback={<PageFallback />}>
                <DashboardPage />
              </Suspense>
            }
          />
          <Route
            path="coin/:coinId"
            element={
              <Suspense fallback={<PageFallback />}>
                <CoinPage />
              </Suspense>
            }
          />
          <Route
            path="watchlist"
            element={
              <Suspense fallback={<PageFallback />}>
                <WatchlistPage />
              </Suspense>
            }
          />
          <Route
            path="portfolio"
            element={
              <Suspense fallback={<PageFallback />}>
                <PortfolioPage />
              </Suspense>
            }
          />
          <Route
            path="alerts"
            element={
              <Suspense fallback={<PageFallback />}>
                <AlertsPage />
              </Suspense>
            }
          />
          <Route path="favorites" element={<Navigate to="/watchlist" replace />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
