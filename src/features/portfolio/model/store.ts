import { useSyncExternalStore } from 'react';
import type { NewTransaction, Transaction } from '../../../entities/transaction/model/types';
import { createDefaultRepo, type TransactionRepo } from './repo';

export interface PortfolioState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  txs: Transaction[];
  error: string | null;
}

interface Channel {
  postMessage(msg: unknown): void;
  onmessage: ((e: MessageEvent) => void) | null;
  close(): void;
}

export function newTxId(now = Date.now()) {
  return `tx-${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Стор портфеля: держит сделки в памяти для мгновенного UI, пишет в репозиторий
 * (IndexedDB) и сообщает другим вкладкам через BroadcastChannel, чтобы они перечитали данные.
 */
export function createPortfolioStore(repo: TransactionRepo, channel?: Channel | null) {
  let state: PortfolioState = { status: 'idle', txs: [], error: null };
  const listeners = new Set<() => void>();
  const set = (patch: Partial<PortfolioState>) => {
    state = { ...state, ...patch };
    listeners.forEach((l) => l());
  };

  async function load() {
    if (state.status === 'idle') set({ status: 'loading' });
    try {
      set({ txs: await repo.getAll(), status: 'ready', error: null });
    } catch (e) {
      set({ status: 'error', error: e instanceof Error ? e.message : String(e) });
    }
  }

  if (channel) channel.onmessage = () => void load();
  const notify = () => channel?.postMessage('changed');

  /** Оптимистичное обновление: UI меняется сразу, при ошибке записи откатываемся. */
  async function mutate(next: Transaction[], write: () => Promise<void>) {
    const prev = state.txs;
    set({ txs: next });
    try {
      await write();
      notify();
    } catch (e) {
      set({ txs: prev, error: e instanceof Error ? e.message : String(e) });
      throw e;
    }
  }

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      if (state.status === 'idle') void load();
      return () => listeners.delete(listener);
    },
    getSnapshot: () => state,
    load,
    async add(input: NewTransaction) {
      const tx: Transaction = { ...input, id: newTxId(), createdAt: Date.now() };
      await mutate([...state.txs, tx], () => repo.put(tx));
      return tx;
    },
    async update(tx: Transaction) {
      await mutate(
        state.txs.map((t) => (t.id === tx.id ? tx : t)),
        () => repo.put(tx),
      );
    },
    async remove(id: string) {
      await mutate(
        state.txs.filter((t) => t.id !== id),
        () => repo.remove(id),
      );
    },
    async replaceAll(txs: Transaction[]) {
      await mutate(txs, () => repo.replaceAll(txs));
    },
  };
}

export type PortfolioStore = ReturnType<typeof createPortfolioStore>;

let defaultStore: PortfolioStore | null = null;

export function getPortfolioStore() {
  if (!defaultStore) {
    const channel =
      typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('portfolio') : null;
    defaultStore = createPortfolioStore(createDefaultRepo(), channel);
  }
  return defaultStore;
}

export function usePortfolio() {
  const store = getPortfolioStore();
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  return { ...state, store };
}
