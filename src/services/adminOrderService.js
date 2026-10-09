import { supabase } from '@/lib/supabaseClient'

export const orderStatusLabels = {
  menunggu_pembayaran: 'Menunggu Pembayaran',
  menunggu_konfirmasi: 'Menunggu Konfirmasi',
  diproses: 'Sedang Dipanggang',
  qc_packing: 'QC & Packing',
  dikirim: 'Sedang Dikirim',
  selesai: 'Selesai',
  dibatalkan: 'Dibatalkan',
}
export const adminOrderTabs = [
  { id: 'all', label: 'Semua Pesanan' },
  { id: 'menunggu_konfirmasi', label: 'Menunggu Konfirmasi' },
  { id: 'diproses', label: 'Sedang Dipanggang' },
  { id: 'qc_packing', label: 'QC & Packing' },
  { id: 'dikirim', label: 'Sedang Dikirim' },
]
const paymentLabels = {
  menunggu_verifikasi: 'Menunggu Verifikasi',
  lunas: 'Lunas',
  ditolak: 'Ditolak',
}

export function mapAdminOrder(row) {
  const payments = Array.isArray(row.payments)
    ? row.payments
    : row.payments
      ? [row.payments]
      : []
  const latest = [...payments].sort(
    (a, b) =>
      (Date.parse(b.uploaded_at) || 0) - (Date.parse(a.uploaded_at) || 0),
  )[0]
  return {
    id: row.id,
    number: row.no_pesanan,
    source: 'database',
    timestamp: row.created_at,
    status: row.status_pesanan,
    recipient: {
      name: row.nama_penerima,
      whatsapp: row.no_whatsapp,
      email: row.email,
    },
    address: [row.alamat, row.kota, row.kode_pos].filter(Boolean).join(', '),
    courierNote: row.catatan_kurir || '',
    deliveryMethod: row.metode_kirim || 'Belum ditentukan',
    greeting: row.kartu_ucapan || '',
    subtotal: Number(row.subtotal),
    shipping: Number(row.ongkir),
    total: Number(row.total),
    items: (row.order_items || []).map((item, index) => ({
      id: `${row.id}-${index}`,
      productId: item.product_id,
      name: item.nama_produk,
      price: Number(item.harga_satuan),
      quantity: Number(item.jumlah),
      variant: item.suhu_penyajian || '',
    })),
    paymentStatus: latest
      ? paymentLabels[latest.status] || latest.status
      : 'Belum Ada Bukti',
    payment: latest
      ? {
          path: latest.bukti_url,
          sender: latest.nama_pengirim || '',
          amount: Number(latest.nominal),
          uploadedAt: latest.uploaded_at,
          verifiedAt: latest.verified_at,
          status: latest.status,
        }
      : null,
  }
}

export async function getAllOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*), payments(*)')
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) throw error
  return (data || []).map(mapAdminOrder)
}

// Reports need the full sales history, while the live operations table is
// intentionally capped to its newest 200 rows. Page through Supabase here.
export async function getReportOrders() {
  const pageSize = 500
  const rows = []
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from('orders')
      .select(
        '*, order_items(id, product_id, nama_produk, harga_satuan, jumlah), payments(id, nominal, status, uploaded_at)',
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)
    if (error) {
      console.error('getReportOrders', error)
      throw error
    }
    rows.push(...(data || []))
    if (!data || data.length < pageSize) break
  }
  return rows.map(mapAdminOrder)
}

export async function getPaymentProofUrl(path) {
  const { data, error } = await supabase.storage
    .from('payment-proofs')
    .createSignedUrl(path, 300)
  if (error) throw error
  if (!data?.signedUrl) throw new Error('Bukti pembayaran belum dapat dimuat.')
  return data.signedUrl
}
export async function verifyPayment(orderId, approve) {
  const { data, error } = await supabase.rpc('verifikasi_pembayaran', {
    p_order_id: orderId,
    p_setuju: approve,
  })
  if (error) throw error
  return data
}
export async function changeOrderStatus(orderId, newStatus) {
  const { data, error } = await supabase.rpc('ubah_status_pesanan', {
    p_order_id: orderId,
    p_status: newStatus,
  })
  if (error) throw error
  return data
}
export async function cancelOrder(orderId) {
  const { data, error } = await supabase.rpc('batalkan_pesanan', {
    p_order_id: orderId,
  })
  if (error) throw error
  return data
}
export function adminOrderError(error) {
  if (/status|transition|diizinkan/i.test(error?.message || ''))
    return 'Perubahan status tidak diizinkan.'
  return 'Terjadi kesalahan, coba lagi.'
}
