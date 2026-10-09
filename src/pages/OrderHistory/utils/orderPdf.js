import { customerOrderLabels } from '@/data/customerOrders'
import { formatOrderDate, formatRupiah } from '@/data/orderHistory'

// Text-only order summary using the immutable order_items snapshot.
export function downloadOrderPdf(order) {
  const lines = [
    'HappyBite - Ringkasan Pesanan',
    `Invoice: ${order.number}`,
    `Tanggal: ${formatOrderDate(order.timestamp)}`,
    `Status: ${customerOrderLabels[order.status]}`,
    '',
    ...order.items.map(
      (item) =>
        `${item.name} (${item.quantity} pcs) - ${formatRupiah(item.quantity * item.price)}`,
    ),
    '',
    `Subtotal: ${formatRupiah(order.subtotal)}`,
    `Pengiriman: ${formatRupiah(order.shipping)}`,
    `Total: ${formatRupiah(order.total)}`,
    `Pembayaran: ${order.paymentStatus} (${order.paymentMethod})`,
    '',
    'Ringkasan pesanan HappyBite.',
  ]
  const escape = (value) =>
    value
      .normalize('NFKD')
      .replace(/[^\x20-\x7E]/g, ' ')
      .replace(/([\\()])/g, '\\$1')
  const stream = `BT /F1 11 Tf 50 790 Td 18 TL\n${lines.map((line) => `(${escape(line)}) Tj T*`).join('\n')}\nET`
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ]
  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach((object, index) => {
    offsets.push(pdf.length)
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })
  const xref = pdf.length
  pdf += `xref\n0 6\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, '0')} 00000 n `)
    .join('\n')}\ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  const url = URL.createObjectURL(new Blob([pdf], { type: 'application/pdf' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `${order.number}.pdf`
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
