import { Suspense } from "react";
import Layout from "../../app/layout/Layout";
import { DASHBOARD_CONSTANTS } from "../../entities/dashboard/constants";
import { useDashboard } from "../../features/dashboard/model/useDashboard";
import { Skeleton } from "../../shared/ui/Feedback";
import { Toast } from "../../shared/ui/Feedback/Toast";
import { DashboardHeader } from "../../widgets/Dashboard/ui/DashboardHeader/DashboardHeader";
import { motion } from 'framer-motion';
import { TopCoinsWidget } from "../../widgets/TopCoins";
import { PriceChartSection } from "../../widgets/Dashboard/ui/PriceChartSection/PriceChartSection";
import { CoinsTable } from "../../shared/ui";


export default function Dashboard() {
  const {
    selectedCoin,
    setSelectedCoin,
    toast,
    setToast,
    coins,
    coinsLoading,
    chartLoading,
    error,
    history,
    account,
    connect,
    refetchData
  } = useDashboard();

  return (
    <Layout>
      <div className="min-h-screen bg-grid text-gray-100 p-6 space-y-8">
        {toast && <Toast message={toast} type="info" onClose={() => setToast(null)} />}
        
        <DashboardHeader
          coins={coins}
          selectedCoin={selectedCoin}
          setSelectedCoin={setSelectedCoin}
          onRefresh={refetchData}
          account={account}
          connect={connect}
        />

        {error && <div className="text-red-400 bg-red-900/20 p-3 rounded">{error}</div>}

        <motion.div
          initial="hidden"
          animate="visible"
          variants={DASHBOARD_CONSTANTS.MOTION_VARIANTS}
          className=""
        >
          {coinsLoading ? (
            Array(DASHBOARD_CONSTANTS.SKELETON_ITEMS_COUNT)
              .fill(null)
              .map((_, i) => (
                <Skeleton key={i} className={DASHBOARD_CONSTANTS.STYLES.SKELETON} />
              ))
          ) : (
            <Suspense fallback={<Skeleton className={DASHBOARD_CONSTANTS.STYLES.SKELETON} />}>
              <TopCoinsWidget coins={coins} />
            </Suspense>
          )}
        </motion.div>

        <PriceChartSection
          selectedCoin={selectedCoin}
          chartLoading={chartLoading}
          history={history}
        />

        {coins && (
          <div>
            {coinsLoading ? (
              <Skeleton className="neon-border rounded-2xl p-6 h-72" />
            ) : (
              <CoinsTable coins={coins} />
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}