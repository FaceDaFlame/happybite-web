import { customerName } from '@/data/orderFulfillment'
import { formatOrderDate, formatRupiah } from '@/data/orderHistory'
import { periodLabel, reportStats } from './salesReport'
import { orderStatusLabels } from '@/services/adminOrderService'
import { paymentStatusLabel } from './salesReport'

function download(contents, type, filename) {
  const url = URL.createObjectURL(new Blob([contents], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function exportReportCsv(orders, start, end) {
  // Excel export is UTF-8 CSV, not an .xlsx workbook. Never mislabel its extension.
  const cell = (value) => {
    const text = String(value ?? '')
    return `"${(/^[\s]*[=+@-]/.test(text) ? "'" + text : text).replaceAll('"', '""')}"`
  }
  const rows = [
    [
      'Tanggal & Waktu (WIB)',
      'No. Pesanan',
      'Pelanggan',
      'Telepon',
      'Rincian Item',
      'Total Nominal',
      'Status Pembayaran',
      'Status Pesanan',
    ],
    ...orders.map((o) => [
      formatOrderDate(o.timestamp),
      o.number,
      customerName(o),
      o.recipient?.whatsapp,
      o.items.map((i) => `${i.quantity}x ${i.name}`).join('; '),
      o.total,
      paymentStatusLabel(o),
      orderStatusLabels[o.status] || o.status,
    ]),
  ]
  download(
    '\uFEFF' + rows.map((row) => row.map(cell).join(',')).join('\r\n'),
    'text/csv;charset=utf-8',
    `HappyBite-Laporan-${start}-${end}.csv`,
  )
}

export function exportReportPdf(orders, start, end) {
  // Practical printable text PDF with real qualifying orders; charts remain in the app.
  const stats = reportStats(orders)
  const lines = [
    'HappyBite - Laporan Penjualan & Analisis Finansial',
    periodLabel(start, end),
    `Total Pendapatan: ${formatRupiah(stats.total)}`,
    `Total Pesanan: ${stats.count}`,
    `Rata-rata Order: ${formatRupiah(Math.round(stats.aov))}`,
    `Produk Terlaris: ${stats.top?.name || '-'}`,
    'Hanya pesanan lunas dan tidak dibatalkan; pendapatan termasuk ongkir.',
    '',
    ...orders.flatMap((o) => [
      `${o.number} | ${formatOrderDate(o.timestamp)}`,
      `${customerName(o)} | ${o.recipient?.whatsapp || '-'}`,
      ...o.items.map(
        (i) => `${i.quantity}x ${i.name} @ ${formatRupiah(i.price)}`,
      ),
      `Total: ${formatRupiah(o.total)} | ${paymentStatusLabel(o)}`,
      '',
    ]),
  ].flatMap((line) => String(line).match(/.{1,88}/g) || [''])
  const escape = (value) =>
    value
      .normalize('NFKD')
      .replace(/[^\x20-\x7E]/g, ' ')
      .replace(/([\\()])/g, '\\$1')
  const pages = []
  for (let i = 0; i < lines.length; i += 40) pages.push(lines.slice(i, i + 40))
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${pages.map((_, i) => `${4 + i * 2} 0 R`).join(' ')}] /Count ${pages.length} >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ]
  pages.forEach((page, i) => {
    const stream = `BT /F1 10 Tf 40 790 Td 18 TL\n${page.map((line) => `(${escape(line)}) Tj T*`).join('\n')}\nET`
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${5 + i * 2} 0 R >>`,
      `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    )
  })
  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach((object, i) => {
    offsets.push(pdf.length)
    pdf += `${i + 1} 0 obj\n${object}\nendobj\n`
  })
  const xref = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, '0')} 00000 n `)
    .join(
      '\n',
    )}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  download(pdf, 'application/pdf', `HappyBite-Laporan-${start}-${end}.pdf`)
}
