import { useEffect } from 'react';
import { useStoredState } from '../../shared/lib/storage/useStoredState';
import { MoonIcon, SunIcon } from '../../shared/ui/icons';

type Theme = 'light' | 'dark';

const systemTheme = (): Theme =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';

export function ThemeToggle() {
  const [stored, setTheme] = useStoredState<Theme | null>('theme', null);
  const theme = stored ?? systemTheme();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const next = theme === 'dark' ? 'light' : 'dark';
  const label = next === 'dark' ? 'Тёмная тема' : 'Светлая тема';

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={label}
      title={label}
      className="inline-flex h-10 w-10 cursor-pointer items-center justify-center border border-rule text-ink transition-colors hover:border-ink"
    >
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
