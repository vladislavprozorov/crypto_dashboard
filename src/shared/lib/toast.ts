import { useSyncExternalStore } from 'react';

export interface ToastItem {
  id: number;
  title: string;
  body?: string;
  tone?: 'default' | 'accent';
}

let items: ToastItem[] = [];
let seq = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function dismissToast(id: number) {
  items = items.filter((t) => t.id !== id);
  emit();
}

export function toast(t: Omit<ToastItem, 'id'>, ttl = 6000) {
  const id = ++seq;
  items = [...items, { ...t, id }].slice(-4);
  emit();
  setTimeout(() => dismissToast(id), ttl);
  return id;
}

export function useToasts() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => items,
    () => items,
  );
}
