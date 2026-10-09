import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Icon from '@/components/Icon'
import SiteDialog from '@/components/SiteDialog'
import CatalogProductCard from '@/pages/CatalogMenu/components/CatalogProductCard'
import CatalogVariantDialog from '@/pages/CatalogMenu/components/CatalogVariantDialog'
import { catalogCategories } from '@/data/catalogCategories'
import { getCatalogProducts } from '@/services/productService'
import useProductRequest from '@/hooks/useProductRequest'
import ProductRequestStatus from '@/components/ProductRequestStatus'

export default function CatalogMenu({ cartCount, onAddToCart }) {
  const { data, loading, error, retry } = useProductRequest(getCatalogProducts)
  const allProducts = data || []
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [visibleCount, setVisibleCount] = useState(8)
  const [wishlist, setWishlist] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [dialog, setDialog] = useState(null)
  const [notice, setNotice] = useState('')
  const search = useRef(null)
  const navigate = useNavigate()
  const openAccount = () => navigate('/login')
  const filtered = allProducts.filter(
    (product) =>
      (category === 'all' || product.category === category) &&
      `${product.name} ${product.description}`
        .toLocaleLowerCase('id-ID')
        .includes(query.trim().toLocaleLowerCase('id-ID')),
  )
  const visibleProducts = filtered.slice(0, visibleCount)

  function addProduct(product, variant) {
    onAddToCart(product, 1, variant)
    setSelectedProduct(null)
    setNotice(
      `${product.name}${variant ? ` — ${variant}` : ''} ditambahkan ke keranjang.`,
    )
  }

  function toggleWishlist(id) {
    setWishlist((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    )
  }

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <a
        href="#catalog-main"
        className="fixed left-4 top-4 z-50 -translate-y-24 rounded-full bg-baked px-5 py-3 text-white focus:translate-y-0"
      >
        Langsung ke katalog
      </a>
      <Navbar
        onAccount={openAccount}
        onSearch={() => {
          search.current?.scrollIntoView({ block: 'center' })
          search.current?.focus({ preventScroll: true })
        }}
        cartCount={cartCount}
      />
      <main id="catalog-main" className="flex-1 bg-canvas">
        <div className="mx-auto max-w-[1320px] px-5 pb-12 pt-10 sm:pt-16 lg:px-8 lg:pt-20">
          <nav
            aria-label="Breadcrumb"
            className="mb-4 flex items-center gap-2 text-xs font-semibold"
          >
            <Link to="/" className="text-muted hover:text-baked">
              Beranda
            </Link>
            <Icon name="chevronRight" className="h-3 w-3" />
            <span aria-current="page">Katalog Menu</span>
          </nav>
          <span className="inline-flex items-center gap-2 rounded-full bg-blush px-3.5 py-1.5 text-[11px] font-bold">
            <Icon name="cookie" className="h-4 w-4 text-baked" />
            ARTISAN RECIPE • 100% PURE BUTTER
          </span>
          <h1 className="mt-4 text-3xl font-bold leading-tight tracking-[-1px] sm:text-[40px]">
            Katalog Artisan Cookie & Hampers
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-muted sm:text-base">
            Dipanggang fresh setiap pagi dengan mentega murni Prancis dan
            Belgian chocolate couverture. Tekstur renyah di luar, leleh & chewy
            di dalam. Pilih favoritmu hari ini!
          </p>

          <div className="mt-10 sm:mt-14">
            <label htmlFor="catalog-search" className="sr-only">
              Cari rasa cookie, bahan, atau paket hampers
            </label>
            <div className="flex min-h-12 w-full max-w-xl items-center gap-3 rounded-full bg-white px-4 shadow-soft focus-within:ring-2 focus-within:ring-terracotta/30">
              <Icon name="search" className="h-4 w-4 text-muted" />
              <input
                ref={search}
                id="catalog-search"
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setVisibleCount(8)
                }}
                placeholder="Cari rasa cookie, bahan, atau paket hampers..."
                className="min-w-0 flex-1 border-0 bg-transparent py-3 text-sm outline-none placeholder:text-muted focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('')
                    setVisibleCount(8)
                    search.current?.focus()
                  }}
                  aria-label="Hapus pencarian"
                  className="rounded-full p-1 hover:bg-peach"
                >
                  <Icon name="close" className="h-4 w-4" />
                </button>
              )}
            </div>
            <div
              role="group"
              aria-label="Filter kategori"
              className="mt-4 flex flex-wrap gap-2"
            >
              {catalogCategories.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  aria-pressed={category === item.id}
                  onClick={() => {
                    setCategory(item.id)
                    setVisibleCount(8)
                  }}
                  className={`rounded-full px-4 py-2.5 text-xs font-semibold transition-colors ${category === item.id ? 'bg-baked text-white shadow-soft' : 'bg-peach hover:bg-blush'}`}
                >
                  {item.label} (
                  {item.id === 'all'
                    ? allProducts.length
                    : allProducts.filter(
                        (product) => product.category === item.id,
                      ).length}
                  )
                </button>
              ))}
            </div>
          </div>

          <div role="status" aria-live="polite" className="sr-only">
            {!loading && !error && `${filtered.length} produk ditemukan.`}
          </div>
          <div
            className="mt-10 grid gap-x-5 gap-y-6 sm:grid-cols-2 lg:grid-cols-4"
            aria-label="Daftar produk"
          >
            {visibleProducts.map((product) => (
              <CatalogProductCard
                key={product.id}
                product={product}
                wished={wishlist.includes(product.id)}
                onWishlist={toggleWishlist}
                onAdd={addProduct}
                onSelect={setSelectedProduct}
              />
            ))}
          </div>
          {loading || error ? (
            <ProductRequestStatus loading={loading} onRetry={retry} />
          ) : filtered.length === 0 ? (
            <div className="rounded-[30px] bg-white px-6 py-12 text-center shadow-soft">
              <Icon
                name="search"
                className="mx-auto mb-4 h-8 w-8 text-primary"
              />
              <h2 className="text-lg font-bold">Belum ada cookie yang cocok</h2>
              <p className="mt-2 text-sm text-muted">
                Coba kata kunci lain atau lihat semua varian favorit kami.
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  setCategory('all')
                  setVisibleCount(8)
                }}
                className="mt-5 rounded-full bg-terracotta px-5 py-3 text-sm font-bold text-white hover:bg-baked"
              >
                Lihat Semua Varian
              </button>
            </div>
          ) : (
            <div className="mt-12 flex flex-col items-center gap-4 text-center">
              <p className="text-sm font-medium">
                Menampilkan {visibleProducts.length} dari {filtered.length}{' '}
                varian produk pilihan
              </p>
              <progress
                aria-label="Jumlah produk yang ditampilkan"
                value={visibleProducts.length}
                max={filtered.length}
                className="h-2 w-64 max-w-full overflow-hidden rounded-full border-0 bg-blush [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-baked [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-blush [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-baked"
              />
              {visibleProducts.length < filtered.length ? (
                <button
                  type="button"
                  onClick={() => setVisibleCount((current) => current + 4)}
                  className="inline-flex items-center gap-2 rounded-full bg-blush/70 px-6 py-3 text-sm font-bold hover:bg-blush"
                >
                  Muat Lebih Banyak Varian (Load More)
                  <Icon name="chevronDown" className="h-4 w-4" />
                </button>
              ) : (
                <p className="text-xs text-muted">
                  Semua varian sudah ditampilkan.
                </p>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer onAccount={openAccount} onInfo={setDialog} />
      {notice && (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 z-40 flex w-[calc(100%-2.5rem)] max-w-md -translate-x-1/2 items-center gap-3 rounded-2xl border border-primary/30 bg-white p-4 text-sm shadow-warm"
        >
          <Icon name="bag" className="h-5 w-5 text-baked" />
          <p className="flex-1">{notice}</p>
          <button
            type="button"
            onClick={() => setNotice('')}
            aria-label="Tutup pemberitahuan"
            className="rounded-full p-1 hover:bg-peach"
          >
            <Icon name="close" className="h-4 w-4" />
          </button>
        </div>
      )}
      {selectedProduct && (
        <CatalogVariantDialog
          key={selectedProduct.id}
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAdd={addProduct}
        />
      )}
      {dialog && (
        <SiteDialog
          kind={dialog}
          onClose={() => setDialog(null)}
          onAccount={openAccount}
        />
      )}
    </div>
  )
}
