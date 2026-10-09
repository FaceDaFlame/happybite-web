import Icon from '@/components/Icon'
import { Link } from 'react-router-dom'
import { formatOrderDate, formatRupiah } from '@/data/orderHistory'
import { customerOrderLabels } from '@/data/customerOrders'
import OrderItemImage from './OrderItemImage'

export default function OrderHistoryCard({
  order,
  onDetails,
  onConfirm,
  busy,
  onDownload,
}) {
  const completed = order.status === 'selesai'
  return (
    <article
      aria-labelledby={`order-${order.id}`}
      className="relative overflow-hidden rounded-[30px] bg-white p-5 shadow-soft sm:p-6"
    >
      {order.status === 'dikirim' && (
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-baked to-golden" />
      )}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 id={`order-${order.id}`} className="text-lg font-bold">
            {order.number}
          </h2>
          <span aria-hidden="true" className="text-primary/60">
            •
          </span>
          <time dateTime={order.timestamp} className="text-xs text-muted">
            {formatOrderDate(order.timestamp)}
          </time>
        </div>
        <span className="rounded-full bg-blush/70 px-3 py-1.5 text-[10px] font-bold text-baked">
          {customerOrderLabels[order.status] || order.status}
        </span>
      </header>
      {order.sectionLabel && (
        <h3 className="mb-3 mt-5 text-[11px] font-bold text-muted">
          {order.sectionLabel}
        </h3>
      )}
      <ul className={`grid gap-3 sm:grid-cols-2 ${completed ? 'mt-4' : ''}`}>
        {order.items.map((item, index) => (
          <li
            key={`${item.name}-${index}`}
            className="flex min-w-0 items-center gap-3 rounded-xl bg-peach p-2.5"
          >
            <div className="relative shrink-0">
              <OrderItemImage
                image={item.image}
                name={item.name}
                large={order.status === 'dikirim'}
              />
              <span className="absolute bottom-1 right-1 rounded-full bg-white px-1.5 py-0.5 text-[9px] font-bold">
                ×{item.quantity}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h3
                className={`font-semibold leading-6 ${order.status === 'dikirim' ? 'text-base sm:text-lg' : 'text-sm'}`}
              >
                {item.name}
              </h3>
              {!completed && (
                <p className="mt-0.5 text-xs leading-5 text-muted">
                  {item.description}
                </p>
              )}
              {item.variant && (
                <p className="mt-1 text-xs leading-5 text-baked">
                  {item.variant}
                </p>
              )}
              <div className="mt-1 flex flex-wrap items-baseline justify-between gap-1">
                <p className="text-xs text-muted">
                  {item.quantity} pcs × {formatRupiah(item.price)}
                </p>
                <p className="text-sm font-bold text-baked">
                  {formatRupiah(item.quantity * item.price)}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {order.greeting && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-canvas p-3">
          <Icon name="gift" className="h-5 w-5 text-baked" />
          <div>
            <h3 className="text-[10px] font-bold">
              Kartu Ucapan & Pita Terracotta Terpasang:
            </h3>
            <p className="mt-1 text-xs italic leading-6 text-muted">
              “{order.greeting}”
            </p>
          </div>
        </div>
      )}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p className="flex flex-wrap items-baseline gap-2 text-xs text-muted">
          {completed ? 'Total Pesanan:' : 'Total Pembayaran:'}
          <strong
            className={`text-xl ${completed ? 'text-chocolate' : 'text-baked'}`}
          >
            {formatRupiah(order.total)}
          </strong>
          <span className="rounded-full bg-blush/70 px-2 py-0.5 text-[10px] font-bold text-baked">
            {completed
              ? 'Selesai'
              : `${order.paymentStatus} (${order.paymentMethod})`}
          </span>
        </p>
        <div className="flex flex-wrap items-center gap-4">
          {order.status === 'menunggu_pembayaran' && (
            <Link
              to={'/pembayaran/' + order.id}
              className="rounded-full bg-baked px-5 py-2.5 text-xs font-bold text-white hover:bg-terracotta"
            >
              Lanjutkan Pembayaran
            </Link>
          )}
          {order.status === 'dikirim' && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onConfirm(order)}
              className="rounded-full bg-baked px-5 py-2.5 text-xs font-bold text-white hover:bg-terracotta"
            >
              {busy ? 'Memproses...' : 'Konfirmasi Pesanan Diterima'}
            </button>
          )}
          <button
            type="button"
            onClick={() => onDetails(order)}
            className="rounded-full bg-blush px-5 py-2.5 text-xs font-bold hover:bg-primary"
          >
            Detail Pesanan
          </button>
        </div>
        {completed && (
          <button
            type="button"
            onClick={() => onDownload(order)}
            aria-label={`Unduh PDF ${order.number}`}
            className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold hover:text-baked"
          >
            <Icon name="download" className="h-4 w-4" />
            Unduh PDF
          </button>
        )}
      </div>
    </article>
  )
}
