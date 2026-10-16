import axios from 'axios';
import type { MarketCoin } from '../../entities/coin/model/types';
import { BINANCE_REST } from './binance';

/**
 * Запасной список рынка, когда CoinGecko недоступен (лимит 429, CORS, сеть).
 * Цены, объёмы и изменение за 24ч — из Binance; капитализации там нет,
 * поэтому порядок задаём вручную по капитализации.
 */
const FALLBACK: [id: string, symbol: string, name: string][] = [
  ['bitcoin', 'btc', 'Bitcoin'],
  ['ethereum', 'eth', 'Ethereum'],
  ['ripple', 'xrp', 'XRP'],
  ['binancecoin', 'bnb', 'BNB'],
  ['solana', 'sol', 'Solana'],
  ['usd-coin', 'usdc', 'USDC'],
  ['dogecoin', 'doge', 'Dogecoin'],
  ['tron', 'trx', 'TRON'],
  ['cardano', 'ada', 'Cardano'],
  ['chainlink', 'link', 'Chainlink'],
  ['stellar', 'xlm', 'Stellar'],
  ['sui', 'sui', 'Sui'],
  ['bitcoin-cash', 'bch', 'Bitcoin Cash'],
  ['avalanche-2', 'avax', 'Avalanche'],
  ['litecoin', 'ltc', 'Litecoin'],
  ['hedera-hashgraph', 'hbar', 'Hedera'],
  ['shiba-inu', 'shib', 'Shiba Inu'],
  ['the-open-network', 'ton', 'Toncoin'],
  ['polkadot', 'dot', 'Polkadot'],
  ['uniswap', 'uni', 'Uniswap'],
];

interface Ticker24h {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  highPrice: string;
  lowPrice: string;
  quoteVolume: string;
}

export async function fetchBinanceMarkets(): Promise<MarketCoin[]> {
  const symbols = FALLBACK.map(([, s]) => `${s.toUpperCase()}USDT`);
  const { data } = await axios.get<Ticker24h[]>(`${BINANCE_REST}/ticker/24hr`, {
    params: { symbols: JSON.stringify(symbols) },
    timeout: 15000,
  });
  const bySymbol = new Map(data.map((t) => [t.symbol, t]));
  return FALLBACK.flatMap(([id, symbol, name], i) => {
    const t = bySymbol.get(`${symbol.toUpperCase()}USDT`);
    if (!t) return [];
    const coin: MarketCoin = {
      id,
      symbol,
      name,
      image: '',
      current_price: Number(t.lastPrice),
      market_cap: Number.NaN,
      market_cap_rank: i + 1,
      total_volume: Number(t.quoteVolume),
      high_24h: Number(t.highPrice),
      low_24h: Number(t.lowPrice),
      price_change_percentage_24h: Number(t.priceChangePercent),
      circulating_supply: null,
      max_supply: null,
      ath: null,
      ath_change_percentage: null,
    };
    return [coin];
  });
}
