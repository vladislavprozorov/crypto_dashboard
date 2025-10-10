import { useState } from 'react';

export default function CoinDropdown({ coins, selectedCoin, setSelectedCoin }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-2 bg-gray-900 text-gray-200 rounded neon-border"
      >
        {selectedCoin ?? 'Select coin'}
      </button>

      {open && (
        <ul className="absolute mt-1 w-full bg-gray-900 text-gray-200 rounded shadow-lg z-50">
          {coins?.map((c) => (
            <li
              key={c.id}
              onClick={() => {
                setSelectedCoin(c.id);
                setOpen(false);
              }}
              className="px-3 py-2 hover:bg-gray-800 cursor-pointer"
            >
              {c.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
