import { FaRocket } from 'react-icons/fa';
import { useCryptoData } from '../../hooks/useCryptoData';
import Card from '../../components/Card/Card';
import PriceChart from '../../components/Chart/PriceChart';
import CoinsTable from '../../components/Table/CoinsTable';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { coins, history, loading, error } = useCryptoData('bitcoin', 7);

  return (
    <div className="min-h-screen bg-grid text-gray-100 p-6 space-y-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full neon-glow bg-gradient-to-br from-cyan-400/20 to-pink-400/12 flex items-center justify-center">
            <FaRocket className="text-cyan-200" />
          </div>
          <h1 className="text-4xl font-extrabold header-neon">
            Cyberpunk Crypto Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button className="px-4 py-2 rounded-md neon-border text-sm text-cyan-200 hover:scale-105 transition">
            Connect Wallet
          </button>
        </div>
      </header>

      {error && (
        <div className="text-red-400 bg-red-900/20 p-3 rounded">{error}</div>
      )}

      {loading ? (
        <div className="text-center text-gray-400">Loading...</div>
      ) : (
        <>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.06 } },
            }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6"
          >
            {coins.slice(0, 4).map((c) => (
              <Card key={c.id} coin={c} />
            ))}
          </motion.div>

          <PriceChart
            data={history}
            title={`Bitcoin (last ${history.length} days)`}
          />

          <CoinsTable coins={coins} />
        </>
      )}
    </div>
  );
}
