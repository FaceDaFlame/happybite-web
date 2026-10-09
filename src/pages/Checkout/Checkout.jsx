import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SiteDialog from '@/components/SiteDialog'
import Icon from '@/components/Icon'
import CheckoutSteps from '@/components/StepProgress'
import CheckoutField from '@/pages/Checkout/components/CheckoutField'
import { selectedOrderItems } from '@/data/shopSession'
import { createOrder, orderErrorMessage } from '@/services/orderService'

const rupiah = (amount) => `Rp ${amount.toLocaleString('id-ID')}`
const regions = [
  'Jakarta Selatan - Kitchen Senopati',
  'Jakarta Pusat',
  'Jakarta Barat',
  'Jakarta Timur',
  'Jakarta Utara',
  'Bogor',
  'Depok',
  'Tangerang',
  'Bekasi',
]

export default function Checkout({
  cartItems,
  cartCount,
  gift,
  form,
  setForm,
  onCreated,
}) {
  const navigate = useNavigate()
  const [dialog, setDialog] = useState(null)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const pending = useRef(false)
  const openAccount = () => navigate('/login')
  const items = selectedOrderItems(cartItems)
  const itemCount = items.reduce((count, item) => count + item.quantity, 0)
  const total = items.reduce(
    (sum, item) => sum + item.quantity * item.product.price,
    0,
  )
  const greeting = gift.enabled ? gift.message.trim() : ''

  function change(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
  }
  async function submit(event) {
    event.preventDefault()
    if (!items.length || pending.current) return
    const nextErrors = {}
    if (!form.name.trim()) nextErrors.name = 'Masukkan nama lengkap penerima.'
    if (!/^(?:\+?62|0)8\d{7,12}$/.test(form.whatsapp.replace(/[\s()-]/g, '')))
      nextErrors.whatsapp = 'Masukkan nomor WhatsApp yang valid (08 atau +62).'
    if (
      form.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    )
      nextErrors.email = 'Masukkan alamat email yang valid.'
    if (!form.address.trim())
      nextErrors.address = 'Masukkan alamat lengkap pengantaran.'
    if (!form.city) nextErrors.city = 'Pilih kota atau wilayah pengiriman.'
    if (!/^\d{5}$/.test(form.postalCode.trim()))
      nextErrors.postalCode = 'Kode pos harus terdiri dari 5 angka.'
    setErrors(nextErrors)
    const firstError = Object.keys(nextErrors)[0]
    if (firstError) document.getElementById(`checkout-${firstError}`)?.focus()
    else {
      pending.current = true
      setSubmitting(true)
      try {
        // Shipping has not been configured; the existing checkout charges zero.
        const order = await createOrder(cartItems, {
          ...form,
          greeting,
          shipping: 0,
        })
        onCreated()
        navigate(`/pembayaran/${order.id}`, { replace: true })
      } catch (error) {
        setErrors({ submit: orderErrorMessage(error) })
      } finally {
        pending.current = false
        setSubmitting(false)
      }
    }
  }
  const fieldProps = (name) => ({
    name,
    value: form[name],
    onChange: change,
    error: errors[name],
    disabled: submitting,
  })

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <Navbar
        cartCount={cartCount}
        onAccount={openAccount}
        onSearch={() => navigate('/katalog#catalog-search')}
      />
      <main className="flex-1">
        {items.length > 0 ? (
          <>
            <CheckoutSteps />
            <div className="mx-auto grid max-w-[1320px] items-start gap-6 px-5 py-6 pb-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:px-8">
              <section
                aria-labelledby="delivery-title"
                className="min-w-0 rounded-2xl bg-white p-5 shadow-soft sm:p-6"
              >
                <h1
                  id="delivery-title"
                  className="mb-6 flex items-center gap-2 text-xl font-semibold leading-8 sm:text-2xl"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-peach text-xs font-bold text-baked">
                    1
                  </span>
                  Data Pemesan & Alamat Pengiriman
                </h1>
                <form
                  id="checkout-form"
                  noValidate
                  onSubmit={submit}
                  className="space-y-5"
                >
                  <div className="grid gap-5 sm:grid-cols-2">
                    <CheckoutField
                      {...fieldProps('name')}
                      label="Nama Lengkap Penerima"
                      icon="user"
                      required
                      autoComplete="shipping name"
                      placeholder="Amanda Putri"
                    />
                    <CheckoutField
                      {...fieldProps('whatsapp')}
                      label="Nomor WhatsApp Aktif"
                      icon="chat"
                      required
                      type="tel"
                      autoComplete="shipping tel"
                      placeholder="0812-9876-5432"
                      helper="Untuk update resi & live foto kurir saat berangkat"
                    />
                  </div>
                  <CheckoutField
                    {...fieldProps('email')}
                    label="Email Konfirmasi (Kwitansi & Riwayat Bake)"
                    icon="mail"
                    type="email"
                    autoComplete="shipping email"
                    placeholder="amanda.putri@email.com"
                  />
                  <CheckoutField
                    {...fieldProps('address')}
                    label="Alamat Lengkap Pengantaran"
                    icon="pin"
                    required
                    autoComplete="shipping street-address"
                    placeholder="Jl. Kemang Raya No. 42B, RT 04 / RW 02"
                    hint="Jalan, RT/RW, Patokan"
                  />
                  <div className="grid gap-5 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                    <CheckoutField
                      {...fieldProps('city')}
                      label="Kota / Wilayah Operasional Dapur"
                      icon="home"
                      required
                      autoComplete="shipping address-level2"
                    >
                      <option value="">Pilih kota / wilayah</option>
                      {regions.map((region) => (
                        <option key={region} value={region}>
                          {region}
                        </option>
                      ))}
                    </CheckoutField>
                    <CheckoutField
                      {...fieldProps('postalCode')}
                      label="Kode Pos"
                      icon="pin"
                      required
                      inputMode="numeric"
                      autoComplete="shipping postal-code"
                      maxLength={5}
                      placeholder="12730"
                    />
                  </div>
                  <CheckoutField
                    {...fieldProps('notes')}
                    label="Patokan & Catatan Kurir"
                    icon="note"
                    multiline
                    placeholder="Pagar hitam samping coffee shop, titip satpam bila tidak di tempat"
                    maxLength={500}
                  />
                </form>
              </section>
              <aside
                aria-labelledby="order-title"
                className="min-w-0 rounded-2xl bg-white p-5 shadow-soft sm:p-6 lg:sticky lg:top-28"
              >
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <h2
                    id="order-title"
                    className="flex items-center gap-2 text-xl font-semibold"
                  >
                    <Icon name="bag" className="h-5 w-5 text-baked" />
                    Rincian Pesanan ({itemCount} Item)
                  </h2>
                  <Link
                    to="/keranjang"
                    className="rounded text-xs font-semibold text-baked underline underline-offset-2"
                  >
                    Ubah Keranjang
                  </Link>
                </div>
                <ul className="space-y-3">
                  {items.map(({ id, product, quantity, variant }) => (
                    <li
                      key={id}
                      className="flex items-start gap-3 rounded-2xl bg-canvas p-3"
                    >
                      <Link
                        to={`/produk/${product.slug}`}
                        className="shrink-0 rounded-xl"
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          width="64"
                          height="64"
                          className="h-14 w-14 rounded-xl object-cover sm:h-16 sm:w-16"
                        />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
                          <h3 className="text-sm font-bold">
                            <Link
                              to={`/produk/${product.slug}`}
                              className="rounded hover:text-baked"
                            >
                              {product.name}
                            </Link>
                          </h3>
                          <span className="whitespace-nowrap text-sm font-bold">
                            {rupiah(product.price * quantity)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-muted">
                          {variant || product.badge}
                        </p>
                        <div className="mt-1 flex flex-wrap justify-between gap-2 text-[10px]">
                          <span className="font-semibold">
                            {quantity}× @ {rupiah(product.price)}
                          </span>
                          <span className="text-baked">
                            {product.category === 'drinks'
                              ? 'Freshly Brewed'
                              : 'Freshly Baked'}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                {greeting && (
                  <div className="mt-4 flex items-start gap-2 rounded-2xl bg-peach p-4">
                    <Icon name="heart" className="h-4 w-4 text-baked" />
                    <div className="min-w-0">
                      <h3 className="text-[11px] font-bold uppercase text-baked">
                        Kartu Ucapan Personalisasi: YA
                      </h3>
                      <p className="mt-1 whitespace-pre-wrap break-words text-sm italic leading-6 text-muted">
                        “{greeting}”
                      </p>
                    </div>
                  </div>
                )}
                <dl className="mt-6">
                  <div className="flex flex-wrap justify-between gap-2 border-b border-primary/25 pb-3 text-sm text-muted">
                    <dt>Subtotal Cookie ({itemCount} pcs)</dt>
                    <dd>{rupiah(total)}</dd>
                  </div>
                  <div className="mt-5 flex flex-wrap items-baseline justify-between gap-2">
                    <dt className="text-lg font-bold">Total Pembayaran</dt>
                    <dd
                      aria-label="Total pembayaran"
                      className="text-3xl font-bold text-baked"
                    >
                      {rupiah(total)}
                    </dd>
                  </div>
                </dl>
                <button
                  type="submit"
                  form="checkout-form"
                  disabled={submitting}
                  aria-busy={submitting}
                  className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-baked px-4 py-3 text-sm font-bold text-white shadow-warm hover:bg-terracotta"
                >
                  {submitting ? 'Memproses...' : 'Lanjut ke Pembayaran'}
                  <Icon name="arrow" className="h-4 w-4" />
                </button>
                {errors.submit && (
                  <p role="alert" className="mt-3 text-sm text-baked">
                    {errors.submit}
                  </p>
                )}
                <p className="mt-3 flex items-center justify-center gap-1 text-center text-[10px] text-muted">
                  <Icon name="lock" className="h-3 w-3 text-baked" />
                  Langkah berikutnya: Pembayaran instan via QRIS
                </p>
              </aside>
            </div>
          </>
        ) : (
          <section className="mx-auto max-w-xl px-5 py-16 text-center">
            <Icon name="bag" className="mx-auto h-12 w-12 text-primary" />
            <h1 className="mt-5 text-2xl font-bold">
              Belum ada item untuk checkout
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted">
              Pilih item di keranjang untuk melanjutkan data dan pengiriman.
            </p>
            <Link
              to="/keranjang"
              className="mt-6 inline-flex rounded-full bg-baked px-6 py-3 text-sm font-bold text-white"
            >
              Kembali ke Keranjang
            </Link>
          </section>
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
