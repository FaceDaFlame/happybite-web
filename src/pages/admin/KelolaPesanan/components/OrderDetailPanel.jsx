import { orderStatusLabels } from '@/services/adminOrderService'
import PaymentEvidence from './PaymentEvidence'
import { useEffect, useState } from 'react'
import Icon from '@/components/Icon'
import { customerName, initials, orderTime } from '@/data/orderFulfillment'
import { formatRupiah, formatOrderDate } from '@/data/orderHistory'
import { relativeTime } from '@/data/notifications'

export default function OrderDetailPanel({
  order,
  now,
  onClose,
  onAction,
  busy,
}) {
  const [notice, setNotice] = useState('')
  useEffect(() => {
    if (!notice) return
    const timeout = setTimeout(() => setNotice(''), 2500)
    return () => clearTimeout(timeout)
  }, [notice])
  if (!order)
    return (
      <aside
        aria-label="Detail pesanan"
        className="flex min-h-72 items-center justify-center rounded-2xl border border-primary/15 bg-white p-8 text-center shadow-soft"
      >
        <div>
          <Icon name="receipt" className="mx-auto h-9 w-9 text-primary" />
          <p className="mt-4 text-sm leading-6 text-muted">
            Pilih salah satu pesanan untuk melihat detail
          </p>
        </div>
      </aside>
    )
  const name = customerName(order)
  const status = order.status
  const cancellable = [
    'menunggu_pembayaran',
    'menunggu_konfirmasi',
    'diproses',
    'qc_packing',
  ].includes(status)
  const count = order.items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = order.subtotal
  async function copy() {
    try {
      await navigator.clipboard.writeText(order.number)
      setNotice('Nomor pesanan disalin.')
    } catch {
      setNotice(
        'Tidak dapat menyalin otomatis. Silakan salin nomor pesanan di atas.',
      )
    }
  }
  return (
    <aside
      aria-labelledby="admin-order-title"
      className="min-w-0 rounded-2xl border border-primary/10 bg-white p-5 shadow-soft xl:p-6"
    >
      <header className="border-b border-primary/25 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-start gap-2">
              <h2
                id="admin-order-title"
                className="break-words text-lg font-bold"
              >
                {order.number}
              </h2>
              <button
                type="button"
                onClick={copy}
                aria-label="Salin nomor pesanan"
                className="rounded p-1 text-muted hover:text-baked"
              >
                <Icon name="copy" className="h-4 w-4" />
              </button>
            </div>
            <p
              title={formatOrderDate(order.timestamp)}
              className="mt-1 text-[11px] leading-5 text-baked"
            >
              Dipesan {orderTime(order.timestamp)} •{' '}
              {relativeTime(order.timestamp, now)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup detail pesanan"
            className="shrink-0 rounded-full bg-blush/60 p-2 hover:bg-blush"
          >
            <Icon name="close" className="h-4 w-4" />
          </button>
        </div>
        {notice && (
          <p role="status" className="mt-2 text-xs text-baked">
            {notice}
          </p>
        )}
        {order.source === 'sample' && (
          <p className="mt-2 text-[10px] text-muted">Demo · Data contoh</p>
        )}
      </header>
      <section
        aria-label="Informasi pelanggan"
        className="my-6 rounded-2xl bg-peach p-4"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blush text-xs font-bold">
            {initials(name)}
          </span>
          <div>
            <h3 className="text-xs font-bold">{name}</h3>
            {order.recipient?.whatsapp && (
              <p className="mt-1 text-[11px] text-muted">
                {order.recipient.whatsapp}
              </p>
            )}
          </div>
        </div>
        <div className="mt-4 flex items-start gap-2 text-[11px] leading-5">
          <Icon name="pin" className="mt-0.5 h-4 w-4 text-baked" />
          <div>
            <p>{order.address || 'Alamat belum tersedia'}</p>
            {order.courierNote && <p className="mt-1">{order.courierNote}</p>}
            {order.deliveryNote && (
              <p className="mt-1 text-muted">{order.deliveryNote}</p>
            )}
          </div>
        </div>
        <p className="mt-3 text-[11px] text-muted">
          Metode Kirim: {order.deliveryMethod}
        </p>
        {order.recipient?.email && (
          <p className="mt-1 break-words text-[11px] text-muted">
            {order.recipient.email}
          </p>
        )}
        {order.greeting && (
          <div className="mt-3 text-[11px] leading-5">
            <h4 className="font-bold">Kartu Ucapan</h4>
            <p className="whitespace-pre-wrap break-words">{order.greeting}</p>
          </div>
        )}
      </section>
      <h3 className="mb-4 text-[11px] font-bold">
        RINCIAN MENU ({count} COOKIES)
      </h3>
      <ul className="space-y-4">
        {order.items.map((item, i) => (
          <li key={item.id || i} className="flex items-start gap-2">
            <span className="rounded-full bg-blush/60 p-2 text-baked">
              <Icon name="cookie" className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold leading-5">{item.name}</p>
              <p className="text-[11px] text-muted">
                {item.quantity} pcs @ {formatRupiah(item.price)}
              </p>
              {item.variant && (
                <p className="mt-1 text-[10px] text-muted">{item.variant}</p>
              )}
            </div>
            <strong className="shrink-0 pt-1 text-xs">
              {formatRupiah(item.quantity * item.price)}
            </strong>
          </li>
        ))}
      </ul>
      <dl className="mt-5 border-t border-primary/25 text-[11px]">
        <div className="flex justify-between gap-3 py-3">
          <dt>Subtotal Produk</dt>
          <dd>{formatRupiah(subtotal)}</dd>
        </div>
        {order.shipping >= 0 && (
          <div className="flex justify-between gap-3 pb-3">
            <dt>Ongkos Kirim</dt>
            <dd>{formatRupiah(order.shipping)}</dd>
          </div>
        )}
        {order.service > 0 && (
          <div className="flex justify-between gap-3 pb-3">
            <dt>Biaya Layanan</dt>
            <dd>{formatRupiah(order.service)}</dd>
          </div>
        )}
        <div className="flex justify-between gap-3 border-t border-primary/25 py-3 text-sm font-bold">
          <dt>Total Pembayaran</dt>
          <dd className="text-baked">{formatRupiah(order.total)}</dd>
        </div>
      </dl>
      <PaymentEvidence
        key={order.id + (order.payment?.path || '')}
        payment={order.payment}
        status={order.paymentStatus}
      />
      <div className="mt-5 space-y-3">
        <p role="status" className="text-xs text-baked">
          {orderStatusLabels[status] || status}
        </p>
        {status === 'menunggu_konfirmasi' && (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => onAction(order, 'approve')}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-baked px-4 py-3 text-xs font-semibold text-white shadow-soft hover:bg-terracotta"
            >
              {busy ? 'Memproses...' : 'Verifikasi Pembayaran'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                if (
                  window.confirm(
                    'Tolak bukti pembayaran pesanan ini? Pelanggan perlu mengirim ulang bukti.',
                  )
                )
                  onAction(order, 'reject')
              }}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-blush/70 px-3 py-3 text-xs font-semibold hover:bg-blush"
            >
              Tolak Bukti
            </button>
          </>
        )}
        {['diproses', 'qc_packing'].includes(status) && (
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              onAction(order, status === 'diproses' ? 'qc_packing' : 'dikirim')
            }
            className="flex w-full items-center justify-center gap-2 rounded-full bg-baked px-4 py-3 text-xs font-semibold text-white shadow-soft hover:bg-terracotta"
          >
            {busy
              ? 'Memproses...'
              : status === 'diproses'
                ? 'Lanjut ke QC & Packing'
                : 'Tandai Dikirim'}
            <Icon name="arrow" className="h-4 w-4" />
          </button>
        )}
        {cancellable && (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                if (
                  window.confirm(
                    'Batalkan pesanan ini? Stok produk akan dikembalikan.',
                  )
                )
                  onAction(order, 'cancel')
              }}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-blush/70 px-3 py-3 text-xs font-semibold hover:bg-blush"
            >
              Batalkan Pesanan
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => window.print()}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-blush/70 px-3 py-3 text-xs font-semibold hover:bg-blush"
            >
              <Icon name="receipt" className="h-4 w-4" />
              Cetak Surat Jalan & Label Box
            </button>
          </>
        )}
      </div>
    </aside>
  )
}
