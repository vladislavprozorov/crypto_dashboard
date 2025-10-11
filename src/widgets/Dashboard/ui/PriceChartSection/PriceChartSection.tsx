import type { FC } from 'react';
import { PriceChart } from '../../../../shared/ui'; // shared/ui
import { DASHBOARD_CONSTANTS } from '../../../../entities/dashboard/constants'; // entities/dashboard/constants

interface PriceChartSectionProps {
  selectedCoin: string | null;
  chartLoading: boolean;
  history: any[]; // уточните тип
}

export const PriceChartSection: FC<PriceChartSectionProps> = ({
  selectedCoin,
  chartLoading,
  history
}) => (
  <div className={DASHBOARD_CONSTANTS.STYLES.CONTAINER}>
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
        data={history}
        title={`${selectedCoin ?? 'Bitcoin'} (last ${history?.length ?? 7} days)`}
      />
    )}
  </div>
);