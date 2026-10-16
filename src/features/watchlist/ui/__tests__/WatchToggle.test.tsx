import { beforeEach, expect, test } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { WatchToggle } from '../WatchToggle';

beforeEach(() => localStorage.clear());

test('звезда добавляет и убирает монету из вотчлиста и сохраняет его', () => {
  render(
    <>
      <WatchToggle coinId="solana" name="Solana" />
      <WatchToggle coinId="solana" name="Solana" variant="button" />
    </>,
  );
  const star = screen.getByRole('button', { name: 'Добавить Solana в вотчлист' });
  expect(star).toHaveAttribute('aria-pressed', 'false');

  fireEvent.click(star);
  // оба экземпляра подписаны на одно хранилище и обновились вместе
  expect(screen.getByRole('button', { name: 'Убрать Solana из вотчлиста' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(screen.getByRole('button', { name: /В вотчлисте/ })).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem('watchlist:v1')!)).toContain('solana');

  fireEvent.click(screen.getByRole('button', { name: 'Убрать Solana из вотчлиста' }));
  expect(JSON.parse(localStorage.getItem('watchlist:v1')!)).not.toContain('solana');
});
