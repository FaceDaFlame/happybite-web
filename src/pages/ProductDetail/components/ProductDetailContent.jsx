import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Icon from '@/components/Icon'
import SiteDialog from '@/components/SiteDialog'
import ProductGallery from '@/pages/ProductDetail/components/ProductGallery'
import RelatedProductCard from '@/pages/ProductDetail/components/RelatedProductCard'
import { catalogCategories } from '@/data/catalogCategories'
import ProductRequestStatus from '@/components/ProductRequestStatus'
import { isProductSoldOut } from '@/services/productMapper'

const rupiah = (value) => `Rp ${value.toLocaleString('id-ID')}`
export default function ProductDetailContent({
  product,
  cartCount,
  onAddToCart,
  onBuyNow,
  related = [],
  relatedError,
  loading,
  error,
  onRetry,
}) {
  const navigate = useNavigate()
  const [quantity, setQuantity] = useState(1)
  const [variant, setVariant] = useState(product?.variants?.[0] || '')
  const [dialog, setDialog] = useState(null)
  const [notice, setNotice] = useState('')
  const openAccount = () => navigate('/login')
  const category =
    product?.categoryName ||
    catalogCategories.find((item) => item.id === product?.category)?.label ||
    'Minuman Teman Cookie'
  const soldOut = product ? isProductSoldOut(product) : false

  function addProduct(item, count = 1) {
    if (isProductSoldOut(item)) return
    onAddToCart(
      item,
      count,
      item.id === product.id ? variant : item.variants?.[0] || '',
    )
    setNotice(`${count} ${item.name} ditambahkan ke keranjang.`)
  }

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <Navbar
        cartCount={cartCount}
        onAccount={openAccount}
        onSearch={() => navigate('/katalog#catalog-search')}
      />
      <main className="flex-1 bg-canvas">
        {loading || error ? (
          <div className="mx-auto max-w-[1320px] px-5 py-12 lg:px-8">
            <ProductRequestStatus loading={loading} onRetry={onRetry} />
          </div>
        ) : !product ? (
          <div className="mx-auto max-w-xl px-5 py-24 text-center">
            <Icon name="cookie" className="mx-auto h-12 w-12 text-primary" />
            <h1 className="mt-5 text-3xl font-bold">Produk tidak ditemukan</h1>
            <p className="mt-3 text-muted">
              Yuk, temukan cookie favorit lainnya di katalog HappyBite.
            </p>
            <Link
              to="/katalog"
              className="mt-6 inline-flex rounded-full bg-baked px-6 py-3 font-bold text-white"
            >
              Kembali ke Katalog
            </Link>
          </div>
        ) : (
          <div className="mx-auto max-w-[1320px] px-5 pb-16 pt-5 lg:px-8">
            <nav
              aria-label="Breadcrumb"
              className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-5 text-muted"
            >
              <Link to="/" className="hover:text-baked">
                Beranda
              </Link>
              <Icon name="chevronRight" className="h-3 w-3 text-primary" />
              <Link to="/katalog" className="hover:text-baked">
                Katalog Menu
              </Link>
              <Icon name="chevronRight" className="h-3 w-3 text-primary" />
              <span>{category}</span>
              <Icon name="chevronRight" className="h-3 w-3 text-primary" />
              <span aria-current="page" className="font-bold text-chocolate">
                {product.name}
              </span>
            </nav>
            <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-10">
              <ProductGallery product={product} />
              <div className="min-w-0">
                <h1 className="text-3xl font-bold leading-tight tracking-[-.8px] sm:text-4xl">
                  {product.name}
                </h1>
                <div className="mt-6 rounded-2xl bg-white p-4 shadow-soft">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <p className="text-3xl font-bold text-baked sm:text-4xl">
                      {rupiah(product.price)}
                    </p>
                    <span className="text-xs text-muted">
                      {product.unitNote}
                    </span>
                  </div>
                  <p className="mt-2 flex items-start gap-1.5 text-[11px] font-semibold">
                    <Icon name="seal" className="h-3.5 w-3.5 text-baked" />
                    {product.packagingNote}
                  </p>
                </div>
                <p className="mt-6 text-sm leading-7 sm:text-base">
                  {product.fullDescription}
                </p>
                {product.variantSelect && (
                  <fieldset className="mt-5">
                    <legend className="mb-2 text-sm font-bold">
                      Pilihan Varian
                    </legend>
                    <div className="flex flex-wrap gap-2">
                      {product.variants.map((option) => (
                        <label
                          key={option}
                          className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-xs ${variant === option ? 'border-baked bg-peach' : 'border-primary/30 bg-white'}`}
                        >
                          <input
                            type="radio"
                            name="variant"
                            value={option}
                            checked={variant === option}
                            onChange={() => setVariant(option)}
                            className="accent-baked"
                          />
                          {option}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                )}
                <section
                  aria-label="Pesan produk"
                  className="mt-6 rounded-[30px] bg-peach p-4 shadow-soft sm:p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold">Jumlah:</span>
                      <div className="flex items-center rounded-full bg-white p-1">
                        <button
                          type="button"
                          aria-label="Kurangi jumlah"
                          disabled={quantity === 1}
                          onClick={() =>
                            setQuantity((count) => Math.max(1, count - 1))
                          }
                          className="rounded-full p-2.5 hover:bg-peach disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Icon name="minus" className="h-4 w-4" />
                        </button>
                        <output
                          aria-label="Jumlah produk"
                          className="min-w-8 text-center font-bold"
                        >
                          {quantity}
                        </output>
                        <button
                          type="button"
                          aria-label="Tambah jumlah"
                          onClick={() => setQuantity((count) => count + 1)}
                          className="rounded-full p-2.5 hover:bg-peach"
                        >
                          <Icon name="plus" className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-muted">
                        SUBTOTAL
                      </p>
                      <output
                        aria-label="Subtotal"
                        aria-live="polite"
                        className="text-xl font-bold text-baked"
                      >
                        {rupiah(product.price * quantity)}
                      </output>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => addProduct(product, quantity)}
                      disabled={soldOut}
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-baked px-3 py-3 text-xs font-bold text-white shadow-warm hover:bg-terracotta"
                    >
                      <Icon name="cart" className="h-5 w-5" />
                      {soldOut ? 'Stok Habis' : '+ Masukkan Keranjang'}
                    </button>
                    <button
                      type="button"
                      disabled={soldOut}
                      onClick={() => {
                        onBuyNow(product, quantity, variant)
                        navigate('/checkout')
                      }}
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-3 py-3 text-xs font-bold hover:bg-golden"
                    >
                      <Icon name="bag" className="h-4 w-4" />
                      Beli Langsung Sekarang
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDialog('Kontak HappyBite')}
                    className="mx-auto mt-4 flex items-center justify-center gap-2 rounded text-center text-xs font-semibold leading-5 text-baked"
                  >
                    <Icon name="chat" className="h-4 w-4" />
                    Ada pertanyaan khusus? Chat Dapur via WhatsApp
                  </button>
                  <p
                    role="status"
                    className="mt-3 text-center text-xs font-semibold text-baked empty:mt-0"
                  >
                    {notice}
                  </p>
                </section>
              </div>
            </div>
            <section aria-labelledby="pairing-title" className="mt-12">
              <p className="text-xs font-bold uppercase text-baked">
                Pairing Sempurna
              </p>
              <h2
                id="pairing-title"
                className="mb-5 mt-2 text-2xl font-bold sm:text-3xl"
              >
                Pas Dinikmati Bersama
              </h2>
              {relatedError && <ProductRequestStatus onRetry={onRetry} />}
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((item) => (
                  <RelatedProductCard
                    key={item.id}
                    product={item}
                    onAdd={(selection) => addProduct(selection)}
                  />
                ))}
              </div>
            </section>
          </div>
        )}
      </main>
      <Footer onAccount={openAccount} onInfo={setDialog} />
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
