import type { Coin } from '../../types/crypto';

export default function CoinsTable({ coins }: { coins: Coin[] }) {
  return (
    <div
      className="neon-border rounded-2xl shadow-lg p-6 overflow-x-auto"
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.18))',
      }}
    >
      <h2 className="mb-4 text-xl font-bold text-purple-300">🏆 Top 10 Coins</h2>

      <table className="w-full table-auto">
        <thead>
          <tr className="border-b border-gray-700/40 text-cyan-200">
            <th className="p-3 text-left">#</th>
            <th className="p-3 text-left">Name</th>
            <th className="p-3 text-left">Price</th>
            <th className="p-3 text-left">Market Cap</th>
          </tr>
        </thead>

        <tbody>
          {coins.map((coin, i) => (
            <tr
              key={coin.id}
              className="table-row-stripe transition hover:bg-[rgba(34,211,238,0.03)]"
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
