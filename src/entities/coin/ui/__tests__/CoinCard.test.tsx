import { render, screen } from '@testing-library/react';
import { CoinCard } from '../CoinCard';
import { CoinEntity } from '../../model/Coin';

const coin = new CoinEntity({
  id: 'bitcoin',
  name: 'Bitcoin',
  symbol: 'BTC',
  image: '',
  current_price: 100,
  market_cap: 1000,
  price_change_percentage_24h: 2.5,
});

test('renders coin card with price change', () => {
  render(<CoinCard coin={coin} />);
  expect(screen.getByText(/Bitcoin/)).toBeInTheDocument();
  expect(screen.getByText(/24h: 2.50%/)).toBeInTheDocument();
});
