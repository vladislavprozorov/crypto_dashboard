import React, { useEffect, useState, useMemo } from 'react';
import { useTopCoins } from '../../features/coins/model/useCoins';
import { CoinsTable } from '../../shared/ui';

export default function Favorites() {
  const { data: coins, isLoading } = useTopCoins();
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    setFavorites(JSON.parse(localStorage.getItem('favoriteCoins') ?? '[]'));
  }, []);

  const favoriteCoins = useMemo(
    () => (coins ?? []).filter((c) => favorites.includes(c.id)),
    [coins, favorites]
  );

  return (
    <div className="min-h-screen bg-grid p-6">
      <h1 className="text-3xl font-bold header-neon mb-6">⭐ Избранные монеты</h1>
      {isLoading ? (
        <div className="text-gray-400">Загрузка...</div>
      ) : favoriteCoins.length === 0 ? (
        <div className="text-gray-400">Нет избранных монет.</div>
      ) : (
        <CoinsTable coins={favoriteCoins} />
      )}
    </div>
  );
}
