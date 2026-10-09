export const customerOrderLabels = {
  menunggu_pembayaran: 'Menunggu Pembayaran',
  menunggu_konfirmasi: 'Menunggu Konfirmasi Pembayaran',
  diproses: 'Pesanan Diproses',
  qc_packing: 'QC & Packing',
  dikirim: 'Sedang Dikirim',
  selesai: 'Pesanan Selesai',
  dibatalkan: 'Dibatalkan',
}
export const customerOrderTabs = [
  { id: 'all', label: 'Semua Pesanan' },
  ...Object.entries(customerOrderLabels).map(([id, label]) => ({ id, label })),
]

export function mapCustomerOrder(row) {
  const payments = Array.isArray(row.payments)
    ? row.payments
    : row.payments
      ? [row.payments]
      : []
  const payment = [...payments].sort(
    (a, b) => Date.parse(b.uploaded_at) - Date.parse(a.uploaded_at),
  )[0]
  return {
    id: row.id,
    number: row.no_pesanan,
    timestamp: row.created_at,
    status: row.status_pesanan,
    deadline: row.batas_bayar,
    recipient: {
      name: row.nama_penerima,
      whatsapp: row.no_whatsapp,
      email: row.email,
    },
    address: [row.alamat, row.kota, row.kode_pos].filter(Boolean).join(', '),
    courierNote: row.catatan_kurir || '',
    deliveryMethod: row.metode_kirim || '-',
    greeting: row.kartu_ucapan || '',
    subtotal: Number(row.subtotal),
    shipping: Number(row.ongkir),
    total: Number(row.total),
    sectionLabel: 'DAFTAR COOKIE DALAM PAKET',
    items: (row.order_items || []).map((item) => ({
      id: item.id,
      productId: item.product_id,
      name: item.nama_produk,
      // Only the image comes from the current product; invoice data stays historical.
      image: item.products?.gambar_url || '',
      price: Number(item.harga_satuan),
      quantity: Number(item.jumlah),
      variant: item.suhu_penyajian || '',
    })),
    paymentMethod: 'QRIS',
    paymentStatus: payment
      ? {
          lunas: 'Lunas',
          menunggu_verifikasi: 'Menunggu Verifikasi',
          ditolak: 'Ditolak',
        }[payment.status] || payment.status
      : 'Belum Dibayar',
    payment: payment
      ? {
          sender: payment.nama_pengirim,
          path: payment.bukti_url,
          amount: Number(payment.nominal),
          uploadedAt: payment.uploaded_at,
        }
      : null,
  }
}
