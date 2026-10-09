import Icon from '@/components/Icon'
import { customerName, initials, orderKey } from '@/data/orderFulfillment'
import { formatOrderDate, formatRupiah } from '@/data/orderHistory'
import { orderStatusLabels } from '@/services/adminOrderService'
import { paymentStatusLabel } from '../utils/salesReport'

export default function TransactionsTable({
  orders,
  query,
  onQuery,
  payment,
  onPayment,
  orderStatus,
  onOrderStatus,
  page,
  onPage,
  onExport,
  emptyPeriod,
  emptyFiltered,
}) {
  const pageSize = 6
  const pageCount = Math.max(1, Math.ceil(orders.length / pageSize))
  const current = Math.min(page, pageCount)
  const start = (current - 1) * pageSize
  const visible = orders.slice(start, start + pageSize)
  return (
    <section
      aria-labelledby="transactions-title"
      className="rounded-2xl border border-primary/10 bg-white p-5 shadow-soft sm:p-6"
    >
      <header className="mb-5 flex flex-wrap justify-between gap-5">
        <div>
          <h2 id="transactions-title" className="text-xl font-bold">
            Daftar Transaksi Lengkap
          </h2>
          <p className="mt-2 max-w-sm text-xs leading-5 text-muted">
            Rekap seluruh transaksi pesanan yang dibuat melalui checkout
            HappyBite.
          </p>
        </div>
        <div className="flex max-w-xl flex-wrap items-start gap-2">
          <label className="flex min-w-0 items-center gap-2 rounded-full bg-peach px-3 focus-within:ring-2 focus-within:ring-terracotta/20">
            <Icon name="search" className="h-4 w-4 text-muted" />
            <input
              aria-label="Cari transaksi atau pelanggan"
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder="Cari No. Order, pelanggan..."
              className="min-w-0 bg-transparent py-2 text-xs outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </label>
          <select
            aria-label="Filter pembayaran transaksi"
            value={payment}
            onChange={(e) => onPayment(e.target.value)}
            className="rounded-full border-0 bg-blush/70 px-3 py-2 text-xs focus-visible:outline-baked"
          >
            <option value="all">Semua Pembayaran</option>
            <option value="lunas">Lunas</option>
            <option value="menunggu_verifikasi">Menunggu Verifikasi</option>
            <option value="belum_dibayar">Belum Dibayar</option>
            <option value="ditolak">Ditolak</option>
          </select>
          <select
            aria-label="Filter status pesanan"
            value={orderStatus}
            onChange={(e) => onOrderStatus(e.target.value)}
            className="rounded-full border-0 bg-blush/70 px-3 py-2 text-xs focus-visible:outline-baked"
          >
            <option value="all">Semua Status Pesanan</option>
            {Object.entries(orderStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onExport}
            className="flex items-center gap-2 rounded-full bg-blush/70 px-4 py-2 text-xs font-semibold hover:bg-blush"
          >
            <Icon name="download" className="h-4 w-4" />
            Ekspor Tabel
          </button>
        </div>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[740px] text-left text-xs">
          <thead className="bg-peach text-[10px] tracking-wide">
            <tr>
              {[
                'TANGGAL & WAKTU',
                'NO. PESANAN',
                'PELANGGAN',
                'RINCIAN ITEM',
                'TOTAL NOMINAL',
              ].map((label) => (
                <th key={label} className="px-3 py-4 font-semibold">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((order) => {
              const name = customerName(order)
              return (
                <tr key={orderKey(order)} className="border-b border-peach">
                  <td className="px-3 py-5">
                    <time
                      dateTime={order.timestamp}
                      className="whitespace-nowrap"
                    >
                      {formatOrderDate(order.timestamp)}
                    </time>
                  </td>
                  <td className="max-w-48 break-words px-3 py-5 font-bold text-baked">
                    {order.number}
                    <span className="mt-1 block text-[10px] font-normal text-muted">
                      {orderStatusLabels[order.status] || order.status} ·{' '}
                      {paymentStatusLabel(order)}
                    </span>
                  </td>
                  <td className="px-3 py-5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blush text-[10px] font-bold">
                        {initials(name)}
                      </span>
                      <div>
                        <p className="font-semibold">{name}</p>
                        <p className="mt-1 text-[10px] text-muted">
                          {order.recipient?.whatsapp || 'Nomor belum tersedia'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="max-w-xs px-3 py-5 leading-5">
                    <p
                      className="line-clamp-2"
                      title={order.items
                        .map((item) => `${item.quantity}× ${item.name}`)
                        .join(', ')}
                    >
                      {order.items
                        .map((item) => `${item.quantity}× ${item.name}`)
                        .join(', ')}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-3 py-5 font-bold">
                    {formatRupiah(order.total)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {!orders.length && (
        <p className="py-12 text-center text-sm text-muted">
          {emptyPeriod
            ? 'Belum ada transaksi pada periode ini'
            : emptyFiltered
              ? 'Tidak ada transaksi yang cocok dengan pencarian atau status.'
              : 'Tidak ada transaksi pada halaman ini.'}
        </p>
      )}
      <footer className="mt-5 flex flex-wrap items-center justify-between gap-4 text-xs text-muted">
        <p>
          Menampilkan {orders.length ? start + 1 : 0} -{' '}
          {Math.min(start + pageSize, orders.length)} dari {orders.length}{' '}
          transaksi aktif
        </p>
        <nav aria-label="Pagination transaksi" className="flex flex-wrap gap-1">
          <button
            type="button"
            aria-label="Halaman sebelumnya"
            disabled={current === 1}
            onClick={() => onPage(current - 1)}
            className="h-8 w-8 rounded-full hover:bg-peach disabled:opacity-30"
          >
            ‹
          </button>
          {Array.from({ length: pageCount }, (_, i) => i + 1)
            .filter(
              (n) => n === 1 || n === pageCount || Math.abs(n - current) <= 1,
            )
            .map((n) => (
              <button
                key={n}
                type="button"
                aria-label={`Halaman ${n}`}
                aria-current={current === n ? 'page' : undefined}
                onClick={() => onPage(n)}
                className={`h-8 w-8 rounded-full ${current === n ? 'bg-baked text-white' : 'hover:bg-peach'}`}
              >
                {n}
              </button>
            ))}
          <button
            type="button"
            aria-label="Halaman berikutnya"
            disabled={current === pageCount}
            onClick={() => onPage(current + 1)}
            className="h-8 w-8 rounded-full hover:bg-peach disabled:opacity-30"
          >
            ›
          </button>
        </nav>
      </footer>
    </section>
  )
}
