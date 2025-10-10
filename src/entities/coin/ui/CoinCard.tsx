import React, { useCallback } from 'react';
import { CoinEntity } from '../model/Coin';
import { FaExternalLinkAlt, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export const CoinCard: React.FC<{ coin: CoinEntity }> = React.memo(({ coin }) => {
  const change = coin.priceChange24h ?? 0;
  const changeColor = change > 0 ? 'text-lime-400' : change < 0 ? 'text-pink-400' : 'text-gray-400';
  const changeIcon = change > 0 ? <FaArrowUp /> : change < 0 ? <FaArrowDown /> : null;
  const navigate = useNavigate();
  const handleClick = useCallback(() => {
    navigate(`/coin/${coin.id}`);
  }, [navigate, coin.id]);

  return (
    <div
      className="p-6 rounded-2xl neon-border neon-glow hover-neon transition-transform duration-200 hover:scale-105 cursor-pointer"
      onClick={handleClick}
      title="Подробнее о монете"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[rgba(255,255,255,0.03)] flex items-center justify-center ring-1 ring-cyan-300/20">
            <img src={coin.image} alt={coin.name} className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-cyan-100">{coin.name}</h3>
            <div className="text-xs text-gray-400 uppercase">{coin.symbol}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-extrabold text-lime-400">
            ${coin.currentPrice.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">MC ${coin.marketCap.toLocaleString()}</div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
        <div className={`flex items-center gap-2 ${changeColor}`}>
          {changeIcon}
          <span>
            24h: {change ? `${change.toFixed(2)}%` : '—'}
          </span>
        </div>
        <button
          className="flex items-center gap-2 px-3 py-1 rounded bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.03)] text-cyan-200"
          onClick={() => window.open(`https://www.coingecko.com/en/coins/${coin.id}`, '_blank')}
        >
          <FaExternalLinkAlt className="w-3 h-3" />
          View
        </button>
      </div>
    </div>
  );
});
