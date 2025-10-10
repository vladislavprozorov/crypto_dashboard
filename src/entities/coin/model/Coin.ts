import type { Coin as CoinType } from '../../../types/crypto';

export class CoinEntity {
  constructor(public data: CoinType) {}

  get id() {
    return this.data.id;
  }
  get name() {
    return this.data.name;
  }
  get symbol() {
    return this.data.symbol;
  }
  get image() {
    return this.data.image;
  }
  get currentPrice() {
    return this.data.current_price;
  }
  get marketCap() {
    return this.data.market_cap;
  }
  get marketCapRank() {
    return this.data.market_cap_rank;
  }
  get priceChange24h() {
    return this.data.price_change_percentage_24h;
  }
}
