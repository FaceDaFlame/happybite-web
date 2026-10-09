import { useEffect, useRef } from 'react'
import OrderPaymentProof from './OrderPaymentProof'
import Icon from '@/components/Icon'
import { formatOrderDate, formatRupiah } from '@/data/orderHistory'

export default function OrderHistoryDialog({ order, onClose }) {
  const dialog = useRef(null)
  useEffect(() => {
    const element = dialog.current
    const previousFocus = document.activeElement
    element.showModal()
    document.body.classList.add('overflow-hidden')
    return () => {
      element.close()
      document.body.classList.remove('overflow-hidden')
      previousFocus?.focus()
    }
  }, [])
  return (
    <dialog
      ref={dialog}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      aria-labelledby="history-dialog-title"
      className="m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-[30px] bg-canvas p-6 text-chocolate shadow-warm backdrop:bg-chocolate/45 sm:p-8"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 id="history-dialog-title" className="text-xl font-bold">
          Detail Pesanan
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup detail pesanan"
          className="rounded-full bg-peach p-2"
        >
          <Icon name="close" />
        </button>
      </div>
      <p className="mt-3 text-sm font-bold text-baked">{order.number}</p>
      <p className="mt-1 text-xs text-muted">
        {formatOrderDate(order.timestamp)}
      </p>
      <h3 className="mt-5 text-xs font-bold">Alamat Pengiriman</h3>
      {order.recipient && (
        <div className="mt-2 space-y-1 text-sm">
          <p className="font-semibold">{order.recipient.name}</p>
          <p>{order.recipient.whatsapp}</p>
          {order.recipient.email && (
            <p className="break-all text-xs text-muted">
              {order.recipient.email}
            </p>
          )}
        </div>
      )}
      <p className="mt-1 text-sm leading-6">{order.address}</p>
      <>
        <p className="mt-3 text-sm text-muted">
          Metode Pengiriman: {order.deliveryMethod}
        </p>
        <p className="mt-3 whitespace-pre-wrap break-words text-sm text-muted">
          {order.courierNote || 'Tidak ada catatan khusus.'}
        </p>
        <ul className="mt-5 space-y-3">
          {order.items.map((item, index) => (
            <li
              key={item.id || `${item.name}-${index}`}
              className="flex justify-between gap-3 text-xs leading-5"
            >
              <span>
                {item.name} ×{item.quantity} @ {formatRupiah(item.price)}
                {item.variant && (
                  <span className="block text-muted">{item.variant}</span>
                )}
              </span>
              <strong className="shrink-0">
                {formatRupiah(item.price * item.quantity)}
              </strong>
            </li>
          ))}
        </ul>
        <dl className="mt-5 space-y-2 border-t border-primary/25 pt-4 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatRupiah(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Ongkir</dt>
            <dd>{formatRupiah(order.shipping)}</dd>
          </div>
          <div className="flex justify-between font-bold">
            <dt>Total Pembayaran</dt>
            <dd>{formatRupiah(order.total)}</dd>
          </div>
          <div className="flex justify-between text-xs text-muted">
            <dt>Status Pembayaran</dt>
            <dd>
              {order.paymentStatus} ({order.paymentMethod})
            </dd>
          </div>
        </dl>
        {order.payment && (
          <div className="mt-4 text-xs text-muted">
            <p>Nama Pengirim: {order.payment.sender || '-'}</p>
            <p>Nominal: {formatRupiah(order.payment.amount)}</p>
            {order.payment.path && (
              <OrderPaymentProof path={order.payment.path} />
            )}
          </div>
        )}
      </>
    </dialog>
  )
}
