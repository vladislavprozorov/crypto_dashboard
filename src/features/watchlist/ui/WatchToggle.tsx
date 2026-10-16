import { StarIcon } from '../../../shared/ui/icons';
import { useWatchlist } from '../model/useWatchlist';

export function WatchToggle({
  coinId,
  name,
  variant = 'icon',
}: {
  coinId: string;
  name: string;
  variant?: 'icon' | 'button';
}) {
  const { has, toggle } = useWatchlist();
  const on = has(coinId);
  const label = on ? `Убрать ${name} из вотчлиста` : `Добавить ${name} в вотчлист`;

  if (variant === 'button') {
    return (
      <button type="button" className="btn h-11" aria-pressed={on} onClick={() => toggle(coinId)}>
        <StarIcon filled={on} className={on ? 'text-accent' : ''} />
        {on ? 'В вотчлисте' : 'В вотчлист'}
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={on}
      title={label}
      onClick={() => toggle(coinId)}
      className={`inline-flex h-11 w-11 cursor-pointer items-center justify-center transition-colors ${
        on ? 'text-accent' : 'text-muted hover:text-ink'
      }`}
    >
      <StarIcon filled={on} />
    </button>
  );
}
