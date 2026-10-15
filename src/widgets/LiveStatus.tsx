import { useEffect, useState } from 'react';
import { useLiveSnapshot } from '../features/live-prices/model/context';

const LABEL = {
  idle: 'ОЖИДАНИЕ',
  connecting: 'ПОДКЛЮЧЕНИЕ',
  live: 'LIVE',
  reconnecting: 'ПЕРЕПОДКЛЮЧЕНИЕ',
  offline: 'НЕТ СЕТИ',
} as const;

function utc(ts: number) {
  return new Date(ts).toISOString().slice(11, 19);
}

/** Индикатор WebSocket-потока: квадрат-акцент мигает, пока идут тики. */
export function LiveStatus({ compact = false }: { compact?: boolean }) {
  const { status, lastTickAt, receivedAt } = useLiveSnapshot();
  const [, force] = useState(0);
  // раз в 5 секунд пересчитываем «давно ли был тик», даже если тиков нет
  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 5000);
    return () => clearInterval(t);
  }, []);
  const stale = status === 'live' && receivedAt != null && Date.now() - receivedAt > 15000;
  const live = status === 'live' && !stale;

  return (
    <div
      className="num flex items-center gap-2 text-xs text-muted"
      role="status"
      aria-label={`Поток цен: ${LABEL[status].toLowerCase()}`}
    >
      <span
        aria-hidden="true"
        className={`inline-block h-2 w-2 ${live ? 'bg-accent' : 'border border-muted'} ${
          live ? 'animate-[pulse_2s_ease-in-out_infinite]' : ''
        }`}
      />
      <span>
        {LABEL[status]}
        {!compact && live && lastTickAt ? ` · WS · ${utc(lastTickAt)} UTC` : ''}
      </span>
    </div>
  );
}
