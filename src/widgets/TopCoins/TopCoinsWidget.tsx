import React, { useState } from 'react';
import { CoinEntity } from '../../entities/coin/model/Coin';
import { CoinCard } from '../../entities/coin/ui/CoinCard';

interface TopCoinsWidgetProps {
  coins: CoinEntity[];
}

export const TopCoinsWidget: React.FC<TopCoinsWidgetProps> = React.memo(({ coins }) => {
  const [order, setOrder] = useState(coins.map((c) => c.id));

  function onDragStart(e: React.DragEvent<HTMLDivElement>, id: string) {
    e.dataTransfer.setData('coinId', id);
  }
  function onDrop(e: React.DragEvent<HTMLDivElement>, targetId: string) {
    const draggedId = e.dataTransfer.getData('coinId');
    if (!draggedId || draggedId === targetId) return;
    const newOrder = order.filter((id) => id !== draggedId);
    const idx = newOrder.indexOf(targetId);
    newOrder.splice(idx, 0, draggedId);
    setOrder(newOrder);
  }
  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  const orderedCoins = order.map((id) => coins.find((c) => c.id === id)).filter(Boolean) as CoinEntity[];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
      {orderedCoins.slice(0, 4).map((coin) => (
        <div
          key={coin.id}
          draggable
          onDragStart={(e) => onDragStart(e, coin.id)}
          onDrop={(e) => onDrop(e, coin.id)}
          onDragOver={onDragOver}
          className="cursor-move"
        >
          <CoinCard coin={coin} />
        </div>
      ))}
    </div>
  );
});

export default TopCoinsWidget;
