import { supabase } from '@/lib/supabaseClient'
import { isUuid } from '@/data/cartSnapshot'
import { mapCustomerOrder } from '@/data/customerOrders'

export async function getMyOrders(userId) {
  if (!userId) return []
  const { data, error } = await supabase
    .from('orders')
    .select(
      '*, order_items(id, order_id, product_id, nama_produk, harga_satuan, jumlah, suhu_penyajian, products(gambar_url)), payments(id, order_id, nominal, bukti_url, nama_pengirim, status, uploaded_at, verified_at)',
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('getMyOrders', error)
    throw error
  }
  return (data || []).map(mapCustomerOrder)
}

export async function confirmOrderReceived(orderId) {
  const { data, error } = await supabase.rpc('konfirmasi_pesanan_selesai', {
    p_order_id: orderId,
  })
  if (error) {
    console.error('konfirmasi_pesanan_selesai', error)
    throw error
  }
  return data
}

export async function getMyPaymentProofUrl(path) {
  const { data, error } = await supabase.storage
    .from('payment-proofs')
    .createSignedUrl(path, 300)
  if (error) {
    console.error('getMyPaymentProofUrl', error)
    throw error
  }
  return data.signedUrl
}

export function orderErrorMessage(error) {
  const message = error?.message || ''
  if (/batas.*waktu|waktu.*(lewat|habis)|expired/i.test(message))
    return 'Batas waktu pembayaran sudah lewat.'
  if (/stok.*(cukup|habis|tersedia)/i.test(message)) return message
  if (
    /^(Format file harus|Ukuran file maksimal|File bukti pembayaran kosong)/.test(
      message,
    )
  )
    return message
  return 'Terjadi kesalahan, coba lagi.'
}

export async function createOrder(cartItems, form) {
  const items = cartItems.filter((item) => item.selected !== false)
  if (!items.length) throw new Error('Keranjang kosong.')
  const p_items = items.map((item) => {
    if (
      !isUuid(item.id) ||
      !Number.isSafeInteger(item.quantity) ||
      item.quantity < 1
    )
      throw new Error('Item keranjang tidak valid.')
    const temperature = item.suhu_penyajian?.trim()
    return {
      product_id: item.id,
      jumlah: item.quantity,
      ...(temperature && { suhu_penyajian: temperature }),
    }
  })
  // Only identifiers and quantities: all product prices/totals and stock changes
  // are calculated atomically by the RPC. There is no local order persistence.
  const { data, error } = await supabase.rpc('buat_pesanan', {
    p_items,
    p_nama_penerima: form.name.trim(),
    p_no_whatsapp: form.whatsapp.trim(),
    p_email: form.email.trim(),
    p_alamat: form.address.trim(),
    p_kota: form.city,
    p_kode_pos: form.postalCode.trim(),
    p_catatan_kurir: form.notes.trim(),
    p_metode_kirim: form.deliveryMethod || 'Belum ditentukan',
    p_kartu_ucapan: form.greeting || '',
    p_ongkir: form.shipping ?? 0,
  })
  if (error) throw error
  const order = Array.isArray(data) ? data[0] : data
  if (!isUuid(order?.id)) throw new Error('Respons pesanan tidak valid.')
  return order
}

export async function getOrderById(orderId) {
  if (!isUuid(orderId)) return null
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle()
  if (error) throw error
  return data
}

// Supplementary display query. The order_items schema was not supplied:
// use conventional FK/snapshot columns and fail separately from payment if
// they differ. Never substitute cart prices for the saved invoice prices.
export async function getOrderItems(orderId) {
  const { data, error } = await supabase
    .from('order_items')
    .select('*, products(nama, gambar_url)')
    .eq('order_id', orderId)
  if (error) throw error
  return (data || []).map((item) => {
    if (
      item.harga_satuan == null ||
      !Number.isFinite(Number(item.harga_satuan)) ||
      !Number.isSafeInteger(Number(item.jumlah))
    )
      throw new Error('Rincian menu belum dapat dimuat.')
    return {
      id: item.id,
      quantity: Number(item.jumlah),
      variant: item.suhu_penyajian || '',
      product: {
        name: item.nama_produk || item.products?.nama || 'Produk',
        image: item.gambar_url || item.products?.gambar_url || '',
        price: Number(item.harga_satuan),
      },
    }
  })
}

export function validatePaymentProof(file) {
  const extensions = {
    'image/jpeg': /\.jpe?g$/i,
    'image/png': /\.png$/i,
    'image/webp': /\.webp$/i,
  }
  if (
    !file ||
    !Object.hasOwn(extensions, file.type) ||
    !extensions[file.type].test(file.name)
  )
    throw new Error('Format file harus JPG, PNG, atau WEBP.')
  if (file.size > 2 * 1024 * 1024) throw new Error('Ukuran file maksimal 2 MB.')
  if (!file.size) throw new Error('File bukti pembayaran kosong.')
}

export function sanitizeProofName(name) {
  const dot = name.lastIndexOf('.')
  const stem =
    name
      .slice(0, dot)
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 100) || 'bukti-pembayaran'
  return `${stem}.${name.slice(dot + 1).toLowerCase()}`
}

export async function uploadPaymentProof(orderId, userId, file) {
  validatePaymentProof(file)
  if (!isUuid(orderId) || !isUuid(userId))
    throw new Error('Pesanan tidak valid.')
  const path = `${userId}/${orderId}/${Date.now()}-${sanitizeProofName(file.name)}`
  const { error } = await supabase.storage
    .from('payment-proofs')
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    })
  if (error) throw error
  return path
}

export async function submitPaymentProof(orderId, path, senderName) {
  const { data, error } = await supabase.rpc('kirim_bukti_bayar', {
    p_order_id: orderId,
    p_path: path,
    p_nama_pengirim: senderName.trim(),
  })
  if (error) throw error
  return data
}
