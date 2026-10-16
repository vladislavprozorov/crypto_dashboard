import { describe, expect, test, vi } from 'vitest';
import type { NewTransaction } from '../../../../entities/transaction/model/types';
import { buildDemo } from '../demo';
import { createMemoryRepo, type TransactionRepo } from '../repo';
import { createPortfolioStore } from '../store';
import { computeHoldings } from '../calc';

const input: NewTransaction = {
  coinId: 'bitcoin',
  symbol: 'btc',
  name: 'Bitcoin',
  type: 'buy',
  amount: 1,
  price: 100,
  fee: 0,
  date: 1,
};

const channel = () => ({ postMessage: vi.fn(), onmessage: null, close: vi.fn() });

describe('createPortfolioStore', () => {
  test('загружается при первой подписке и сохраняет сделки в репозиторий', async () => {
    const repo = createMemoryRepo();
    const ch = channel();
    const store = createPortfolioStore(repo, ch);
    store.subscribe(() => {});
    await vi.waitFor(() => expect(store.getSnapshot().status).toBe('ready'));

    const tx = await store.add(input);
    expect(store.getSnapshot().txs).toEqual([tx]);
    expect(await repo.getAll()).toEqual([tx]);
    expect(ch.postMessage).toHaveBeenCalledWith('changed');

    await store.update({ ...tx, amount: 2 });
    expect((await repo.getAll())[0].amount).toBe(2);
    await store.remove(tx.id);
    expect(await repo.getAll()).toEqual([]);
  });

  test('при ошибке записи откатывает оптимистичное изменение', async () => {
    const failing: TransactionRepo = {
      ...createMemoryRepo(),
      put: () => Promise.reject(new Error('QuotaExceededError')),
    };
    const store = createPortfolioStore(failing);
    await store.load();
    await expect(store.add(input)).rejects.toThrow('QuotaExceededError');
    expect(store.getSnapshot()).toMatchObject({ txs: [], error: 'QuotaExceededError' });
  });

  test('сообщение из другой вкладки перечитывает данные', async () => {
    const repo = createMemoryRepo();
    const ch = channel();
    const store = createPortfolioStore(repo, ch);
    await store.load();
    await repo.put({ ...input, id: 'from-other-tab', createdAt: 1 });
    (ch.onmessage as unknown as () => void)();
    await vi.waitFor(() => expect(store.getSnapshot().txs).toHaveLength(1));
  });
});

test('buildDemo: сделки по ценам на свою дату и без продаж сверх остатка', () => {
  const now = Date.UTC(2026, 9, 15);
  const day = 24 * 3600_000;
  const series = (base: number) =>
    Array.from({ length: 200 }, (_, i) => ({ t: now - (200 - i) * day, price: base + i }));
  const txs = buildDemo(
    {
      bitcoin: series(60000),
      ethereum: series(2000),
      solana: series(100),
      chainlink: series(10),
      ripple: series(1),
    },
    now,
  );
  expect(txs.length).toBeGreaterThanOrEqual(8);
  expect(computeHoldings(txs).issues).toEqual([]);
  expect(txs.every((t) => t.date < now && t.price > 0 && t.amount > 0)).toBe(true);
});
