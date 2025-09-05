import { useEffect, useState } from 'react';
import { getTopCoins, getCoinHistory } from '../api/crypto';
import type { Coin, PricePoint } from '../types/crypto';

export function useCryptoData(selectedCoin = 'bitcoin', days = 7) {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [history, setHistory] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([getTopCoins(), getCoinHistory(selectedCoin, days)])
      .then(([coinsData, historyData]) => {
        if (!mounted) return;
        setCoins(coinsData || []);
        const formatted = (historyData.prices || []).map((p: number[]) => ({
          date: new Date(p[0]).toLocaleDateString(),
          price: p[1],
        }));
        setHistory(formatted);
      })
      .catch((e) => {
        if (!mounted) return;
        setError(String(e));
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [selectedCoin, days]);

  return { coins, history, loading, error };
}
