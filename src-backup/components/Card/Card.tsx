import { motion } from 'framer-motion';
import type { Coin } from '../../types/crypto';
import { FaExternalLinkAlt } from 'react-icons/fa';

export default function Card({ coin }: { coin: Coin }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="p-6 rounded-2xl neon-border neon-glow hover-neon transition-transform"
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
            ${coin.current_price.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">MC ${coin.market_cap.toLocaleString()}</div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-indigo-400/60" />
          <span>24h Vol</span>
        </div>

        <button
          className="flex items-center gap-2 px-3 py-1 rounded bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.03)] text-cyan-200"
          onClick={() => window.open(`https://www.coingecko.com/en/coins/${coin.id}`, '_blank')}
        >
          <FaExternalLinkAlt className="w-3 h-3" />
          View
        </button>
      </div>
    </motion.div>
  );
}
