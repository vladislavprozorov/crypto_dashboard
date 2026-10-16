import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { miniTickerStreamUrl, parseMiniTicker } from '../../../shared/api/binance';
import { createReconnectingSocket } from '../../../shared/lib/ws/createReconnectingSocket';
import { pairFor, useMarketsQuery, usePairsQuery } from '../../../entities/coin/api/queries';
import { LiveStoreContext } from '../model/context';
import { createLiveStore } from '../model/liveStore';

const FLUSH_INTERVAL = 1000;

/** Держит одно WebSocket-соединение с Binance на все монеты из списка рынка. */
export function LivePricesProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createLiveStore);
  const { data: markets } = useMarketsQuery();
  const { data: pairs } = usePairsQuery();

  // Ключ-строка, чтобы не переподключаться при каждом рефетче с тем же составом монет
  const pairsKey = useMemo(() => {
    const list = (markets?.coins ?? [])
      .map((m) => pairFor(m.symbol, pairs))
      .filter((p): p is string => Boolean(p));
    return Array.from(new Set(list)).sort().join(',');
  }, [markets, pairs]);

  useEffect(() => {
    if (!pairsKey) return;
    const socket = createReconnectingSocket({
      url: miniTickerStreamUrl(pairsKey.split(',')),
      onMessage: (raw) => {
        const tick = parseMiniTicker(raw);
        if (tick) store.push(tick);
      },
      onStatus: store.setStatus,
    });
    const timer = setInterval(store.flush, FLUSH_INTERVAL);
    return () => {
      clearInterval(timer);
      socket.close();
    };
  }, [pairsKey, store]);

  return <LiveStoreContext.Provider value={store}>{children}</LiveStoreContext.Provider>;
}
