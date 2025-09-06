import { useEffect, useState } from 'react';
import { FaRocket } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useTopCoins, useCoinHistory } from '../../features/coins/model/useCoins';
import Card from '../../components/Card/Card';
import PriceChart from '../../components/Chart/PriceChart';
import CoinsTable from '../../components/Table/CoinsTable';

/**
 * Dashboard — теперь использует react-query хуки напрямую.
 * Поддерживает выбор монеты для графика и отдельные loading states.
 */

export default function Dashboard() {
  // top coins (список)
  const {
    data: coins,
    isLoading: coinsLoading,
    isError: coinsError,
    error: coinsErrorObj,
    refetch: refetchCoins,
  } = useTopCoins();

  // состояние выбранной монеты для графика (id)
  const [selectedCoin, setSelectedCoin] = useState<string | null>(null);

  // когда coins загрузятся — по умолчанию выбираем первую (если нет выбора)
  useEffect(() => {
    if (!selectedCoin && coins && coins.length > 0) {
      setSelectedCoin(coins[0].id);
    }
  }, [coins, selectedCoin]);

  // история выбранной монеты
  const {
    data: history,
    isLoading: historyLoading,
    isError: historyError,
    refetch: refetchHistory,
  } = useCoinHistory(selectedCoin ?? 'bitcoin', 7);

  // удобные флаги
  // const loading = coinsLoading || false;
  const chartLoading = historyLoading || false;
  const error = coinsError
    ? (coinsErrorObj as Error).message
    : historyError
      ? 'History fetch error'
      : null;

  return (
    <div className="min-h-screen bg-grid text-gray-100 p-6 space-y-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full neon-glow bg-gradient-to-br from-cyan-400/20 to-pink-400/12 flex items-center justify-center">
            <FaRocket className="text-cyan-200" />
          </div>
          <h1 className="text-4xl font-extrabold header-neon">Cyberpunk Crypto Dashboard</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* селектор монеты для графика */}
          <select
            value={selectedCoin ?? ''}
            onChange={(e) => setSelectedCoin(e.target.value)}
            className="bg-[rgba(255,255,255,0.02)] text-sm rounded px-3 py-2 neon-border"
          >
            {/* если данные еще не пришли — покажем placeholder */}
            {!coins && <option value="">Loading...</option>}
            {coins &&
              coins.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>

          <button
            onClick={() => {
              // обновить оба набора данных
              refetchCoins();
              refetchHistory();
            }}
            className="px-4 py-2 rounded-md neon-border text-sm text-cyan-200 hover:scale-105 transition"
          >
            Refresh
          </button>

          <button className="px-4 py-2 rounded-md neon-border text-sm text-cyan-200 hover:scale-105 transition">
            Connect Wallet
          </button>
        </div>
      </header>

      {/* Общие ошибки */}
      {error && <div className="text-red-400 bg-red-900/20 p-3 rounded">{error}</div>}

      {/* Карточки: показываем skeleton'ы если coinsLoading */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.06 } },
        }}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6"
      >
        {coinsLoading
          ? // 4 skeleton'а
            [1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-6 rounded-2xl neon-border neon-glow bg-[rgba(255,255,255,0.02)] animate-pulse"
              >
                <div className="h-6 bg-white/10 rounded w-1/3 mb-3" />
                <div className="h-8 bg-white/5 rounded w-2/3 mb-4" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
              </div>
            ))
          : coins?.slice(0, 4).map((c) => <Card key={c.id} coin={c} />)}
      </motion.div>

      {/* График: если historyLoading показываем placeholder, иначе реальный график */}
      <div className="neon-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-pink-400">
            {selectedCoin ? `History — ${selectedCoin}` : 'History'}
          </h2>
          <div className="text-sm text-gray-400">
            {chartLoading ? 'Updating...' : `Showing last ${history?.length ?? 0} days`}
          </div>
        </div>

        {chartLoading ? (
          <div className="h-80 flex items-center justify-center text-gray-400">
            Loading chart...
          </div>
        ) : (
          <PriceChart
            data={history ?? []}
            title={`${selectedCoin ?? 'Bitcoin'} (last ${history?.length ?? 7} days)`}
          />
        )}
      </div>

      {/* Таблица: покажем coins (если есть) */}
      <div>
        {coinsLoading ? (
          <div className="neon-border rounded-2xl p-6 animate-pulse">
            <div className="h-6 bg-white/10 rounded w-1/4 mb-4" />
            <div className="h-64 bg-white/5 rounded" />
          </div>
        ) : (
          <CoinsTable coins={coins ?? []} />
        )}
      </div>
    </div>
  );
}
