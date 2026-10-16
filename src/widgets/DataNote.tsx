import type { MarketsResult } from '../entities/coin/api/queries';
import { formatTime } from '../shared/lib/format';

const SOURCE_TEXT: Record<MarketsResult['source'], string> = {
  coingecko: 'Рынок: CoinGecko, обновление раз в 2 минуты · цены: Binance WebSocket',
  cache: 'CoinGecko сейчас недоступен — показан сохранённый снимок рынка · цены: Binance WebSocket',
  binance:
    'CoinGecko сейчас недоступен — упрощённый режим по данным Binance, без капитализации и графиков за 7 дней',
};

export function DataNote({ result }: { result: MarketsResult | undefined }) {
  if (!result) return null;
  const degraded = result.source !== 'coingecko';
  return (
    <div
      className={`flex flex-wrap justify-between gap-2 border-t px-5 py-3 text-xs ${
        degraded ? 'border-ink text-ink' : 'border-rule text-muted'
      }`}
    >
      <span>{SOURCE_TEXT[result.source]}</span>
      {result.at > 0 && (
        <span className="num text-muted">
          {result.source === 'cache' ? 'снимок от' : 'список обновлён'} {formatTime(result.at)}
        </span>
      )}
    </div>
  );
}
