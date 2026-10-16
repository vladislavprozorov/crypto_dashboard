import { useCallback, useSyncExternalStore } from 'react';

/**
 * Состояние в localStorage, общее для всех компонентов и вкладок.
 * Внутри — useSyncExternalStore: компоненты подписываются на ключ,
 * изменения из других вкладок приходят через событие `storage`.
 */

const LOCAL_EVENT = 'stored-state';
const cache = new Map<string, { raw: string | null; value: unknown }>();

function read<T>(key: string, fallback: T): T {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    return fallback;
  }
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.value as T;
  let value: T = fallback;
  if (raw != null) {
    try {
      value = JSON.parse(raw) as T;
    } catch {
      value = fallback;
    }
  }
  cache.set(key, { raw, value });
  return value;
}

export function writeStored<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // приватный режим или переполнение — состояние просто не сохранится
  }
  window.dispatchEvent(new CustomEvent(LOCAL_EVENT, { detail: key }));
}

function subscribe(key: string, onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === key) onChange();
  };
  const onLocal = (e: Event) => {
    if ((e as CustomEvent<string>).detail === key) onChange();
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener(LOCAL_EVENT, onLocal);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(LOCAL_EVENT, onLocal);
  };
}

export function readStored<T>(key: string, fallback: T): T {
  return read(key, fallback);
}

export function useStoredState<T>(key: string, fallback: T) {
  const value = useSyncExternalStore(
    useCallback((cb) => subscribe(key, cb), [key]),
    () => read(key, fallback),
    () => fallback,
  );

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = read(key, fallback);
      const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
      writeStored(key, resolved);
    },
    // fallback намеренно не в зависимостях: это значение по умолчанию, а не состояние
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );

  return [value, setValue] as const;
}
