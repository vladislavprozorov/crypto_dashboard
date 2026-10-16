import { createContext, useContext, useSyncExternalStore } from 'react';
import { createLiveStore, type LiveStore } from './liveStore';

const fallbackStore = createLiveStore();

export const LiveStoreContext = createContext<LiveStore>(fallbackStore);

export function useLiveSnapshot() {
  const store = useContext(LiveStoreContext);
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}

export function useLiveStatus() {
  const store = useContext(LiveStoreContext);
  return useSyncExternalStore(
    store.subscribe,
    () => store.getSnapshot().status,
    () => store.getSnapshot().status,
  );
}
