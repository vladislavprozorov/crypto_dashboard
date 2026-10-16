const SIZES = {
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-8 w-8 text-[11px]',
  lg: 'h-10 w-10 text-[13px]',
} as const;

/** Монограмма монеты вместо цветного логотипа — держит интерфейс в одной гамме. */
export function CoinMark({ symbol, size = 'md' }: { symbol: string; size?: keyof typeof SIZES }) {
  return (
    <span
      aria-hidden="true"
      className={`num inline-flex shrink-0 items-center justify-center border border-ink uppercase ${SIZES[size]}`}
    >
      {symbol.slice(0, 2)}
    </span>
  );
}
