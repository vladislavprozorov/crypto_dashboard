import { render, screen, fireEvent } from '@testing-library/react';
import CoinsTable from '../CoinsTable';
import type { Coin } from '../../../types/crypto';

const coins: Coin[] = [
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', image: '', current_price: 100, market_cap: 1000 },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', image: '', current_price: 200, market_cap: 2000 },
];

test('renders coins table', () => {
  render(<CoinsTable coins={coins} />);
  expect(screen.getByText(/Bitcoin/)).toBeInTheDocument();
  expect(screen.getByText(/Ethereum/)).toBeInTheDocument();
});

test('sorts by price', () => {
  render(<CoinsTable coins={coins} />);
  fireEvent.click(screen.getByText(/Price/));
  expect(screen.getAllByText(/\$/)[0]).toHaveTextContent('$100');
});

test('filters coins by search', () => {
  render(<CoinsTable coins={coins} />);
  fireEvent.change(screen.getByPlaceholderText(/Поиск/), { target: { value: 'eth' } });
  expect(screen.getByText(/Ethereum/)).toBeInTheDocument();
  expect(screen.queryByText(/Bitcoin/)).not.toBeInTheDocument();
});

test('handles empty coins array', () => {
  render(<CoinsTable coins={[]} />);
  expect(screen.queryByText(/Bitcoin/)).not.toBeInTheDocument();
});
  expect(screen.getAllByTitle(/Убрать из избранного/)[0]).toBeInTheDocument();
});

test('handles empty coins array', () => {
  render(<CoinsTable coins={[]} />);
  expect(screen.queryByText(/Bitcoin/)).not.toBeInTheDocument();
});
