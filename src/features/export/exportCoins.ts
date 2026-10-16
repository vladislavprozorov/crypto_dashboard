import type { Coin } from '../../entities/coin/model/types';

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function stamp() {
  return new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
}

const csvCell = (v: string | number | null | undefined) => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCsv(coins: Coin[]) {
  const header = [
    'rank',
    'name',
    'symbol',
    'price_usd',
    'change_24h_pct',
    'change_7d_pct',
    'market_cap_usd',
    'volume_24h_usd',
  ];
  const rows = coins.map((c) => [
    c.market_cap_rank,
    c.name,
    c.symbol.toUpperCase(),
    c.current_price,
    c.change24h?.toFixed(2),
    c.change7d?.toFixed(2),
    c.market_cap,
    c.total_volume,
  ]);
  return [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\n');
}

export function exportCsv(coins: Coin[]) {
  download(new Blob([toCsv(coins)], { type: 'text/csv;charset=utf-8' }), `coins-${stamp()}.csv`);
}

const usd = (v: number | null | undefined, compact = false) =>
  v == null
    ? '-'
    : '$' +
      v.toLocaleString(
        'en-US',
        compact
          ? { notation: 'compact', maximumFractionDigits: 2 }
          : { maximumFractionDigits: v < 1 ? 6 : 2 },
      );

const pct = (v: number | null | undefined) =>
  v == null ? '-' : `${v > 0 ? '+' : ''}${v.toFixed(2)}%`;

/** PDF-отчёт. jsPDF подгружается только по клику — в основной бандл он не попадает. */
export async function exportPdf(coins: Coin[], title = 'Crypto market snapshot') {
  const [{ default: JsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const doc = new JsPDF({ orientation: 'landscape' });
  doc.setFont('courier', 'bold');
  doc.setFontSize(14);
  doc.text(title, 14, 16);
  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  doc.text(
    `Generated ${new Date().toUTCString()} - prices: CoinGecko, live ticks: Binance`,
    14,
    22,
  );
  autoTable(doc, {
    startY: 28,
    head: [['#', 'Coin', 'Price', '24h', '7d', 'Market cap', 'Volume 24h']],
    body: coins.map((c) => [
      c.market_cap_rank ?? '',
      `${c.name} (${c.symbol.toUpperCase()})`,
      usd(c.current_price),
      pct(c.change24h),
      pct(c.change7d),
      usd(c.market_cap, true),
      usd(c.total_volume, true),
    ]),
    styles: {
      font: 'courier',
      fontSize: 9,
      cellPadding: 2,
      lineColor: [217, 215, 208],
      lineWidth: 0.1,
    },
    headStyles: { fillColor: [22, 24, 29], textColor: [245, 244, 240] },
    columnStyles: {
      0: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right' },
    },
    theme: 'grid',
  });
  doc.save(`coins-${stamp()}.pdf`);
}
