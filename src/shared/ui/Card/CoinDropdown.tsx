import React, { useState, useRef, useEffect, useMemo } from 'react';

import { FaSearch, FaCheck } from 'react-icons/fa';
import type { CoinEntity } from '../../../entities/coin';

// Экранирование для XSS
function escapeHtml(text: unknown) {
  if (typeof text !== 'string') return '';
  return text.replace(/[&<>"'`]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '`': '&#96;',
  }[char] || char));
}

interface CoinDropdownProps {
  coins: CoinEntity[];
  selectedCoin: string | null;
  setSelectedCoin: (coin: string | null) => void;
}

const CoinDropdown: React.FC<CoinDropdownProps> = React.memo((props) => {
  const { coins, selectedCoin, setSelectedCoin } = props;

  // Проверка входных данных
  if (!Array.isArray(coins)) throw new Error('coins must be an array');
  if (typeof setSelectedCoin !== 'function') throw new Error('setSelectedCoin must be a function');

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Фокус на input при открытии
  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  // Оптимизированная фильтрация через useMemo
  const filteredCoins = useMemo(
    () =>
      coins.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.symbol.toLowerCase().includes(search.toLowerCase()),
      ),
    [coins, search],
  );

  return (
    <div className="relative min-w-[180px]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="px-3 py-2 bg-gray-900 text-gray-200 rounded neon-border w-full text-left flex items-center justify-between transition-all duration-200"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>
          {selectedCoin
            ? escapeHtml(
                coins.find((c) => c.id === selectedCoin)?.name ??
                (typeof selectedCoin === 'string' ? selectedCoin : '')
              )
            : 'Выберите монету'}
        </span>
        <FaSearch className="ml-2 text-cyan-400" />
      </button>

      {open && (
        <div className="absolute mt-1 w-full bg-gray-900 text-gray-200 rounded shadow-lg z-50 animate-fade-in">
          <div className="flex items-center px-3 py-2 bg-gray-800 rounded-t">
            <FaSearch className="mr-2 text-cyan-400" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value.replace(/[<>"'`]/g, ''))}
              placeholder="Поиск..."
              className="w-full bg-transparent outline-none text-gray-200"
              autoComplete="off"
            />
          </div>
          <ul tabIndex={-1} className="max-h-56 overflow-auto">
            {filteredCoins.length === 0 && (
              <li className="px-3 py-2 text-gray-500">Нет результатов</li>
            )}
            {filteredCoins.map((c) => (
              <li
                key={c.id}
                onClick={() => {
                  setSelectedCoin(c.id);
                  setOpen(false);
                  setSearch('');
                }}
                className={`px-3 py-2 hover:bg-cyan-900/40 cursor-pointer flex items-center justify-between transition-all duration-150 ${
                  selectedCoin === c.id ? 'bg-cyan-900/20 font-bold text-cyan-300' : ''
                }`}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSelectedCoin(c.id);
                    setOpen(false);
                    setSearch('');
                  }
                }}
              >
                <span>
                  {escapeHtml(c.name)}
                  <span className="text-xs text-gray-400">
                    ({escapeHtml(c.symbol)})
                  </span>
                </span>
                {selectedCoin === c.id && <FaCheck className="text-lime-400" />}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});

// Добавить в styles/index.css:
// .animate-fade-in { animation: fadeIn 0.2s ease; }
// @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px);} to { opacity: 1; transform: translateY(0);} }

export default CoinDropdown;

