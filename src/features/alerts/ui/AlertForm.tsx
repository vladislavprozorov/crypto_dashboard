import { useId, useState, type FormEvent } from 'react';
import type { Coin } from '../../../entities/coin/model/types';
import {
  formatNumber,
  formatPct,
  formatUsd,
  parseAmount,
  priceDigits,
} from '../../../shared/lib/format';
import { requestNotifications } from '../../../shared/lib/notifications';
import { Segmented } from '../../../shared/ui/Segmented';
import { toast } from '../../../shared/lib/toast';
import { suggestDirection, type AlertDirection } from '../model/alerts';
import { useAlerts } from '../model/useAlerts';

const DIRECTIONS = ['above', 'below'] as const;
const DIRECTION_LABELS = { above: 'Выше', below: 'Ниже' };

export function AlertForm({ coin }: { coin: Coin }) {
  const { add } = useAlerts();
  const fieldId = useId();
  const [raw, setRaw] = useState('');
  const [direction, setDirection] = useState<AlertDirection>('above');
  const [touchedDirection, setTouchedDirection] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const target = parseAmount(raw);
  const distance = target ? ((target - coin.current_price) / coin.current_price) * 100 : null;

  const onInput = (value: string) => {
    setRaw(value);
    setError(null);
    const t = parseAmount(value);
    // пока пользователь сам не выбрал условие, подсказываем его по введённой цене
    if (t && !touchedDirection) setDirection(suggestDirection(t, coin.current_price));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!target || target <= 0) {
      setError('Введите цену больше нуля');
      return;
    }
    const alreadyHit =
      direction === 'above' ? coin.current_price >= target : coin.current_price <= target;
    if (alreadyHit) {
      setError(
        `Цена уже ${direction === 'above' ? 'выше' : 'ниже'} ${formatUsd(target)} — алерт сработает сразу`,
      );
      return;
    }
    add({ coinId: coin.id, symbol: coin.symbol, name: coin.name, direction, target });
    setRaw('');
    setTouchedDirection(false);
    toast({
      title: 'Алерт создан',
      body: `${coin.symbol.toUpperCase()} ${direction === 'above' ? 'выше' : 'ниже'} ${formatUsd(target)}`,
    });
    await requestNotifications();
  };

  const presets = [-10, -5, 5, 10];

  return (
    <form onSubmit={onSubmit} className="border border-ink bg-panel" noValidate>
      <h2 className="panel-title border-b border-ink px-5 py-4">Новый алерт</h2>
      <div className="flex flex-col gap-4 p-5">
        <div className="flex flex-col gap-2">
          <span className="text-xs text-muted">Условие</span>
          <Segmented
            options={DIRECTIONS}
            labels={DIRECTION_LABELS}
            value={direction}
            onChange={(d) => {
              setDirection(d);
              setTouchedDirection(true);
              setError(null);
            }}
            label="Условие алерта"
            className="w-full"
          />
        </div>
        <label htmlFor={fieldId} className="flex flex-col gap-2 text-xs text-muted">
          Цена, USD
          <input
            id={fieldId}
            className="field num text-base"
            inputMode="decimal"
            autoComplete="off"
            placeholder={formatNumber(coin.current_price, priceDigits(coin.current_price))}
            value={raw}
            onChange={(e) => onInput(e.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={`${fieldId}-hint`}
          />
        </label>
        <div className="flex flex-wrap gap-2" aria-label="Быстрый выбор">
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              className="btn-ghost num h-8 px-2 text-xs"
              onClick={() =>
                onInput(
                  formatNumber(
                    coin.current_price * (1 + p / 100),
                    priceDigits(coin.current_price),
                  ).replace(/\u2009/g, ''),
                )
              }
            >
              {formatPct(p, 0)}
            </button>
          ))}
        </div>
        <p
          id={`${fieldId}-hint`}
          className={`num m-0 text-xs ${error ? 'text-down' : 'text-muted'}`}
        >
          {error ??
            (distance != null
              ? `${formatPct(distance)} от текущей цены ${formatUsd(coin.current_price)}`
              : `Текущая цена ${formatUsd(coin.current_price)}`)}
        </p>
        <button type="submit" className="btn-solid h-11">
          Создать алерт
        </button>
        <p className="m-0 text-xs text-muted">
          Проверяется на каждом тике цены, пока вкладка открыта. Уведомление — в приложении и в
          браузере.
        </p>
      </div>
    </form>
  );
}
