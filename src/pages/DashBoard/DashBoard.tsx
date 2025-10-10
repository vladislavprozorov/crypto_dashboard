import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { FaRocket } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useTopCoins, useCoinHistory } from '../../features/coins/model/useCoins';
import { PriceChart, CoinsTable } from '../../shared/ui';
import CoinDropdown from '../../shared/ui/Card/CoinDropdown';
import { CoinEntity } from '../../entities/coin/model/Coin';
const TopCoinsWidget = React.lazy(() => import('../../widgets/TopCoins/TopCoinsWidget'));
import Layout from '../../app/layout/Layout';
import { Skeleton } from '../../shared/ui/Feedback';
import { Tooltip } from '../../shared/ui/Tooltip/Tooltip';
import { Toast } from '../../shared/ui/Feedback/Toast';
import { FaEthereum } from 'react-icons/fa';
import { useMetaMask } from '../../shared/lib/wallet/useMetaMask';


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
  const [toast, setToast] = useState<string | null>(null);
  const { account, connect } = useMetaMask();

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

  // Мемоизация списка монет для селектора
  const coinOptions = useMemo(() => coins ?? [], [coins]);
  // Преобразуем coins в CoinEntity
  const coinEntities = useMemo(() => (coins ?? []).map((c) => new CoinEntity(c)), [coins]);

  useEffect(() => {
    if (coins) {
      const btc = coins.find(c => c.id === 'bitcoin');
      if (btc && Math.abs(btc.price_change_percentage_24h ?? 0) > 5) {
        setToast(
          `Bitcoin изменился на ${btc.price_change_percentage_24h?.toFixed(2)}% за 24ч!`
        );
      }
    }
  }, [coins]);

  useEffect(() => {
    if (toast && typeof toast !== 'string') {
      setToast(JSON.stringify(toast));
    }
  }, [toast]);

  return (
    <Layout>
      <div className="min-h-screen bg-grid text-gray-100 p-6 space-y-8">
        {toast && <Toast message={toast} type="info" onClose={() => setToast(null)} />}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full neon-glow bg-gradient-to-br from-cyan-400/20 to-pink-400/12 flex items-center justify-center">
              <FaRocket className="text-cyan-200" />
            </div>
            <h1 className="text-4xl font-extrabold header-neon">Cyberpunk Crypto Dashboard</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* селектор монеты для графика */}
            <CoinDropdown
              coins={coinOptions}
              selectedCoin={selectedCoin}
              setSelectedCoin={setSelectedCoin}
            />

            <Tooltip text="Refresh data">
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
            </Tooltip>

            <button
              className="px-4 py-2 rounded-md neon-border text-sm text-cyan-200 hover:scale-105 transition flex items-center gap-2"
              onClick={connect}
            >
              {account ? (
                <>
                  <FaEthereum className="text-indigo-400" />
                  <span className="font-mono">{account.slice(0, 8)}...</span>
                </>
              ) : (
                'Connect Wallet'
              )}
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
          className=""
        >
          {coinsLoading
            ? [1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="p-6 rounded-2xl neon-border neon-glow h-32" />
              ))
            : (
              <Suspense fallback={<Skeleton className="p-6 rounded-2xl neon-border neon-glow h-32" />}>
                <TopCoinsWidget coins={coinEntities} />
              </Suspense>
            )}
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
       {coins && (
          <div>
            {coinsLoading ? (
              <Skeleton className="neon-border rounded-2xl p-6 h-72" />
            ) : (
              <CoinsTable coins={coins ?? []} />
            )}
          </div>
        )}
      </div> 
    </Layout>
  )
}
