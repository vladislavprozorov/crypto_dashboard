import type { Coin as CoinType } from '../../../types/crypto';

export class CoinEntity implements CoinType {
  readonly id: string;
  readonly name: string;
  readonly symbol: string;
  readonly image: string;
  readonly current_price: number;
  readonly market_cap: number;
  readonly market_cap_rank?: number;
  readonly price_change_percentage_24h?: number;

  constructor(data: CoinType) {
    this.id = data.id;
    this.name = data.name;
    this.symbol = data.symbol;
    this.image = data.image;
    this.current_price = data.current_price;
    this.market_cap = data.market_cap;
    this.market_cap_rank = data.market_cap_rank;
    this.price_change_percentage_24h = data.price_change_percentage_24h;
  }

  // Добавляем геттеры для более удобного доступа к данным
  get currentPrice() {
    return this.current_price;
  }

  get marketCap() {
    return this.market_cap;
  }

  get marketCapRank() {
    return this.market_cap_rank;
  }

  get priceChange24h() {
    return this.price_change_percentage_24h;
  }

  // Добавляем полезные методы
  formatPrice(): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(this.current_price);
  }

  formatPriceChange(): string {
    if (!this.price_change_percentage_24h) return 'N/A';
    return `${this.price_change_percentage_24h.toFixed(2)}%`;
  }

  formatMarketCap(): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
    }).format(this.market_cap);
  }
}
