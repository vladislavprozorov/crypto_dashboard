import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Transaction } from '../../../entities/transaction/model/types';
import { formatNumber, formatUsd } from '../../../shared/lib/format';
import { toast } from '../../../shared/lib/toast';
import { CloseIcon } from '../../../shared/ui/icons';
import type { TxIssue } from '../model/calc';
import { usePortfolio } from '../model/store';

/** 3 окт. 2026, 22:44 — компактнее стандартного «3 окт. 2026 г., 22:44» */
const fmtDate = (ts: number) => {
  const d = new Date(ts);
  const day = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  return `${day} ${d.getFullYear()}, ${time}`;
};

export function TransactionList({
  txs,
  issues,
  onEdit,
}: {
  txs: Transaction[];
  issues: TxIssue[];
  onEdit: (tx: Transaction) => void;
}) {
  const { store } = usePortfolio();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const issueById = new Map(issues.map((i) => [i.txId, i.message]));
  const rows = [...txs].sort((a, b) => b.date - a.date || b.createdAt - a.createdAt);

  const remove = async (tx: Transaction) => {
    setConfirmId(null);
    await store.remove(tx.id);
    toast({ title: 'Сделка удалена', body: `${tx.symbol.toUpperCase()} · ${fmtDate(tx.date)}` });
  };

  return (
    <ul className="m-0 list-none p-0">
      <li
        aria-hidden="true"
        className="hidden grid-cols-[164px_80px_1fr_120px_120px_120px_96px] gap-3 px-5 py-2 text-xs text-muted md:grid"
      >
        <span>Дата</span>
        <span>Тип</span>
        <span>Монета</span>
        <span className="text-right">Количество</span>
        <span className="text-right">Цена</span>
        <span className="text-right">Сумма</span>
        <span />
      </li>
      {rows.map((tx) => {
        const issue = issueById.get(tx.id);
        const sum = tx.amount * tx.price + (tx.type === 'buy' ? tx.fee : -tx.fee);
        return (
          <li
            key={tx.id}
            className={`grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 border-t border-rule-soft px-5 py-3 md:grid-cols-[164px_80px_1fr_120px_120px_120px_96px] md:py-2 ${
              issue ? 'bg-down/5' : ''
            }`}
          >
            <span className="num order-3 text-xs text-muted md:order-none md:text-[13px]">
              {fmtDate(tx.date)}
            </span>
            <span
              className={`order-1 text-[13px] font-medium md:order-none ${
                tx.type === 'buy' ? 'text-up' : 'text-down'
              }`}
            >
              {tx.type === 'buy' ? 'Покупка' : 'Продажа'}{' '}
              <Link to={`/coin/${tx.coinId}`} className="text-ink hover:text-accent md:hidden">
                {tx.symbol.toUpperCase()}
              </Link>
            </span>
            <span className="hidden min-w-0 md:block">
              <Link to={`/coin/${tx.coinId}`} className="hover:text-accent">
                <span className="font-medium uppercase">{tx.symbol}</span>{' '}
                <span className="text-xs text-muted">{tx.name}</span>
              </Link>
              {tx.note && <span className="block truncate text-xs text-muted">{tx.note}</span>}
              {issue && <span className="block text-xs text-down">{issue}</span>}
            </span>
            <span className="num order-2 text-right text-[13px] md:order-none">
              {tx.type === 'buy' ? '+' : '−'}
              {+tx.amount.toFixed(8)}
            </span>
            <span className="num hidden text-right text-[13px] md:block">
              {formatUsd(tx.price)}
            </span>
            <span className="num order-4 text-right text-xs text-muted md:order-none md:text-[13px] md:text-ink">
              {formatUsd(sum)}
              {tx.fee > 0 && (
                <span className="block text-[11px] text-muted">
                  комиссия ${formatNumber(tx.fee, 2)}
                </span>
              )}
            </span>
            <span className="order-5 col-span-2 flex justify-end gap-1 md:order-none md:col-span-1">
              {issue && <span className="mr-auto text-xs text-down md:hidden">{issue}</span>}
              {confirmId === tx.id ? (
                <>
                  <button
                    type="button"
                    className="btn-ghost h-8 border-down text-down"
                    onClick={() => remove(tx)}
                  >
                    Удалить
                  </button>
                  <button
                    type="button"
                    className="btn-ghost h-8"
                    onClick={() => setConfirmId(null)}
                  >
                    Нет
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn-ghost h-8"
                    onClick={() => onEdit(tx)}
                    aria-label={`Изменить сделку ${tx.symbol.toUpperCase()} от ${fmtDate(tx.date)}`}
                  >
                    Изменить
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 cursor-pointer items-center justify-center text-muted hover:text-ink"
                    onClick={() => setConfirmId(tx.id)}
                    aria-label={`Удалить сделку ${tx.symbol.toUpperCase()} от ${fmtDate(tx.date)}`}
                  >
                    <CloseIcon size={12} />
                  </button>
                </>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
