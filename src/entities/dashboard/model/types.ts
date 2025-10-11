// src/entities/dashboard/model/types.ts
import { CoinEntity } from '../../coin/model/Coin';

export interface DashboardState {
  selectedCoin: string | null;
  toast: string | null;
  coins: CoinEntity[];
  coinsLoading: boolean;
  chartLoading: boolean;
  error: string | null;
  history: any[]; // specify proper type for history
  account: string | null;
  connect: () => void;
}

export interface ToastState {
  message: string;
  type: 'info' | 'error' | 'success';
}