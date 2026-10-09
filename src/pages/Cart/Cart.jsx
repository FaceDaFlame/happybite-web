import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Icon from '@/components/Icon'
import SiteDialog from '@/components/SiteDialog'
import CartItemCard from '@/pages/Cart/components/CartItemCard'
import CartGiftMessage from '@/pages/Cart/components/CartGiftMessage'
import { cartLines } from '@/data/cartSnapshot'

const rupiah = (amount) => `Rp ${amount.toLocaleString('id-ID')}`

export default function Cart({
  cartItems,
  cartCount,
  dispatchCart,
  gift,
  onGiftChange,
}) {
  const navigate = useNavigate()
  const [dialog, setDialog] = useState(null)
  const selectAll = useRef(null)
  const items = cartLines(cartItems)
  const selectedItems = items.filter((item) => item.selected)
  const selectedCount = selectedItems.reduce(
    (total, item) => total + item.quantity,
    0,
  )
  const subtotal = selectedItems.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0,
  )
  const allSelected = items.length > 0 && selectedItems.length === items.length
  const partiallySelected = selectedItems.length > 0 && !allSelected
  const openAccount = () => navigate('/login')

  useEffect(() => {
    if (selectAll.current) selectAll.current.indeterminate = partiallySelected
  }, [partiallySelected])

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <Navbar
        cartCount={cartCount}
        onAccount={openAccount}
        onSearch={() => navigate('/katalog#catalog-search')}
      />
      <main className="flex-1 bg-canvas">
        <div className="mx-auto max-w-[1320px] px-5 pb-12 pt-6 lg:px-8">
          <nav
            aria-label="Breadcrumb"
            className="mb-5 flex items-center gap-2 text-xs text-muted"
          >
            <Link to="/" className="flex items-center gap-1 hover:text-baked">
              <Icon name="home" className="h-4 w-4" />
              Beranda
            </Link>
            <Icon name="chevronRight" className="h-3 w-3 text-primary" />
            <span aria-current="page" className="font-semibold text-chocolate">
              Keranjang Belanja
            </span>
          </nav>
          <div className="mb-6 flex items-center gap-3 rounded-[30px] bg-white px-5 py-6 shadow-soft sm:px-6">
            <span className="rounded-full bg-peach p-2 text-baked">
              <Icon name="bag" />
            </span>
            <h1 className="text-2xl font-bold tracking-[-.5px] sm:text-3xl">
              Keranjang Belanja Anda
            </h1>
          </div>
          {!items.length ? (
            <section className="rounded-[30px] bg-white px-5 py-16 text-center shadow-soft">
              <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-peach text-baked">
                <Icon name="bag" className="h-10 w-10" />
              </span>
              <h2 className="mt-5 text-2xl font-bold">
                Keranjangmu masih kosong
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                Yuk, isi dengan cookie favoritmu dan nikmati setiap gigitan!
              </p>
              <Link
                to="/katalog"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-baked px-6 py-3 text-sm font-bold text-white hover:bg-terracotta"
              >
                Mulai Belanja
                <Icon name="arrow" className="h-4 w-4" />
              </Link>
            </section>
          ) : (
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
              <div className="min-w-0">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white px-4 py-4 text-xs sm:px-5">
                  <label className="flex cursor-pointer items-center gap-3 font-semibold">
                    <input
                      ref={selectAll}
                      type="checkbox"
                      checked={allSelected}
                      onChange={(event) =>
                        dispatchCart({
                          type: 'selectAll',
                          selected: event.target.checked,
                        })
                      }
                      className="h-5 w-5 accent-baked"
                    />
                    Pilih Semua Item ({items.length} Pesanan)
                  </label>
                  <button
                    type="button"
                    onClick={() => dispatchCart({ type: 'clear' })}
                    className="flex items-center gap-1 rounded text-muted hover:text-baked"
                  >
                    <Icon name="trash" className="h-3.5 w-3.5" />
                    Hapus Semua
                  </button>
                </div>
                <div className="space-y-4">
                  {items.map((item) => (
                    <CartItemCard
                      key={item.id}
                      item={item}
                      onChange={dispatchCart}
                    />
                  ))}
                </div>
                <CartGiftMessage
                  enabled={gift.enabled}
                  message={gift.message}
                  onToggle={(enabled) => onGiftChange({ ...gift, enabled })}
                  onMessage={(message) => onGiftChange({ ...gift, message })}
                />
              </div>
              <aside
                aria-labelledby="summary-title"
                className="rounded-[30px] bg-white p-5 shadow-soft sm:p-6 lg:sticky lg:top-28"
              >
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-primary/20 pb-4">
                  <h2
                    id="summary-title"
                    className="flex items-center gap-2 text-xl font-bold"
                  >
                    <Icon name="receipt" className="h-5 w-5 text-baked" />
                    Ringkasan Belanja
                  </h2>
                  <span className="rounded-full bg-peach px-2.5 py-1 text-[11px] font-semibold">
                    {selectedCount} Cookie
                  </span>
                </div>
                <dl className="space-y-4 text-xs leading-5 sm:text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">
                      Subtotal Produk ({selectedCount} pcs)
                    </dt>
                    <dd className="shrink-0 font-semibold">
                      {rupiah(subtotal)}
                    </dd>
                  </div>
                </dl>
                <div className="mt-5 border-t border-primary/20 pt-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-xs font-bold">Total Sementara</span>
                    <output
                      aria-label="Total sementara"
                      aria-live="polite"
                      className="text-3xl font-bold text-baked"
                    >
                      {rupiah(subtotal)}
                    </output>
                  </div>
                  <p className="mt-1 text-[10px] text-muted">
                    Termasuk pajak & kemasan premium
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!selectedCount}
                  onClick={() => navigate('/checkout')}
                  className="mt-7 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-baked px-4 py-3 text-xs font-bold text-white shadow-warm hover:bg-terracotta disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Lanjut ke Pembayaran (Checkout)
                  <Icon name="arrow" className="h-4 w-4" />
                </button>
                {!selectedCount && (
                  <p
                    role="status"
                    className="mt-2 text-center text-xs text-muted"
                  >
                    Pilih minimal satu item untuk melanjutkan.
                  </p>
                )}
                <Link
                  to="/katalog"
                  className="mt-3 flex min-h-11 items-center justify-center gap-2 rounded-full border border-primary/30 bg-peach px-3 py-3 text-center text-xs font-semibold hover:bg-blush"
                >
                  <Icon name="back" className="h-4 w-4" />
                  Lanjut Belanja Cookie Lainnya
                </Link>
              </aside>
            </div>
          )}
        </div>
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
