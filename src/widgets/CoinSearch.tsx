import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCoins } from '../features/live-prices/model/useCoins';
import { formatUsd } from '../shared/lib/format';
import { CoinMark } from '../shared/ui/CoinMark';
import { SearchIcon } from '../shared/ui/icons';

/** Поиск монеты в шапке: комбобокс со стрелками, Enter открывает страницу монеты, «/» — фокус. */
export function CoinSearch() {
  const { coins } = useCoins();
  const navigate = useNavigate();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const q = query.trim().toLowerCase();
  const results = q
    ? coins
        .filter((c) => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().startsWith(q))
        .slice(0, 6)
    : [];

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(target.tagName)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const go = (id: string) => {
    navigate(`/coin/${id}`);
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[active]) {
      go(results[active].id);
    } else if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const expanded = open && results.length > 0;

  return (
    <div className="relative w-60">
      <label className="flex h-10 items-center gap-2 border border-rule bg-panel px-3 focus-within:border-ink">
        <SearchIcon size={14} className="shrink-0 text-muted" />
        <span className="sr-only">Поиск монеты</span>
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={expanded}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={expanded ? `${listId}-${active}` : undefined}
          value={query}
          placeholder="Поиск монеты"
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
          className="w-full min-w-0 bg-transparent outline-none"
        />
        <kbd className="num border border-rule px-1.5 text-[11px] text-muted">/</kbd>
      </label>
      {expanded && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-40 m-0 mt-1 list-none border border-ink bg-panel p-0"
        >
          {results.map((c, i) => (
            <li
              key={c.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                go(c.id);
              }}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center gap-3 px-3 py-2 ${
                i === active ? 'bg-rule-soft' : ''
              }`}
            >
              <CoinMark symbol={c.symbol} size="sm" />
              <span className="min-w-0 flex-1 truncate">
                {c.name} <span className="num text-xs uppercase text-muted">{c.symbol}</span>
              </span>
              <span className="num text-xs">{formatUsd(c.current_price)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
