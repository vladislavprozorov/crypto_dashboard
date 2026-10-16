import { useRef, type KeyboardEvent } from 'react';

/** Сегментированный переключатель (периоды графика, условие алерта). Стрелки ←/→ двигают выбор. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  className = '',
  labels,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  className?: string;
  labels?: Partial<Record<T, string>>;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const i = options.indexOf(value);
    const next = options[(i + (e.key === 'ArrowRight' ? 1 : -1) + options.length) % options.length];
    onChange(next);
    const idx = options.indexOf(next);
    ref.current?.querySelectorAll<HTMLButtonElement>('button')[idx]?.focus();
  };

  return (
    <div
      ref={ref}
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={`inline-flex border border-ink ${className}`}
    >
      {options.map((o) => {
        const on = o === value;
        return (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(o)}
            className={`num h-9 min-w-[48px] flex-1 cursor-pointer px-2 text-xs transition-colors ${
              on ? 'bg-ink text-on-ink' : 'bg-transparent text-ink hover:bg-rule-soft'
            }`}
          >
            {labels?.[o] ?? o}
          </button>
        );
      })}
    </div>
  );
}
