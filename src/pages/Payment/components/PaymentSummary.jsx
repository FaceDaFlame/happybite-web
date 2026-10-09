import Icon from '@/components/Icon'

const rupiah = (value) => `Rp ${value.toLocaleString('id-ID')}`

export default function PaymentSummary({
  order,
  checkout,
  items,
  totals,
  expired,
  status,
  itemsLoading,
  itemsError,
  onRetryItems,
}) {
  const count = items.reduce((sum, item) => sum + item.quantity, 0)
  return (
    <aside className="min-w-0 space-y-5 lg:sticky lg:top-28">
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-[30px] bg-white p-5 shadow-soft sm:p-6">
        <div>
          <h2 className="text-[10px] font-bold text-muted">NOMOR PESANAN</h2>
          <p className="mt-1 break-all text-base font-bold">
            {order.no_pesanan}
          </p>
        </div>
        <span
          role="status"
          className="rounded-full bg-blush px-3 py-1 text-[10px] font-bold text-baked"
        >
          {expired
            ? 'Waktu Habis'
            : status === 'menunggu_pembayaran'
              ? 'Menunggu Bayar'
              : status === 'menunggu_konfirmasi'
                ? 'Menunggu Verifikasi'
                : String(status).replaceAll('_', ' ')}
        </span>
      </section>
      <section className="rounded-[30px] bg-white p-5 shadow-soft sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Rincian Menu Artisan</h2>
          {items.length > 0 && (
            <span className="rounded-full bg-peach px-2 py-1 text-[10px] font-bold">
              {count} Pcs Cookies
            </span>
          )}
        </div>
        {itemsLoading ? (
          <p role="status" className="text-xs text-muted">
            Memuat rincian menu...
          </p>
        ) : itemsError ? (
          <div role="alert" className="text-xs text-muted">
            <p>Rincian menu belum dapat dimuat.</p>
            <button
              type="button"
              onClick={onRetryItems}
              className="mt-2 font-semibold text-baked underline"
            >
              Coba lagi
            </button>
          </div>
        ) : !items.length ? (
          <p className="text-xs text-muted">Rincian menu belum tersedia.</p>
        ) : null}
        <ul className="space-y-5">
          {items.map(({ id, product, quantity, variant }) => (
            <li key={id} className="flex items-start gap-3">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  width="60"
                  height="60"
                  className="h-14 w-14 rounded-lg object-cover"
                />
              ) : (
                <Icon
                  name="cookie"
                  className="h-14 w-14 rounded-lg text-baked"
                />
              )}
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-bold leading-5">{product.name}</h3>
                {variant && <p className="text-[10px] text-muted">{variant}</p>}
                <p className="text-xs text-muted">
                  {quantity}× @ {rupiah(product.price)}
                </p>
              </div>
              <p className="shrink-0 text-xs font-bold">
                {rupiah(product.price * quantity)}
              </p>
            </li>
          ))}
        </ul>
        <dl className="mt-6 space-y-2 rounded-xl bg-peach p-4 text-xs">
          <div className="flex justify-between gap-3 text-muted">
            <dt>Subtotal Produk</dt>
            <dd>{rupiah(totals.subtotal)}</dd>
          </div>
          <div className="flex justify-between gap-3 text-muted">
            <dt>Ongkos Kirim</dt>
            <dd>{rupiah(totals.shipping)}</dd>
          </div>
          <div className="flex justify-between gap-3 text-muted">
            <dt>Biaya Layanan Gerbang QRIS</dt>
            <dd>{rupiah(totals.service)}</dd>
          </div>
          <div className="flex justify-between gap-3 pt-2 font-bold">
            <dt>Total Pembayaran</dt>
            <dd className="text-base text-baked">{rupiah(totals.total)}</dd>
          </div>
        </dl>
      </section>
      <section className="rounded-[30px] bg-white p-5 shadow-soft sm:p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Icon name="truck" className="h-5 w-5 text-baked" />
          Tujuan Pengiriman
        </h2>
        <dl className="text-xs leading-6">
          <div className="flex flex-wrap justify-between gap-x-3">
            <dt className="sr-only">Nama Pemesan</dt>
            <dd className="font-bold">{checkout.name}</dd>
            <dt className="sr-only">Nomor WhatsApp</dt>
            <dd>{checkout.whatsapp}</dd>
          </div>
          <dt className="sr-only">Alamat Lengkap</dt>
          <dd className="mt-1 break-words text-muted">
            {checkout.address}, {checkout.city}, {checkout.postalCode}
          </dd>
          {checkout.email && (
            <>
              <dt className="mt-2 font-semibold">Email Konfirmasi</dt>
              <dd className="break-all text-muted">{checkout.email}</dd>
            </>
          )}
          {checkout.notes && (
            <>
              <dt className="mt-2 font-semibold">Patokan & Catatan Kurir</dt>
              <dd className="break-words text-muted">{checkout.notes}</dd>
            </>
          )}
        </dl>
      </section>
    </aside>
  )
}
