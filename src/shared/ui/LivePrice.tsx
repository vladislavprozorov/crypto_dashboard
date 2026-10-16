import { useEffect, useRef, useState } from 'react';
import { formatUsd } from '../lib/format';

/** Цена, которая коротко подсвечивается зелёным/красным при новом тике. */
export function LivePrice({ value, className = '' }: { value: number; className?: string }) {
  const prev = useRef(value);
  const [flash, setFlash] = useState<{ dir: 'up' | 'down'; n: number } | null>(null);

  useEffect(() => {
    if (value !== prev.current) {
      const dir = value > prev.current ? 'up' : 'down';
      prev.current = value;
      setFlash((f) => ({ dir, n: (f?.n ?? 0) + 1 }));
    }
  }, [value]);

  return (
    <span
      // key перезапускает CSS-анимацию на каждом тике
      key={flash?.n ?? 0}
      className={`num ${flash ? (flash.dir === 'up' ? 'tick-up' : 'tick-down') : ''} ${className}`}
    >
      {formatUsd(value)}
    </span>
  );
}
