import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LivePricesProvider } from '../features/live-prices/ui/LivePricesProvider';
import { ErrorBoundary } from '../shared/ui/ErrorBoundary';
import AppRouter from './router/AppRouter';
import '../styles/index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      gcTime: 10 * 60_000,
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
    },
  },
});

export function renderApp(rootEl: HTMLElement) {
  createRoot(rootEl).render(
    <StrictMode>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <LivePricesProvider>
            <AppRouter />
          </LivePricesProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </StrictMode>,
  );
}

export async function bootstrap() {
  const rootEl = document.getElementById('root');
  if (!rootEl) throw new Error('Root element not found');
  renderApp(rootEl);
}
