export { catalogCategories } from './catalogCategories'

// The eight products shown in the approved catalog. Prices and stock are mock data.
export const catalogProducts = [
  {
    id: 'red-velvet',
    name: 'Red Velvet Cream Cheese Lava',
    image: '/images/red-velvet.jpg',
    badge: 'Best Seller',
    badgeStyle: 'bg-baked text-white',
    stockNote: 'Sisa 14 pcs',
    rating: 5.0,
    reviewCount: 915,
    description:
      'Adonan red velvet chewy dengan lelehan cream cheese New York yang lembut di setiap gigitan.',
    price: 34000,
    category: 'stuffed',
    variantSelect: false,
  },
  {
    id: 'classic-nyc',
    name: 'The OG Classic Chocochip NYC',
    image: '/images/classic-chocochip.jpg',
    badge: 'Favorit Sejak 2021',
    badgeStyle: 'bg-chocolate text-white',
    stockNote: 'Sisa 22 pcs',
    rating: 4.9,
    reviewCount: 840,
    description:
      'Kue signature dengan dark chocolate couverture 54% dan taburan fleur de sel.',
    price: 28000,
    category: 'signature',
    variantSelect: false,
  },
  {
    id: 'matcha-melt',
    name: 'Matcha White Choc Melt',
    image: '/images/matcha-white-chocolate.jpg',
    badge: 'Uji Matcha Asli',
    badgeStyle: 'bg-blush text-chocolate',
    stockNote: 'Sisa 9 pcs',
    rating: 4.8,
    reviewCount: 620,
    description:
      'Matcha ceremonial grade dari Uji, Kyoto berpadu manis legitnya white chocolate.',
    price: 32000,
    category: 'signature',
    variantSelect: false,
  },
  {
    id: 'dark-walnut',
    name: 'Triple Dark Choco Walnut',
    image: '/images/dark-choco-walnut.jpg',
    badge: 'Pecinta Dark Choc',
    badgeStyle: 'bg-blush text-chocolate',
    stockNote: 'Sisa 8 pcs',
    rating: 4.9,
    reviewCount: 480,
    description:
      '3 jenis cokelat pekat (70%, 54%, cocoa nibs) dipadu renyahnya kacang walnut panggang.',
    price: 32000,
    category: 'signature',
    variantSelect: false,
  },
  {
    id: 'biscoff-lotus',
    name: 'Biscoff Lotus Stuffed Cookie',
    image: '/images/biscoff-lotus.jpg',
    badge: 'Stuffed Lava',
    badgeStyle: 'bg-golden text-chocolate',
    stockNote: 'Sisa 5 pcs (Hampir Habis)',
    lowStock: true,
    rating: 4.9,
    reviewCount: 530,
    description:
      'Sensasi karamel rempah speculoos melimpah di dalam adonan mentega yang lembut.',
    price: 35000,
    category: 'stuffed',
    variantSelect: false,
  },
  {
    id: 'nutella-bomb',
    name: 'Nutella Hazelnut Bomb',
    image: '/images/nutella-hazelnut.jpg',
    badge: 'Lumer',
    badgeStyle: 'bg-blush text-chocolate',
    stockNote: 'Sisa 18 pcs',
    rating: 4.9,
    reviewCount: 710,
    description:
      'Isi pasta cokelat hazelnut lumer berlimpah dengan taburan kacang panggang.',
    price: 34000,
    category: 'stuffed',
    variantSelect: false,
  },
  {
    id: 'bundle-four',
    name: 'Box Bundle of 4 (Bebas Pilih)',
    image: '/images/box-bundle.jpg',
    badge: 'Bebas Pilih',
    badgeStyle: 'bg-primary text-chocolate',
    stockNote: 'Kemasan Box Cantik',
    rating: 5.0,
    reviewCount: 1200,
    description:
      'Paket favorit keluarga. Bebas mix & match 4 varian cookie kesukaanmu dalam satu box.',
    price: 118000,
    priceLabel: 'Paket Box',
    category: 'bundles',
    variantSelect: true,
    variants: ['Mix Favorit', 'Chocolate Lovers', 'Matcha & Choco'],
  },
  {
    id: 'hampers-ribbon',
    name: 'Hampers Spesial Pita (Isi 6)',
    image: '/images/hampers-pita.jpg',
    badge: 'Gift Ready',
    badgeStyle: 'bg-chocolate text-white',
    stockNote: 'Free Custom Card',
    rating: 5.0,
    reviewCount: 650,
    description:
      'Cocok untuk kado ulang tahun atau perayaan. Termasuk pita satin premium dan kartu ucapan.',
    price: 185000,
    priceLabel: 'Paket Hampers',
    category: 'bundles',
    variantSelect: true,
    variants: ['Mix Favorit', 'Chocolate Lovers', 'Matcha & Choco'],
  },
].map(withProductDetails)

