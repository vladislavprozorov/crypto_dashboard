import React, { useEffect, useState } from 'react';
import { FaMoon, FaSun } from 'react-icons/fa';

export const ThemeSwitcher: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'dark' | 'light' | null;
    if (saved) setTheme(saved);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
  };

  return (
    <button
      className="neon-border rounded-full p-2 bg-gray-900 text-cyan-200 hover:bg-gray-800 transition"
      onClick={toggleTheme}
      aria-label="Переключить тему"
      title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
    >
      {theme === 'dark' ? <FaSun /> : <FaMoon />}
    </button>
  );
};
