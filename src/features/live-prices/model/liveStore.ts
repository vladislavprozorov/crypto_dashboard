import type { MiniTicker } from '../../../shared/api/binance';
import type { SocketStatus } from '../../../shared/lib/ws/createReconnectingSocket';

export interface LiveSnapshot {
  ticks: Readonly<Record<string, MiniTicker>>;
  status: SocketStatus | 'idle';
  /** Серверное время последнего тика (Binance) — для подписи и графика */
  lastTickAt: number | null;
  /** Локальное время получения последнего тика — для проверки «поток жив»,
   *  не зависит от того, верно ли выставлены часы у пользователя */
  receivedAt: number | null;
}

/**
 * Хранилище live-тиков вне React. Тики копятся в буфере и публикуются
 * пачкой по `flush()` — интерфейс перерисовывается раз в секунду,
 * а не на каждое из десятков сообщений в секунду.
 */
export function createLiveStore() {
  let snapshot: LiveSnapshot = { ticks: {}, status: 'idle', lastTickAt: null, receivedAt: null };
  let pending: Record<string, MiniTicker> = {};
  let dirty = false;
  const listeners = new Set<() => void>();

  const emit = () => listeners.forEach((l) => l());

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => snapshot,
    push(tick: MiniTicker) {
      pending[tick.pair] = tick;
      dirty = true;
    },
    flush() {
      if (!dirty) return;
      let lastTickAt = snapshot.lastTickAt ?? 0;
      for (const t of Object.values(pending)) lastTickAt = Math.max(lastTickAt, t.time);
      snapshot = {
        ...snapshot,
        ticks: { ...snapshot.ticks, ...pending },
        lastTickAt,
        receivedAt: Date.now(),
      };
      pending = {};
      dirty = false;
      emit();
    },
    setStatus(status: LiveSnapshot['status']) {
      if (snapshot.status === status) return;
      snapshot = { ...snapshot, status };
      emit();
    },
  };
}

export type LiveStore = ReturnType<typeof createLiveStore>;
