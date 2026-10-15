import { useMemo, useState } from 'react';
import type { Transaction } from '../../entities/transaction/model/types';
import { buildDemo, DEMO_COINS } from '../../features/portfolio/model/demo';
import { getPortfolioStore } from '../../features/portfolio/model/store';
import { usePortfolioSummary } from '../../features/portfolio/model/usePortfolioSummary';
import { PortfolioIO } from '../../features/portfolio/ui/PortfolioIO';
import { TransactionForm } from '../../features/portfolio/ui/TransactionForm';
import { TransactionList } from '../../features/portfolio/ui/TransactionList';
import { fetchKlines } from '../../shared/api/binance';
import { toast } from '../../shared/lib/toast';
import { Panel } from '../../shared/ui/Panel';
import { Skeleton } from '../../shared/ui/Skeleton';
import { Allocation } from '../../widgets/portfolio/Allocation';
import { Holdings } from '../../widgets/portfolio/Holdings';
import { PortfolioSummaryBar } from '../../widgets/portfolio/PortfolioSummaryBar';
import { ValueChart } from '../../widgets/portfolio/ValueChart';

function scrollToForm() {
  const el = document.getElementById('tx-form');
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  setTimeout(
    () => el?.querySelector<HTMLElement>('select, input')?.focus({ preventScroll: true }),
    300,
  );
}

function useDemoLoader() {
  const [loading, setLoading] = useState(false);
  const load = async () => {
    setLoading(true);
    try {
      const entries = await Promise.all(
        Object.entries(DEMO_COINS).map(
          async ([id, c]) => [id, await fetchKlines(c.pair, '1d', 200)] as const,
        ),
      );
      const txs = buildDemo(Object.fromEntries(entries));
      await getPortfolioStore().replaceAll(txs);
      toast({
        title: 'Демо-портфель загружен',
        body: `${txs.length} сделок за полгода по реальным ценам`,
      });
    } catch {
      toast({
        title: 'Не удалось загрузить цены для демо',
        body: 'Проверьте соединение и попробуйте ещё раз',
      });
    } finally {
      setLoading(false);
    }
  };
  return { load, loading };
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  const demo = useDemoLoader();
  return (
    <section className="panel flex flex-col items-start gap-4 px-6 py-10 md:px-10 md:py-14">
      <h2 className="m-0 text-xl font-semibold">Портфель пуст</h2>
      <p className="m-0 max-w-[56ch] text-muted">
        Добавьте покупки и продажи — дашборд посчитает среднюю цену, нереализованную и
        зафиксированную прибыль, распределение и динамику стоимости по live-ценам.
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-solid h-11" onClick={onAdd}>
          Добавить первую сделку
        </button>
        <button type="button" className="btn h-11" onClick={demo.load} disabled={demo.loading}>
          {demo.loading ? 'Загружаем цены…' : 'Загрузить демо-портфель'}
        </button>
      </div>
    </section>
  );
}

export default function PortfolioPage() {
  const { status, txs, summary, issues, coins, store, error } = usePortfolioSummary();
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const currentPrices = useMemo(
    () => Object.fromEntries(coins.map((c) => [c.id, c.current_price])),
    [coins],
  );

  const empty = status === 'ready' && txs.length === 0;
  const showForm = !empty || formOpen;

  const edit = (tx: Transaction) => {
    setEditing(tx);
    setTimeout(scrollToForm, 0);
  };

  return (
    <div className="mx-auto flex max-w-page flex-col gap-4 px-4 py-4 md:gap-6 md:px-8 md:py-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="m-0 text-2xl font-semibold">Портфель</h1>
          <p className="m-0 text-muted">
            Сделки хранятся в браузере (IndexedDB) и синхронизируются между вкладками.
          </p>
        </div>
        <div className="flex flex-wrap items-start gap-2">
          {!empty && (
            <button type="button" className="btn-solid h-9" onClick={scrollToForm}>
              + Сделка
            </button>
          )}
          <PortfolioIO />
        </div>
      </header>

      {status === 'error' && (
        <p role="alert" className="m-0 border border-down px-4 py-3 text-down">
          Хранилище недоступно: {error}
        </p>
      )}

      {status === 'idle' || status === 'loading' ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-[360px]" />
        </div>
      ) : (
        <>
          {empty && !formOpen && <EmptyState onAdd={() => setFormOpen(true)} />}
          {!empty && <PortfolioSummaryBar summary={summary} />}
          {issues.length > 0 && (
            <p role="alert" className="m-0 border border-down px-4 py-3 text-[13px] text-down">
              {issues.length === 1 ? 'Одна продажа' : `${issues.length} продаж(и)`} больше остатка
              на свою дату и не учтены в расчёте — исправьте количество или дату.
            </p>
          )}
          {summary.unpriced.length > 0 && (
            <p className="m-0 text-xs text-muted">
              Нет текущей цены для {summary.unpriced.map((s) => s.toUpperCase()).join(', ')} — эти
              позиции оценены по себестоимости.
            </p>
          )}

          <div className="flex flex-wrap items-start gap-4 md:gap-6">
            {!empty && (
              <div className="flex min-w-0 flex-[999_1_640px] flex-col gap-4 md:gap-6">
                <ValueChart txs={txs} currentPrices={currentPrices} />
                <Panel
                  id="holdings"
                  title="Позиции"
                  aside={<span className="num text-xs text-muted">{summary.rows.length}</span>}
                >
                  {summary.rows.length ? (
                    <Holdings rows={summary.rows} />
                  ) : (
                    <p className="m-0 px-5 py-4 text-muted">
                      Все позиции закрыты. Итог продаж — в «Зафиксировано продажами».
                    </p>
                  )}
                </Panel>
              </div>
            )}
            {showForm && (
              <aside className="flex min-w-0 flex-[1_1_340px] flex-col gap-4 md:gap-6">
                <section
                  id="tx-form"
                  aria-labelledby="tx-form-title"
                  className="scroll-mt-24 border border-ink bg-panel"
                >
                  <h2 id="tx-form-title" className="panel-title border-b border-ink px-5 py-4">
                    {editing ? 'Изменить сделку' : 'Новая сделка'}
                  </h2>
                  <TransactionForm
                    key={editing?.id ?? 'new'}
                    coins={coins}
                    editing={editing}
                    onDone={editing ? () => setEditing(null) : undefined}
                  />
                </section>
                {summary.rows.length > 0 && (
                  <Panel id="allocation" title="Распределение">
                    <Allocation rows={summary.rows} />
                  </Panel>
                )}
              </aside>
            )}
          </div>

          {txs.length > 0 && (
            <Panel
              id="history"
              title="История сделок"
              aside={
                confirmClear ? (
                  <span className="flex items-center gap-2 text-xs">
                    Удалить все {txs.length} сделок?
                    <button
                      type="button"
                      className="btn-ghost h-8 border-down text-down"
                      onClick={async () => {
                        setConfirmClear(false);
                        setEditing(null);
                        await store.replaceAll([]);
                      }}
                    >
                      Да, очистить
                    </button>
                    <button
                      type="button"
                      className="btn-ghost h-8"
                      onClick={() => setConfirmClear(false)}
                    >
                      Нет
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    className="btn-ghost h-8"
                    onClick={() => setConfirmClear(true)}
                  >
                    Очистить
                  </button>
                )
              }
            >
              <TransactionList txs={txs} issues={issues} onEdit={edit} />
            </Panel>
          )}
        </>
      )}
    </div>
  );
}