// Extra local fixtures make Load More and every category usable without an API.
export const moreCatalogProducts = [
  {
    id: 'butter-sea-salt',
    name: 'Brown Butter Sea Salt Cookie',
    image: '/images/classic-chocochip.jpg',
    badge: 'Pure Butter',
    badgeStyle: 'bg-blush text-chocolate',
    stockNote: 'Sisa 16 pcs',
    rating: 4.8,
    reviewCount: 210,
    description:
      'Brown butter harum dengan cokelat Belgia dan sentuhan sea salt yang seimbang.',
    price: 30000,
    category: 'signature',
    variantSelect: false,
  },
  {
    id: 'salted-caramel',
    name: 'Salted Caramel Stuffed Cookie',
    image: '/images/biscoff-lotus.jpg',
    badge: 'Caramel Melt',
    badgeStyle: 'bg-primary text-chocolate',
    stockNote: 'Sisa 12 pcs',
    rating: 4.9,
    reviewCount: 185,
    description:
      'Cookie lembut berisi karamel asin yang lumer dengan taburan cokelat di atasnya.',
    price: 35000,
    category: 'stuffed',
    variantSelect: false,
  },
  {
    id: 'vegan-choco',
    name: 'Vegan Dark Chocolate Cookie',
    image: '/images/dark-choco-walnut.jpg',
    badge: 'Plant Based',
    badgeStyle: 'bg-blush text-chocolate',
    stockNote: 'Sisa 10 pcs',
    rating: 4.8,
    reviewCount: 140,
    description:
      'Dark chocolate intens dalam cookie berbahan nabati, tanpa susu dan telur.',
    price: 36000,
    category: 'vegan',
    variantSelect: false,
  },
  {
    id: 'gluten-free-almond',
    name: 'Gluten-Free Almond Cookie',
    image: '/images/matcha-white-chocolate.jpg',
    badge: 'Gluten-Free',
    badgeStyle: 'bg-blush text-chocolate',
    stockNote: 'Sisa 11 pcs',
    rating: 4.8,
    reviewCount: 125,
    description:
      'Cookie tepung almond bertekstur lembut dengan potongan cokelat pilihan.',
    price: 36000,
    category: 'vegan',
    variantSelect: false,
  },
].map(withProductDetails)

