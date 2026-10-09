import Icon from '@/components/Icon'
import { adminOrderTabs } from '@/services/adminOrderService'

export default function OrdersToolbar({
  orders,
  onReload,
  busy,
  status,
  onStatus,
  query,
  onQuery,
  delivery,
  onDelivery,
  payment,
  onPayment,
  onExport,
}) {
  const selectClass =
    'min-w-0 rounded-full border border-transparent bg-blush/70 px-4 py-2.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-baked'
  return (
    <section
      aria-label="Filter pesanan"
      className="mb-7 space-y-6 rounded-2xl bg-white p-4 shadow-soft"
    >
      <div
        role="group"
        aria-label="Status pesanan"
        className="flex flex-wrap gap-2"
      >
        {adminOrderTabs.map((tab) => (
          <button
            type="button"
            key={tab.id}
            aria-pressed={status === tab.id}
            onClick={() => onStatus(tab.id)}
            className={`rounded-full px-4 py-2.5 text-xs font-semibold ${status === tab.id ? 'bg-baked text-white' : 'hover:bg-peach'}`}
          >
            {tab.label} (
            {tab.id === 'all'
              ? orders.length
              : orders.filter((o) => o.status === tab.id).length}
            )
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <label className="flex min-w-52 flex-1 items-center gap-2 rounded-full bg-peach px-3 focus-within:ring-2 focus-within:ring-terracotta/20">
          <Icon name="search" className="h-4 w-4 text-muted" />
          <input
            aria-label="Cari nomor pesanan atau pelanggan"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Cari no. order (#HB-2025...), nama pelanggan..."
            className="min-w-0 flex-1 bg-transparent py-2.5 text-xs outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </label>
        <select
          aria-label="Metode kirim"
          value={delivery}
          onChange={(e) => onDelivery(e.target.value)}
          className={selectClass}
        >
          <option value="all">Metode Kirim: Semua</option>
          {[
            ...new Set(
              orders.map((o) => o.deliveryMethod || 'Belum ditentukan'),
            ),
          ]
            .sort()
            .map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
        </select>
        <select
          aria-label="Status pembayaran"
          value={payment}
          onChange={(e) => onPayment(e.target.value)}
          className={selectClass}
        >
          <option value="all">Pembayaran: Semua Status</option>
          {[...new Set(orders.map((o) => o.paymentStatus))]
            .sort()
            .map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
        </select>
        <button
          type="button"
          disabled={busy}
          onClick={onExport}
          className="flex items-center justify-center gap-2 rounded-full bg-peach px-4 py-2.5 text-xs font-semibold hover:bg-blush"
        >
          <Icon name="download" className="h-4 w-4" />
          Ekspor CSV
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onReload}
          className="flex items-center justify-center gap-2 rounded-full bg-peach px-4 py-2.5 text-xs font-semibold hover:bg-blush"
        >
          Muat Ulang
        </button>
      </div>
    </section>
  )
}
