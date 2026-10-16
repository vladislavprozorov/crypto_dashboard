import { beforeEach, expect, test } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { Coin } from '../../../../entities/coin/model/types';
import { getPortfolioStore } from '../../model/store';
import { TransactionForm } from '../TransactionForm';

const coin = {
  id: 'bitcoin',
  symbol: 'btc',
  name: 'Bitcoin',
  current_price: 80000,
  market_cap_rank: 1,
} as Coin;

beforeEach(async () => {
  await act(() => getPortfolioStore().replaceAll([]));
});

test('добавляет покупку и не даёт продать больше, чем есть', async () => {
  render(<TransactionForm coins={[coin]} />);
  await waitFor(() => expect(getPortfolioStore().getSnapshot().status).toBe('ready'));

  // цена подставляется текущая
  expect(screen.getByLabelText('Цена, USD')).toHaveValue('80000.00');

  fireEvent.change(screen.getByLabelText('Количество'), { target: { value: '0,5' } });
  expect(screen.getByText(/Итого: \$40/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Добавить покупку' }));
  await waitFor(() => expect(getPortfolioStore().getSnapshot().txs).toHaveLength(1));
  expect(getPortfolioStore().getSnapshot().txs[0]).toMatchObject({ type: 'buy', amount: 0.5 });

  fireEvent.click(screen.getByRole('radio', { name: 'Продажа' }));
  expect(screen.getByText(/Доступно: 0.5 BTC/)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Количество'), { target: { value: '2' } });
  fireEvent.click(screen.getByRole('button', { name: 'Добавить продажу' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('только 0.5 BTC');
  expect(getPortfolioStore().getSnapshot().txs).toHaveLength(1);
});

test('валидирует пустое количество', async () => {
  render(<TransactionForm coins={[coin]} />);
  fireEvent.click(screen.getByRole('button', { name: 'Добавить покупку' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('больше нуля');
});
