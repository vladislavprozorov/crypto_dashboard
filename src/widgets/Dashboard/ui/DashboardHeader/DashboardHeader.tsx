// src/widgets/Dashboard/ui/DashboardHeader/DashboardHeader.tsx
import type { FC } from 'react';
import { FaRocket, FaEthereum } from 'react-icons/fa';
import CoinDropdown from "../../../../shared/ui/Card/CoinDropdown.tsx";  // shared/ui/Card/CoinDropdown
import { Tooltip } from '../../../../shared/ui/Tooltip/Tooltip.tsx'; // shared/ui/Tooltip/Tooltip
import { DASHBOARD_CONSTANTS } from '../../../../entities/dashboard/constants'; // entities/dashboard/constants
import { CoinEntity } from '../../../../entities/coin/model/Coin.ts'; // entities/coin/model/Coin

interface DashboardHeaderProps {
  coins: CoinEntity[];
  selectedCoin: string | null;
  setSelectedCoin: (coin: string | null) => void;
  onRefresh: () => void;
  account: string | null;
  connect: () => void;
}

export const DashboardHeader: FC<DashboardHeaderProps> = ({
  coins,
  selectedCoin,
  setSelectedCoin,
  onRefresh,
  account,
  connect
}) => (
  <header className="flex items-center justify-between">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-full neon-glow bg-gradient-to-br from-cyan-400/20 to-pink-400/12 flex items-center justify-center">
        <FaRocket className="text-cyan-200" />
      </div>
      <h1 className={DASHBOARD_CONSTANTS.STYLES.HEADER}>
        Cyberpunk Crypto Dashboard
      </h1>
    </div>

    <div className="flex items-center gap-3">
      <CoinDropdown
        coins={coins}
        selectedCoin={selectedCoin}
        setSelectedCoin={setSelectedCoin}
      />

      <Tooltip text="Refresh data">
        <button
          onClick={onRefresh}
          className={DASHBOARD_CONSTANTS.STYLES.BUTTON}
        >
          Refresh
        </button>
      </Tooltip>

      <button
        className={`${DASHBOARD_CONSTANTS.STYLES.BUTTON} flex items-center gap-2`}
        onClick={connect}
      >
        {account ? (
          <>
            <FaEthereum className="text-indigo-400" />
            <span className="font-mono">
              {account.slice(0, DASHBOARD_CONSTANTS.WALLET_ADDRESS_DISPLAY_LENGTH)}...
            </span>
          </>
        ) : (
          'Connect Wallet'
        )}
      </button>
    </div>
  </header>
);