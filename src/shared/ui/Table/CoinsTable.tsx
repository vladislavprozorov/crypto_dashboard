import React, { useState, useEffect, useMemo } from 'react';
import type { Coin } from '../../../types/crypto';
import { FaStar, FaRegStar, FaDownload, FaFilePdf } from 'react-icons/fa';

interface CoinsTableProps {
  coins: Coin[];
}

type SortKey = 'current_price' | 'market_cap' | 'name';

function exportCSV(data: Coin[]) {
  const header = ['Name', 'Symbol', 'Price', 'Market Cap'];
  const rows = data.map((c) => [c.name, c.symbol, c.current_price, c.market_cap]);
  const csv = [header, ...rows].map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'coins.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function exportPDF(data: Coin[]) {
  // динамический импорт, чтобы не тянуть это в основной бандл
  import('jspdf').then(({ default: jsPDF }) =>
    import('jspdf-autotable').then(({ default: autoTable }) => {
      const doc = new jsPDF();
      doc.text('Coins Table', 10, 10);
      const rows = data.map((c, i) => [i + 1, c.name, c.symbol, c.current_price, c.market_cap]);

      // вызвать функцию напрямую, передав doc
      autoTable(doc, {
        head: [['#', 'Name', 'Symbol', 'Price', 'Market Cap']],
        body: rows,
        startY: 20,
      });

      doc.save('coins.pdf');
    }),
  );
}

const CoinsTable: React.FC<CoinsTableProps> = React.memo(({ coins }) => {
  const [sortKey, setSortKey] = useState<SortKey>('market_cap');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavOnly, setShowFavOnly] = useState(false);

  useEffect(() => {
    setFavorites(JSON.parse(localStorage.getItem('favoriteCoins') ?? '[]'));
  }, []);

  useEffect(() => {
    localStorage.setItem('favoriteCoins', JSON.stringify(favorites));
  }, [favorites]);

  function toggleFavorite(id: string) {
    setFavorites((favs) => (favs.includes(id) ? favs.filter((f) => f !== id) : [...favs, id]));
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  const filteredCoins = useMemo(() => {
    let result = coins.filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.symbol.toLowerCase().includes(search.toLowerCase()),
    );
    if (showFavOnly) result = result.filter((c) => favorites.includes(c.id));
    return result;
  }, [coins, search, showFavOnly, favorites]);

  const sortedCoins = useMemo(() => {
    return [...filteredCoins].sort((a, b) => {
      if (sortKey === 'name') {
        return sortDir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      return sortDir === 'asc'
        ? (a[sortKey] as number) - (b[sortKey] as number)
        : (b[sortKey] as number) - (a[sortKey] as number);
    });
  }, [filteredCoins, sortKey, sortDir]);

  return (
    <div
      className="neon-border rounded-2xl shadow-lg p-6 overflow-x-auto"
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.18))',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-purple-300">🏆 Top 10 Coins</h2>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск..."
            className="px-3 py-2 rounded bg-gray-800 text-gray-200 neon-border"
          />
          <button
            className={`px-3 py-2 rounded neon-border flex items-center gap-2 ${showFavOnly ? 'bg-yellow-400 text-black' : 'bg-cyan-900 text-cyan-200'}`}
            onClick={() => setShowFavOnly((v) => !v)}
            title="Показать только избранные"
          >
            <FaStar />
            Fav
          </button>
          <button
            className="px-3 py-2 rounded neon-border bg-cyan-900 text-cyan-200 flex items-center gap-2"
            onClick={() => exportCSV(sortedCoins)}
            title="Экспорт в CSV"
          >
            <FaDownload />
            CSV
          </button>
          <button
            className="px-3 py-2 rounded neon-border bg-pink-900 text-pink-200 flex items-center gap-2"
            onClick={() => exportPDF(sortedCoins)}
            title="Экспорт в PDF"
          >
            <FaFilePdf />
            PDF
          </button>
        </div>
      </div>
      <table className="w-full table-auto">
        <thead>
          <tr className="border-b border-gray-700/40 text-cyan-200">
            <th className="p-3 text-left">#</th>
            <th className="p-3 text-left cursor-pointer" onClick={() => handleSort('name')}>
              Name {sortKey === 'name' && (sortDir === 'asc' ? '▲' : '▼')}
            </th>
            <th
              className="p-3 text-left cursor-pointer"
              onClick={() => handleSort('current_price')}
            >
              Price {sortKey === 'current_price' && (sortDir === 'asc' ? '▲' : '▼')}
            </th>
            <th className="p-3 text-left cursor-pointer" onClick={() => handleSort('market_cap')}>
              Market Cap {sortKey === 'market_cap' && (sortDir === 'asc' ? '▲' : '▼')}
            </th>
            <th className="p-3 text-left">Fav</th>
          </tr>
        </thead>
        <tbody>
          {sortedCoins.map((coin, i) => (
            <tr
              key={coin.id}
              className={`table-row-stripe transition-all duration-150 hover:bg-[rgba(34,211,238,0.06)] ${
                i === 0 ? 'bg-lime-900/10 font-bold text-lime-300' : ''
              }`}
            >
              <td className="p-3 text-gray-300">{i + 1}</td>
              <td className="p-3 flex items-center gap-3">
                <img src={coin.image} alt={coin.name} className="w-8 h-8 rounded-full" />
                <div>
                  <div className="font-medium text-cyan-100">{coin.name}</div>
                  <div className="text-xs text-gray-500 uppercase">({coin.symbol})</div>
                </div>
              </td>
              <td className="p-3 text-lime-400 font-semibold">
                ${coin.current_price.toLocaleString()}
              </td>
              <td className="p-3 text-pink-400">${coin.market_cap.toLocaleString()}</td>
              <td className="p-3">
                <button
                  onClick={() => toggleFavorite(coin.id)}
                  className="text-xl"
                  title={favorites.includes(coin.id) ? 'Убрать из избранного' : 'В избранное'}
                >
                  {favorites.includes(coin.id) ? (
                    <FaStar className="text-yellow-400" />
                  ) : (
                    <FaRegStar className="text-gray-400" />
                  )}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

export default CoinsTable;
