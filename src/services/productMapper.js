export function getBadgeStyle(badge) {
  const styles = {
    'Best Seller': 'bg-baked text-white',
    'Favorit Sejak 2021': 'bg-chocolate text-white',
    'Stuffed Lava': 'bg-golden text-chocolate',
    'Bebas Pilih': 'bg-primary text-chocolate',
    'Gift Ready': 'bg-chocolate text-white',
    'Caramel Melt': 'bg-primary text-chocolate',
  }
  return styles[badge] || 'bg-blush text-chocolate'
}

export function mapProduct(row) {
  const category = row.categories?.slug || ''
  const stock = Number(row.stok_siap_jual) || 0
  const variants = Array.isArray(row.varian) ? row.varian : []
  const image = row.gambar_url || '/images/classic-chocochip.jpg'
  const drinks = category === 'drinks'
  return {
    id: row.id,
    slug: row.slug,
    sku: row.sku,
    gambarUrl: row.gambar_url || '',
    adonanDinginLokasi: row.lokasi_adonan || '',
    suhuOvenIdeal: row.suhu_oven ?? '',
    durasiPemanggangan: row.durasi_panggang ?? '',
    deskripsiProduk: row.deskripsi || '',
    name: row.nama,
    image,
    badge: row.badge || '',
    badgeStyle: getBadgeStyle(row.badge),
    stockNote:
      stock <= 5
        ? `Sisa ${stock} pcs (Hampir Habis)`
        : row.catatan_stok || `Sisa ${stock} pcs`,
    lowStock: stock <= 5,
    rating: Number(row.rating) || 0,
    reviewCount: Number(row.jumlah_ulasan) || 0,
    description: row.deskripsi_singkat || '',
    fullDescription: row.deskripsi || '',
    price: Number(row.harga) || 0,
    category,
    categoryId: row.category_id,
    categoryName: row.categories?.nama || '',
    variantSelect: variants.length > 0,
    variants,
    unitNote: row.satuan || '',
    galleryImages: [
      image,
      ...(Array.isArray(row.galeri) ? row.galeri : []),
    ].filter(Boolean),
    batchNote: drinks
      ? 'Freshly Brewed Today'
      : 'Freshly Baked Today • Batch Pagi',
    packagingNote: drinks
      ? 'Sudah Termasuk Pajak & Botol Food-Grade'
      : 'Sudah Termasuk Pajak & Individual Food-Grade Pouch',
    detailBadge:
      row.slug === 'red-velvet'
        ? 'Best Seller #1 Stuffed Cookie'
        : row.badge || '',
    priceLabel: category === 'bundles' ? 'Paket Box' : 'Harga Satuan',
    stokDisplayEtalase: stock,
    adonanDinginChiller: Number(row.adonan_dingin) || 0,
    isLiveOnWebsite: row.is_live,
    isCatalogVisible: row.is_catalog_visible,
  }
}

// The schema has no separate made-to-order flag: available chilled dough is
// the exception that allows a product with an empty display to be ordered.
export const isProductSoldOut = (product) =>
  product.stokDisplayEtalase === 0 && !(product.adonanDinginChiller > 0)
