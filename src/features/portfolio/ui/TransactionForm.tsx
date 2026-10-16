import { useId, useMemo, useState, type FormEvent } from 'react';
import type { Coin } from '../../../entities/coin/model/types';
import type { Transaction, TxType } from '../../../entities/transaction/model/types';
import { formatNumber, formatUsd, parseAmount, priceDigits } from '../../../shared/lib/format';
import { toast } from '../../../shared/lib/toast';
import { Segmented } from '../../../shared/ui/Segmented';
import { amountAt } from '../model/calc';
import { usePortfolio } from '../model/store';

const TYPES = ['buy', 'sell'] as const;
const TYPE_LABELS = { buy: 'Покупка', sell: 'Продажа' };

/** datetime-local ждёт локальное время без зоны: 2026-10-15T14:30 */
function toLocalInput(ts: number) {
  const d = new Date(ts);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

const plain = (v: number) => formatNumber(v, priceDigits(v)).replace(/\u2009/g, '');

export function TransactionForm({
  coins,
  editing,
  defaultCoinId,
  onDone,
}: {
  coins: Coin[];
  editing?: Transaction | null;
  defaultCoinId?: string;
  onDone?: () => void;
}) {
  const id = useId();
  const { txs, store } = usePortfolio();
  const sortedCoins = useMemo(
    () => [...coins].sort((a, b) => (a.market_cap_rank ?? 999) - (b.market_cap_rank ?? 999)),
    [coins],
  );

  const initialCoin = editing?.coinId ?? defaultCoinId ?? 'bitcoin';
  const [coinId, setCoinId] = useState(initialCoin);
  const [type, setType] = useState<TxType>(editing?.type ?? 'buy');
  const [amount, setAmount] = useState(editing ? String(editing.amount) : '');
  const [price, setPrice] = useState(() => {
    if (editing) return String(editing.price);
    const c = coins.find((x) => x.id === initialCoin);
    return c ? plain(c.current_price) : '';
  });
  const [date, setDate] = useState(toLocalInput(editing?.date ?? Date.now()));
  const [fee, setFee] = useState(editing?.fee ? String(editing.fee) : '');
  const [note, setNote] = useState(editing?.note ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // монета из сделки может уже выпасть из топ-50 — оставляем её в списке
  const coin = coins.find((c) => c.id === coinId);
  const options =
    editing && !coin
      ? [{ id: editing.coinId, name: editing.name, symbol: editing.symbol }, ...sortedCoins]
      : sortedCoins;

  const amountNum = parseAmount(amount);
  const priceNum = parseAmount(price);
  const feeNum = fee.trim() ? parseAmount(fee) : 0;
  const dateTs = Date.parse(date);
  const available = useMemo(
    () => amountAt(txs, coinId, Number.isFinite(dateTs) ? dateTs : Date.now(), editing?.id),
    [txs, coinId, dateTs, editing?.id],
  );
  const total =
    amountNum != null && priceNum != null
      ? amountNum * priceNum + (type === 'buy' ? 1 : -1) * (feeNum ?? 0)
      : null;

  const pickCoin = (next: string) => {
    setCoinId(next);
    setError(null);
    const c = coins.find((x) => x.id === next);
    if (c && !editing) setPrice(plain(c.current_price));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const meta = coin ?? (editing ? { symbol: editing.symbol, name: editing.name } : null);
    if (!meta) return setError('Выберите монету');
    if (!amountNum || amountNum <= 0) return setError('Введите количество больше нуля');
    if (priceNum == null) return setError('Введите цену за монету');
    if (feeNum == null || feeNum < 0) return setError('Некорректная комиссия');
    if (!Number.isFinite(dateTs)) return setError('Укажите дату сделки');
    if (dateTs > Date.now() + 60_000) return setError('Дата сделки не может быть в будущем');
    if (type === 'sell' && amountNum > available + 1e-9) {
      return setError(
        `На эту дату в портфеле только ${+available.toFixed(8)} ${meta.symbol.toUpperCase()}`,
      );
    }

    const payload = {
      coinId,
      symbol: meta.symbol,
      name: meta.name,
      type,
      amount: amountNum,
      price: priceNum,
      fee: feeNum,
      date: dateTs,
      ...(note.trim() ? { note: note.trim() } : {}),
    };
    setSaving(true);
    try {
      if (editing) await store.update({ ...editing, ...payload, note: payload.note });
      else await store.add(payload);
      toast({
        title: editing ? 'Сделка обновлена' : 'Сделка добавлена',
        body: `${TYPE_LABELS[type]} ${amountNum} ${meta.symbol.toUpperCase()} по ${formatUsd(priceNum)}`,
      });
      if (!editing) {
        setAmount('');
        setFee('');
        setNote('');
      }
      onDone?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить сделку');
    } finally {
      setSaving(false);
    }
  };

  const field = 'flex flex-col gap-1.5 text-xs text-muted';

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4 p-5">
      <Segmented
        options={TYPES}
        labels={TYPE_LABELS}
        value={type}
        onChange={(t) => {
          setType(t);
          setError(null);
        }}
        label="Тип сделки"
        className="w-full"
      />
      <label htmlFor={`${id}-coin`} className={field}>
        Монета
        <select
          id={`${id}-coin`}
          value={coinId}
          onChange={(e) => pickCoin(e.target.value)}
          className="field cursor-pointer text-sm"
        >
          {options.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.symbol.toUpperCase()})
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label htmlFor={`${id}-amount`} className={field}>
          Количество
          <input
            id={`${id}-amount`}
            className="field num min-w-0"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setError(null);
            }}
          />
        </label>
        <label htmlFor={`${id}-price`} className={field}>
          Цена, USD
          <input
            id={`${id}-price`}
            className="field num min-w-0"
            inputMode="decimal"
            autoComplete="off"
            value={price}
            onChange={(e) => {
              setPrice(e.target.value);
              setError(null);
            }}
          />
        </label>
      </div>
      {type === 'sell' && (
        <div className="flex items-center justify-between text-xs">
          <span className="num text-muted">
            Доступно: {+available.toFixed(8)}{' '}
            {(coin?.symbol ?? editing?.symbol ?? '').toUpperCase()}
          </span>
          {available > 0 && (
            <button
              type="button"
              className="underline underline-offset-4 hover:text-accent"
              onClick={() => setAmount(String(+available.toFixed(8)))}
            >
              Продать всё
            </button>
          )}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <label htmlFor={`${id}-date`} className={field}>
          Дата и время
          <input
            id={`${id}-date`}
            type="datetime-local"
            className="field num min-w-0 text-[13px]"
            value={date}
            max={toLocalInput(Date.now())}
            onChange={(e) => {
              setDate(e.target.value);
              setError(null);
            }}
          />
        </label>
        <label htmlFor={`${id}-fee`} className={field}>
          Комиссия, USD
          <input
            id={`${id}-fee`}
            className="field num min-w-0"
            inputMode="decimal"
            placeholder="0"
            value={fee}
            onChange={(e) => setFee(e.target.value)}
          />
        </label>
      </div>
      <label htmlFor={`${id}-note`} className={field}>
        Заметка
        <input
          id={`${id}-note`}
          className="field text-sm"
          maxLength={120}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>
      <p
        role={error ? 'alert' : undefined}
        className={`num m-0 text-xs ${error ? 'text-down' : 'text-muted'}`}
      >
        {error ?? (total != null ? `Итого: ${formatUsd(total)}` : 'Итого: —')}
      </p>
      <div className="flex gap-2">
        <button type="submit" className="btn-solid h-11 flex-1" disabled={saving}>
          {editing ? 'Сохранить' : type === 'buy' ? 'Добавить покупку' : 'Добавить продажу'}
        </button>
        {onDone && editing && (
          <button type="button" className="btn h-11" onClick={onDone}>
            Отмена
          </button>
        )}
      </div>
    </form>
  );
}
