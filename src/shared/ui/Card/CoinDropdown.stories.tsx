import CoinDropdown from './CoinDropdown';
import type { Coin } from '../../../types/crypto';

const coins: Coin[] = [
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', image: '', current_price: 100, market_cap: 1000 },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', image: '', current_price: 200, market_cap: 2000 },
];

export default {
  title: 'shared/ui/Card/CoinDropdown',
  component: CoinDropdown,
};

export const Default = () => (
  <CoinDropdown coins={coins} selectedCoin={null} setSelectedCoin={() => {}} />
);
