import { orderStatusLabels } from '@/services/adminOrderService'
import { customerName } from '@/data/orderFulfillment'

export function exportOrdersCsv(orders) {
  // Quote all cells and neutralize spreadsheet formulas in customer-entered text.
  const cell = (value) => {
    const text = String(value ?? '')
    const safe = /^[\s]*[=+@-]/.test(text) ? `'${text}` : text
    return `"${safe.replaceAll('"', '""')}"`
  }
  const rows = [
    [
      'Nomor Pesanan',
      'Waktu',
      'Pelanggan',
      'Telepon',
      'Alamat',
      'Catatan Kurir',
      'Item',
      'Total',
      'Status',
      'Metode Kirim',
      'Status Pembayaran',
      'Sumber',
    ],
    ...orders.map((order) => [
      order.number,
      order.timestamp,
      customerName(order),
      order.recipient?.whatsapp,
      order.address,
      order.courierNote,
      order.items.map((item) => `${item.quantity}x ${item.name}`).join('; '),
      order.total,
      orderStatusLabels[order.status] || order.status,
      order.deliveryMethod || 'Belum ditentukan',
      order.paymentStatus,
      order.source === 'sample' ? 'Demo' : 'Checkout',
    ]),
  ]
  const url = URL.createObjectURL(
    new Blob(
      ['\uFEFF', rows.map((row) => row.map(cell).join(',')).join('\r\n')],
      { type: 'text/csv;charset=utf-8' },
    ),
  )
  const link = document.createElement('a')
  link.href = url
  link.download = 'HappyBite-Pesanan.csv'
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
