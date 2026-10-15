/** Монета из /coins/markets CoinGecko (только используемые поля). */
export interface MarketCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number | null;
  total_volume: number;
  high_24h: number | null;
  low_24h: number | null;
  price_change_percentage_24h: number | null;
  price_change_percentage_24h_in_currency?: number | null;
  price_change_percentage_7d_in_currency?: number | null;
  circulating_supply: number | null;
  max_supply: number | null;
  ath: number | null;
  ath_change_percentage: number | null;
  sparkline_in_7d?: { price: number[] };
}

/** Монета с наложенной live-ценой из WebSocket. */
export interface Coin extends MarketCoin {
  change24h: number | null;
  change7d: number | null;
  /** Тикер пары на Binance (BTCUSDT) или null, если пары нет */
  pair: string | null;
  /** Время последнего live-тика, если он был */
  liveAt: number | null;
}

export interface PricePoint {
  t: number;
  price: number;
}

export interface CoinProfile {
  id: string;
  description: string;
  homepage: string | null;
  genesisDate: string | null;
  categories: string[];
}
