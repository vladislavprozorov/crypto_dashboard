import type { Transaction, TxType } from '../../../entities/transaction/model/types';
import { newTxId } from './store';

export const EXPORT_FORMAT = 'crypto-dashboard/portfolio';
export const EXPORT_VERSION = 1;

export interface ImportResult {
  txs: Transaction[];
  errors: string[];
}

const CSV_HEADER = ['date', 'type', 'coin_id', 'symbol', 'name', 'amount', 'price', 'fee', 'note'];

export function toJson(txs: Transaction[], now = Date.now()) {
  return JSON.stringify(
    {
      format: EXPORT_FORMAT,
      version: EXPORT_VERSION,
      exportedAt: new Date(now).toISOString(),
      transactions: txs,
    },
    null,
    2,
  );
}

const csvCell = (v: string | number | undefined) => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCsv(txs: Transaction[]) {
  const rows = txs.map((t) => [
    new Date(t.date).toISOString(),
    t.type,
    t.coinId,
    t.symbol,
    t.name,
    t.amount,
    t.price,
    t.fee,
    t.note ?? '',
  ]);
  return [CSV_HEADER, ...rows].map((r) => r.map(csvCell).join(',')).join('\n');
}

/** Небольшой CSV-парсер: кавычки, экранированные "" и переводы строк внутри полей. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      if (row.some((c) => c !== '')) rows.push(row);
      row = [];
      cell = '';
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c !== '')) rows.push(row);
  return rows;
}

/** Проверяет одну запись и приводит её к Transaction. Возвращает текст ошибки или сделку. */
export function normalizeTx(raw: Record<string, unknown>, now = Date.now()): Transaction | string {
  const num = (v: unknown) => (typeof v === 'number' ? v : Number(String(v ?? '').trim()));
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

  const type = str(raw.type).toLowerCase() as TxType;
  if (type !== 'buy' && type !== 'sell')
    return `тип должен быть buy или sell, а не «${str(raw.type)}»`;
  const coinId = str(raw.coinId ?? raw.coin_id);
  if (!/^[a-z0-9-]+$/.test(coinId)) return `некорректный coin_id «${coinId}»`;
  const amount = num(raw.amount);
  if (!(amount > 0)) return 'количество должно быть больше нуля';
  const price = num(raw.price);
  if (!(price >= 0) || !Number.isFinite(price)) return 'некорректная цена';
  const feeRaw = raw.fee == null || raw.fee === '' ? 0 : num(raw.fee);
  if (!(feeRaw >= 0)) return 'некорректная комиссия';
  const date = typeof raw.date === 'number' ? raw.date : Date.parse(str(raw.date));
  if (!Number.isFinite(date)) return `некорректная дата «${String(raw.date)}»`;
  if (date > now + 60_000) return 'дата сделки в будущем';
  const symbol = str(raw.symbol).toLowerCase() || coinId;
  const note = str(raw.note);

  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : newTxId(),
    coinId,
    symbol,
    name: str(raw.name) || symbol.toUpperCase(),
    type,
    amount,
    price,
    fee: feeRaw,
    date,
    ...(note ? { note } : {}),
    createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : now,
  };
}

function collect(records: Record<string, unknown>[], label: (i: number) => string): ImportResult {
  const txs: Transaction[] = [];
  const errors: string[] = [];
  records.forEach((r, i) => {
    const res = normalizeTx(r);
    if (typeof res === 'string') errors.push(`${label(i)}: ${res}`);
    else txs.push(res);
  });
  return { txs, errors };
}

export function parseImport(text: string, filename = ''): ImportResult {
  const trimmed = text.trim();
  if (!trimmed) return { txs: [], errors: ['Файл пустой'] };

  if (filename.endsWith('.json') || trimmed.startsWith('{') || trimmed.startsWith('[')) {
    let data: unknown;
    try {
      data = JSON.parse(trimmed);
    } catch {
      return { txs: [], errors: ['Файл не является корректным JSON'] };
    }
    const list = Array.isArray(data) ? data : (data as { transactions?: unknown }).transactions;
    if (!Array.isArray(list)) return { txs: [], errors: ['В JSON нет массива transactions'] };
    return collect(list as Record<string, unknown>[], (i) => `Сделка ${i + 1}`);
  }

  const [header, ...rows] = parseCsv(trimmed);
  const cols = header.map((h) => h.trim().toLowerCase());
  const missing = ['date', 'type', 'coin_id', 'amount', 'price'].filter((c) => !cols.includes(c));
  if (missing.length) return { txs: [], errors: [`В CSV нет колонок: ${missing.join(', ')}`] };
  const records = rows.map((r) => Object.fromEntries(cols.map((c, i) => [c, r[i] ?? ''])));
  return collect(records, (i) => `Строка ${i + 2}`);
}
