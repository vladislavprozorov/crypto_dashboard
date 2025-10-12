import React from 'react';
import { useParams } from 'react-router-dom';
import { useCoinHistory } from '../../features/coins/model/useCoins';
import { PriceChart } from '../../shared/ui';
import { Skeleton } from '../../shared/ui/Feedback';

export default function CoinDetails() {
  const { coinId } = useParams<{ coinId: string }>();
  const { data: history, isLoading } = useCoinHistory(coinId ?? 'bitcoin', 30);

  // TODO: добавить реальные данные и API для новостей, описания, динамики

  return (
    <div className="min-h-screen bg-grid p-6 space-y-8">
      <h1 className="text-3xl font-bold header-neon mb-6">Монета: {coinId}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="neon-border rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-2 text-cyan-400">График цены (30 дней)</h2>
          {isLoading ? (
            <Skeleton className="h-80" />
          ) : (
            <PriceChart data={history ?? []} title={`${coinId} (30 days)`} />
          )}
        </div>
        <div className="neon-border rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-2 text-lime-400">Динамика и описание</h2>
          <div className="text-gray-400 mb-4">
            Здесь будет описание монеты, рыночная динамика, капитализация и другие метрики.
          </div>
          <div className="text-gray-400">
            Текущая цена:{' '}
            <span className="font-bold text-cyan-400">
              {history?.[history.length - 1]?.price ?? '—'}
            </span>
          </div>
        </div>
      </div>
      <div className="neon-border rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-2 text-pink-400">Новости</h2>
        <ul className="space-y-2">
          <li className="text-gray-400">Здесь будут новости о монете (заглушка).</li>
        </ul>
      </div>
    </div>
  );
}
