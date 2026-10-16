import type { Transaction } from '../../../entities/transaction/model/types';

/** Хранилище сделок. Интерфейс отделён от IndexedDB, чтобы логику можно было тестировать в памяти. */
export interface TransactionRepo {
  getAll(): Promise<Transaction[]>;
  put(tx: Transaction): Promise<void>;
  remove(id: string): Promise<void>;
  /** Атомарно заменить все сделки (импорт) */
  replaceAll(txs: Transaction[]): Promise<void>;
}

export function createMemoryRepo(initial: Transaction[] = []): TransactionRepo {
  const data = new Map(initial.map((t) => [t.id, t]));
  return {
    getAll: async () => [...data.values()],
    put: async (tx) => void data.set(tx.id, tx),
    remove: async (id) => void data.delete(id),
    replaceAll: async (txs) => {
      data.clear();
      txs.forEach((t) => data.set(t.id, t));
    },
  };
}

const DB_NAME = 'crypto-dashboard';
const DB_VERSION = 1;
const STORE = 'transactions';

function promisify<T>(req: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function done(tx: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'));
  });
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('date', 'date');
        store.createIndex('coinId', 'coinId');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('IndexedDB заблокирована другой вкладкой'));
  });
}

export function createIndexedDbRepo(): TransactionRepo {
  let dbPromise: Promise<IDBDatabase> | null = null;
  const db = () => (dbPromise ??= openDb());

  return {
    async getAll() {
      const d = await db();
      return promisify(d.transaction(STORE, 'readonly').objectStore(STORE).getAll());
    },
    async put(item) {
      const tx = (await db()).transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(item);
      await done(tx);
    },
    async remove(id) {
      const tx = (await db()).transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(id);
      await done(tx);
    },
    async replaceAll(items) {
      const tx = (await db()).transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      store.clear();
      items.forEach((i) => store.put(i));
      await done(tx);
    },
  };
}

/** IndexedDB, если есть (в приватных режимах и jsdom её может не быть), иначе — память. */
export function createDefaultRepo(): TransactionRepo {
  return typeof indexedDB !== 'undefined' ? createIndexedDbRepo() : createMemoryRepo();
}
