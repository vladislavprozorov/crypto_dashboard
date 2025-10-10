import React, { useState } from 'react';
import { ThemeSwitcher } from '../../shared/ui/Theme/ThemeSwitcher';
import { Link } from 'react-router-dom';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-grid text-gray-100">
      <header className="flex items-center justify-between px-4 py-3">
        <div className="font-bold text-xl header-neon">Crypto Dashboard</div>
        <nav className="hidden md:flex gap-4">
          <Link
            to="/"
            className="neon-border px-3 py-1 rounded text-cyan-200 hover:bg-cyan-900/10 transition"
          >
            Главная
          </Link>
          <Link
            to="/favorites"
            className="neon-border px-3 py-1 rounded text-yellow-400 hover:bg-yellow-100/10 transition"
          >
            ⭐ Избранные
          </Link>
          <ThemeSwitcher />
        </nav>
        <button
          className="md:hidden neon-border rounded p-2"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Открыть меню"
        >
          <span className="text-cyan-200">☰</span>
        </button>
      </header>
      {/* Мобильное меню */}
      {menuOpen && (
        <div className="md:hidden bg-gray-900/95 absolute w-full left-0 top-0 z-50 animate-fade-in">
          <nav className="flex flex-col gap-2 p-4">
            <Link
              to="/"
              className="neon-border px-3 py-2 rounded text-cyan-200"
              onClick={() => setMenuOpen(false)}
            >
              Главная
            </Link>
            <Link
              to="/favorites"
              className="neon-border px-3 py-2 rounded text-yellow-400"
              onClick={() => setMenuOpen(false)}
            >
              ⭐ Избранные
            </Link>
            <ThemeSwitcher />
            <button
              className="mt-2 neon-border rounded p-2 text-cyan-200"
              onClick={() => setMenuOpen(false)}
            >
              Закрыть
            </button>
          </nav>
        </div>
      )}
      <main>{children}</main>
    </div>
  );
};

export default Layout;