// Mock detail fields live alongside the catalog fixtures for future API replacement.
function withProductDetails(product) {
  const isBundle = product.category === 'bundles'
  return {
    ...product,
    detailBadge:
      product.id === 'red-velvet'
        ? 'Best Seller #1 Stuffed Cookie'
        : product.badge,
    batchNote: 'Freshly Baked Today • Batch Pagi',
    unitNote: isBundle
      ? `/ box (${product.id === 'bundle-four' ? '4' : '6'} pcs)`
      : '/ pcs (110gr)',
    packagingNote: 'Sudah Termasuk Pajak & Individual Food-Grade Pouch',
    fullDescription:
      product.id === 'red-velvet'
        ? 'Dibuat dari cocoa powder kualitas tinggi dengan sentuhan aroma vanilla alami dan warna crimson merah velvety yang memikat. Di dalamnya tersimpan keju New York cream cheese premium yang lembut, gurih, dan lumer begitu digigit.'
        : `${product.description} ${isBundle ? 'Dikemas dengan rapi untuk berbagi kebahagiaan bersama orang tersayang. Pilih kombinasi rasa favoritmu.' : 'Dipanggang dalam batch kecil untuk menghadirkan bagian luar yang renyah dan bagian tengah yang lembut. Nikmati bersama minuman favoritmu.'}`,
    galleryImages: [
      product.image,
      '/images/about-bakery.jpg',
      '/images/hero-cookies.jpg',
      isBundle ? '/images/box-bundle.jpg' : '/images/hampers-pita.jpg',
    ],
    relatedProductIds: [
      'matcha-melt',
      'dark-walnut',
      'coffee-latte',
      'classic-nyc',
    ]
      .filter((id) => id !== product.id)
      .slice(0, 3),
  }
}

// Pairing-only fixture keeps the catalog's existing twelve-product count unchanged.
const coffeePairing = {
  id: 'coffee-latte',
  name: 'Cold Brew Coffee Latte',
  image: '/images/coffee-latte.svg',
  badge: 'Minuman Teman Cookie',
  badgeStyle: 'bg-blush text-chocolate',
  rating: 4.8,
  reviewCount: 320,
  price: 25000,
  category: 'drinks',
  variantSelect: false,
  description:
    'Ekstraksi biji arabika 16 jam dengan fresh milk krimi. Pas menetralkan rasa manis cookie.',
  fullDescription:
    'Ekstraksi biji arabika 16 jam dengan fresh milk krimi. Pas menetralkan rasa manis cookie.',
  detailBadge: 'Minuman Teman Cookie',
  batchNote: 'Freshly Brewed Today',
  unitNote: '/ botol (250ml)',
  packagingNote: 'Sudah Termasuk Pajak & Botol Food-Grade',
  galleryImages: [
    '/images/coffee-latte.svg',
    '/images/coffee-latte.svg',
    '/images/coffee-latte.svg',
    '/images/coffee-latte.svg',
  ],
  relatedProductIds: ['red-velvet', 'matcha-melt', 'dark-walnut'],
}

export const detailProducts = [
  ...catalogProducts,
  ...moreCatalogProducts,
  coffeePairing,
]

export const productCategories = [
  { id: 'stuffed', label: 'Stuffed Lava' },
  { id: 'signature', label: 'Signature NYC' },
  { id: 'bundles', label: 'Hampers & Gift Box' },
  { id: 'seasonal', label: 'Seasonal Special' },
  { id: 'vegan', label: 'Gluten-Free & Vegan' },
  { id: 'drinks', label: 'Minuman' },
]

// One seed catalog for admin, storefront, cart, and checkout. Existing categories
// and the pairing-only drink are retained rather than relabeling customer data.
export const seedProducts = detailProducts.map((product, index) => ({
  ...product,
  sku: `HB-${
    product.id === 'red-velvet'
      ? 'RV'
      : product.id
          .split('-')
          .map((part) => part[0])
          .join('')
          .toUpperCase()
  }-${String(index + 1).padStart(2, '0')}`,
  stokDisplayEtalase: Number(product.stockNote?.match(/\d+/)?.[0] || 8),
  adonanDinginChiller:
    product.category === 'drinks' ? 0 : index === 0 ? 60 : 40,
  adonanDinginLokasi:
    index === 0 ? '3 Loyang di Chiller B' : '2 Loyang di Chiller A',
  suhuOvenIdeal: product.category === 'drinks' ? '' : '175°C',
  durasiPemanggangan: product.category === 'drinks' ? '' : '12 Menit',
  isLiveOnWebsite: true,
  isCatalogVisible: product.category !== 'drinks',
  deskripsiProduk: product.fullDescription,
}))
