import { supabase } from '@/lib/supabaseClient'
import { mapProduct } from './productMapper'

const selection = '*, categories(id, nama, slug)'

export async function getAdminProducts() {
  // Admin RLS allows drafts and products hidden from the catalog as well.
  const { data, error } = await supabase
    .from('products')
    .select(selection)
    .order('sku')
  if (error) throw error
  return (data || []).map(mapProduct)
}

export function slugifyProductName(name) {
  return (
    name
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/[\s-]+/g, '-') || 'produk'
  )
}

export function productWriteValues(values, categories) {
  const category = categories.find((item) => item.id === values.categoryId)
  if (!values.name?.trim()) throw new Error('Nama varian cookie wajib diisi.')
  if (!category) throw new Error('Pilih kategori menu yang tersedia.')
  if (!Number.isSafeInteger(Number(values.price)) || Number(values.price) <= 0)
    throw new Error('Masukkan harga satuan lebih dari Rp 0 (rupiah bulat).')
  for (const key of ['stokDisplayEtalase', 'adonanDinginChiller']) {
    if (
      values[key] === '' ||
      !Number.isSafeInteger(Number(values[key])) ||
      Number(values[key]) < 0
    )
      throw new Error('Stok dan adonan harus berupa jumlah bulat minimal 0.')
  }
  const variants = Array.isArray(values.variants)
    ? values.variants
    : String(values.variants || '').split(',')
  // Explicit allowlist: never write id, slug (on edit), rating or review counts.
  return {
    sku:
      values.sku?.trim() ||
      `HB-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    nama: values.name.trim(),
    category_id: category.id,
    harga: Number(values.price),
    stok_siap_jual: Number(values.stokDisplayEtalase),
    adonan_dingin: Number(values.adonanDinginChiller),
    lokasi_adonan: values.adonanDinginLokasi?.trim() || '',
    suhu_oven: values.suhuOvenIdeal === '' ? null : values.suhuOvenIdeal,
    durasi_panggang:
      values.durasiPemanggangan === '' ? null : values.durasiPemanggangan,
    deskripsi: values.deskripsiProduk?.trim() || '',
    deskripsi_singkat: values.description?.trim() || '',
    badge: values.badge?.trim() || '',
    satuan: values.unitNote?.trim() || '',
    varian:
      category.slug === 'bundles'
        ? [...new Set(variants.map((item) => item.trim()).filter(Boolean))]
        : [],
    gambar_url: values.image || '',
    is_live: values.isLiveOnWebsite === true,
    is_catalog_visible: values.isCatalogVisible === true,
  }
}

export async function createProduct(values, categories) {
  const payload = productWriteValues(values, categories)
  const base = slugifyProductName(payload.nama)
  // Includes drafts. Query only matching candidates; pick the first free suffix.
  const { data, error } = await supabase
    .from('products')
    .select('slug')
    .like('slug', `${base}%`)
  if (error) throw error
  const used = new Set((data || []).map((row) => row.slug))
  let suffix = 1
  for (let attempt = 0; attempt < 10; attempt++) {
    while (used.has(suffix === 1 ? base : `${base}-${suffix}`)) suffix++
    const slug = suffix === 1 ? base : `${base}-${suffix}`
    const result = await supabase
      .from('products')
      .insert({ ...payload, slug })
      .select(selection)
      .single()
    if (!result.error) return mapProduct(result.data)
    if (result.error.code !== '23505') throw result.error
    // A concurrent admin may take the slug after the first read. Retry only
    // if this slug now exists; a duplicate SKU is a separate, visible error.
    const check = await supabase
      .from('products')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()
    if (check.error) throw check.error
    if (!check.data) throw result.error
    used.add(slug)
  }
  throw new Error('Nama produk sedang digunakan. Coba simpan kembali.')
}

export async function updateProduct(id, values, categories) {
  const payload = productWriteValues(values, categories)
  const { data, error } = await supabase
    .from('products')
    .update(payload)
    .eq('id', id)
    .select(selection)
    .single()
  if (error) throw error
  return mapProduct(data)
}

export async function removeProduct(id) {
  const { data, error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .select('id')
    .single()
  if (error) throw error
  return data.id
}
