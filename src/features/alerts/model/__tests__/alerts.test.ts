import { describe, expect, test } from 'vitest';
import { checkAlerts, createAlert, distanceToTarget, isHit, suggestDirection } from '../alerts';

const base = { coinId: 'bitcoin', symbol: 'btc', name: 'Bitcoin' };

describe('checkAlerts', () => {
  const above = createAlert({ ...base, direction: 'above', target: 85000 }, 1);
  const below = createAlert({ ...base, direction: 'below', target: 78000 }, 2);

  test('ничего не срабатывает, пока цена между целями', () => {
    const input = [above, below];
    const res = checkAlerts(input, { bitcoin: 82000 }, 100);
    expect(res.fired).toHaveLength(0);
    // без изменений возвращается тот же массив — лишней записи в localStorage не будет
    expect(res.alerts).toBe(input);
  });

  test('срабатывает при пересечении и запоминает цену', () => {
    const res = checkAlerts([above, below], { bitcoin: 85010 }, 100);
    expect(res.fired).toHaveLength(1);
    expect(res.fired[0]).toMatchObject({ id: above.id, triggeredAt: 100, triggeredPrice: 85010 });
    expect(res.alerts[1]).toBe(below);
  });

  test('сработавший алерт не срабатывает повторно', () => {
    const first = checkAlerts([below], { bitcoin: 77000 }, 100);
    const second = checkAlerts(first.alerts, { bitcoin: 76000 }, 200);
    expect(second.fired).toHaveLength(0);
    expect(second.alerts[0].triggeredPrice).toBe(77000);
  });

  test('монета без цены пропускается', () => {
    expect(checkAlerts([above], {}).fired).toHaveLength(0);
  });
});

test('isHit учитывает границу', () => {
  const a = createAlert({ ...base, direction: 'above', target: 100 });
  expect(isHit(a, 100)).toBe(true);
  expect(isHit(a, 99.99)).toBe(false);
});

test('suggestDirection', () => {
  expect(suggestDirection(90, 80)).toBe('above');
  expect(suggestDirection(70, 80)).toBe('below');
});

test('distanceToTarget', () => {
  expect(distanceToTarget({ target: 110 }, 100)).toBeCloseTo(10);
  expect(distanceToTarget({ target: 90 }, 100)).toBeCloseTo(-10);
  expect(distanceToTarget({ target: 90 }, 0)).toBeNull();
});
