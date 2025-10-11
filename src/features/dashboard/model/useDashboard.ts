// src/features/dashboard/model/useDashboard.ts
import { useState, useEffect, useMemo } from 'react';
import { useTopCoins, useCoinHistory } from '../../../features/coins/model/useCoins';
import type { DashboardState } from '../../../entities/dashboard/model/types';
import { DASHBOARD_CONSTANTS } from '../../../entities/dashboard/constants'; //entities/dashboard/constants
import { CoinEntity } from '../../../entities/coin/model/Coin'; // entities/coin/model/Coin
import { useMetaMask } from '../../../shared/lib/wallet/useMetaMask'; // shared/lib/wallet/useMetaMask

export const useDashboard = (): DashboardState & {
  setSelectedCoin: (coin: string | null) => void;
  setToast: (toast: string | null) => void;
  refetchData: () => void;
} => {
  const [selectedCoin, setSelectedCoin] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const { account, connect } = useMetaMask();

  const {
    data: coins,
    isLoading: coinsLoading,
    isError: coinsError,
    error: coinsErrorObj,
    refetch: refetchCoins,
  } = useTopCoins();

  const {
    data: history,
    isLoading: historyLoading,
    isError: historyError,
    refetch: refetchHistory,
  } = useCoinHistory(selectedCoin ?? 'bitcoin', 7);

  const chartLoading = historyLoading || false;
  const error = coinsError
    ? (coinsErrorObj as Error).message
    : historyError
      ? 'History fetch error'
      : null;

  const coinEntities = useMemo(
    () => (coins ?? []).map((c) => new CoinEntity(c)),
    [coins]
  );

  useEffect(() => {
    if (!selectedCoin && coins && coins.length > 0) {
      setSelectedCoin(coins[0].id);
    }
  }, [coins, selectedCoin]);

  useEffect(() => {
    if (coins) {
      const btc = coins.find(c => c.id === 'bitcoin');
      if (btc && Math.abs(btc.price_change_percentage_24h ?? 0) > DASHBOARD_CONSTANTS.BITCOIN_PRICE_THRESHOLD) {
        setToast(
          `Bitcoin изменился на ${btc.price_change_percentage_24h?.toFixed(2)}% за 24ч!`
        );
      }
    }
  }, [coins]);

  const refetchData = () => {
    refetchCoins();
    refetchHistory();
  };

  return {
    selectedCoin,
    setSelectedCoin,
    toast,
    setToast,
    coins: coinEntities,
    coinsLoading,
    chartLoading,
    error,
    history: history ?? [],
    account,
    connect,
    refetchData
  };
};