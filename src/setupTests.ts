import '@testing-library/jest-dom';

// Node 25 объявляет собственный экспериментальный localStorage, который перекрывает
// хранилище jsdom и без --localstorage-file не работает. Подменяем простым in-memory.
if (typeof globalThis.localStorage?.clear !== 'function') {
  const data = new Map<string, string>();
  const storage: Storage = {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => Array.from(data.keys())[i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, String(v)),
  };
  Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true });
}
