export type TxType = 'buy' | 'sell';

/** Сделка в портфеле. Цены и комиссия — в USD. */
export interface Transaction {
  id: string;
  coinId: string;
  symbol: string;
  name: string;
  type: TxType;
  /** Количество монет, > 0 */
  amount: number;
  /** Цена за одну монету */
  price: number;
  /** Комиссия сделки в USD */
  fee: number;
  /** Время сделки, мс */
  date: number;
  note?: string;
  createdAt: number;
}

export type NewTransaction = Omit<Transaction, 'id' | 'createdAt'>;
