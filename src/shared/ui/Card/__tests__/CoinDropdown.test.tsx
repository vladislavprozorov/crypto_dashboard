import { render, screen, fireEvent } from '@testing-library/react';
import CoinDropdown from '../CoinDropdown';
import type { Coin } from '../../../types/crypto';

const coins: Coin[] = [
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC',
    image: '',
    current_price: 100,
    market_cap: 1000,
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    image: '',
    current_price: 200,
    market_cap: 2000,
  },
];

test('search and select coin', () => {
  let selected: string | null = null;
  render(
    <CoinDropdown
      coins={coins}
      selectedCoin={selected}
      setSelectedCoin={(id) => (selected = id)}
    />,
  );
  fireEvent.click(screen.getByRole('button'));
  fireEvent.change(screen.getByPlaceholderText(/Поиск/), { target: { value: 'eth' } });
  fireEvent.click(screen.getByText(/Ethereum/));
  expect(selected).toBe('ethereum');
});

test('shows "Нет результатов" for unknown coin', () => {
  render(<CoinDropdown coins={coins} selectedCoin={null} setSelectedCoin={() => {}} />);
  fireEvent.click(screen.getByRole('button'));
  fireEvent.change(screen.getByPlaceholderText(/Поиск/), { target: { value: 'doge' } });
  expect(screen.getByText(/Нет результатов/)).toBeInTheDocument();
});

test('handles empty coins array', () => {
  render(<CoinDropdown coins={[]} selectedCoin={null} setSelectedCoin={() => {}} />);
  fireEvent.click(screen.getByRole('button'));
  expect(screen.getByText(/Нет результатов/)).toBeInTheDocument();
});
