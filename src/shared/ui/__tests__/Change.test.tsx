import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Change } from '../Change';

test('рост: стрелка, знак и цвет', () => {
  render(<Change value={5.744} />);
  const el = screen.getByText('+5.74%');
  expect(el).toHaveClass('text-up');
  expect(el).toHaveTextContent('▲');
});

test('падение: настоящий минус', () => {
  render(<Change value={-1.84} />);
  expect(screen.getByText('−1.84%')).toHaveClass('text-down');
});

test('нет данных — прочерк без стрелки', () => {
  render(<Change value={null} />);
  const el = screen.getByText('—');
  expect(el).toHaveClass('text-muted');
  expect(el).not.toHaveTextContent('▲');
});
