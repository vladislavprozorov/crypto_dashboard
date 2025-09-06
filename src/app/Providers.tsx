/**
 * @copyright vladislavprozorov
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { DefaultOptions } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
// Опции по умолчанию
const defaultOptions: DefaultOptions = {
  queries: {
    staleTime: 5000, // 2 минуты — данные считаются \"свежими\"
    gcTime: 1000 * 60 * 10, // 10 минут — время до garbage-collection (ранее cacheTime)
    retry: 2, // количество retry при ошибке
    refetchOnWindowFocus: false, // не рефетчить каждый фокус вкладки (можно true для дашборда)
    refetchOnReconnect: true,
    refetchOnMount: false,
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 30_000),
  },
  mutations: {
    retry: 1,
  },
};
// дефолтные опции
const queryClient = new QueryClient({
  defaultOptions,
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
