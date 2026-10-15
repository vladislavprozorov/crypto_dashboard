import { useRef, useState, type ChangeEvent } from 'react';
import { toast } from '../../../shared/lib/toast';
import { DownloadIcon } from '../../../shared/ui/icons';
import { computeHoldings } from '../model/calc';
import { parseImport, toCsv, toJson, type ImportResult } from '../model/io';
import { usePortfolio } from '../model/store';

function download(text: string, type: string, filename: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const stamp = () => new Date().toISOString().slice(0, 10);
const MAX_FILE = 2 * 1024 * 1024;

/** Экспорт в JSON/CSV и импорт с предпросмотром: заменить портфель или добавить сделки. */
export function PortfolioIO() {
  const { txs, store } = usePortfolio();
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<(ImportResult & { file: string }) | null>(null);

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_FILE) {
      setPending({ txs: [], errors: ['Файл больше 2 МБ'], file: file.name });
      return;
    }
    setPending({ ...parseImport(await file.text(), file.name.toLowerCase()), file: file.name });
  };

  const apply = async (mode: 'replace' | 'merge') => {
    if (!pending) return;
    const known = new Set(txs.map((t) => t.id));
    const next =
      mode === 'replace' ? pending.txs : [...txs, ...pending.txs.filter((t) => !known.has(t.id))];
    const { issues } = computeHoldings(next);
    await store.replaceAll(next);
    setPending(null);
    toast({
      title: `Импортировано сделок: ${pending.txs.length}`,
      body: issues.length ? `Есть продажи сверх остатка: ${issues.length}` : undefined,
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-ghost"
          disabled={!txs.length}
          onClick={() => download(toJson(txs), 'application/json', `portfolio-${stamp()}.json`)}
        >
          <DownloadIcon size={14} /> JSON
        </button>
        <button
          type="button"
          className="btn-ghost"
          disabled={!txs.length}
          onClick={() => download(toCsv(txs), 'text/csv;charset=utf-8', `portfolio-${stamp()}.csv`)}
        >
          <DownloadIcon size={14} /> CSV
        </button>
        <button type="button" className="btn-ghost" onClick={() => input.current?.click()}>
          Импорт…
        </button>
        <input
          ref={input}
          type="file"
          accept=".json,.csv,application/json,text/csv"
          className="hidden"
          onChange={onFile}
          aria-label="Файл для импорта"
        />
      </div>

      {pending && (
        <div
          role="dialog"
          aria-label="Импорт сделок"
          className="border border-ink bg-panel p-4 text-[13px]"
        >
          <p className="m-0 font-medium">
            {pending.file}: {pending.txs.length} сделок
            {pending.errors.length > 0 && `, ошибок: ${pending.errors.length}`}
          </p>
          {pending.errors.length > 0 && (
            <ul className="m-0 mt-2 max-h-32 list-none overflow-auto p-0 text-xs text-down">
              {pending.errors.slice(0, 20).map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {pending.txs.length > 0 && (
              <>
                <button type="button" className="btn-solid h-9" onClick={() => apply('merge')}>
                  Добавить к портфелю
                </button>
                {txs.length > 0 && (
                  <button type="button" className="btn h-9" onClick={() => apply('replace')}>
                    Заменить всё
                  </button>
                )}
              </>
            )}
            <button type="button" className="btn-ghost h-9" onClick={() => setPending(null)}>
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
