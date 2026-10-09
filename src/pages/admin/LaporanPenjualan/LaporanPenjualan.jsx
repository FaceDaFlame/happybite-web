import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getReportOrders } from '@/services/adminOrderService'
import useProductRequest from '@/hooks/useProductRequest'
import Icon from '@/components/Icon'
import { customerName } from '@/data/orderFulfillment'
import { formatRupiah } from '@/data/orderHistory'
import SalesStatCard from './components/SalesStatCard'
import SalesTrendChart from './components/SalesTrendChart'
import TransactionsTable from './components/TransactionsTable'
import {
  dateKey,
  defaultRange,
  ordersInRange,
  isQualifyingSale,
  paymentStatus,
  reportStats,
  validDate,
} from './utils/salesReport'
import { exportReportCsv, exportReportPdf } from './utils/reportExports'

export default function LaporanPenjualan() {
  const loadOrders = useCallback(() => getReportOrders(), [])
  const {
    data: loadedOrders,
    loading,
    error,
    retry,
  } = useProductRequest(loadOrders)
  const orders = loadedOrders || []
  const [today] = useState(() => dateKey(Date.now()))
  const [customRange, setCustomRange] = useState(null)
  const range = customRange || defaultRange(orders, today)
  const validRange =
    validDate(range.start) && validDate(range.end) && range.start <= range.end
  const periodOrders = ordersInRange(orders, range.start, range.end)
  const salesOrders = periodOrders.filter(isQualifyingSale)
  const stats = reportStats(salesOrders)
  const [params, setParams] = useSearchParams()
  const query = params.get('q') || ''
  const [payment, setPayment] = useState('all')
  const [orderStatus, setOrderStatus] = useState('all')
  const [page, setPage] = useState(1)
  const filtered = periodOrders.filter(
    (order) =>
      (payment === 'all' || paymentStatus(order) === payment) &&
      (orderStatus === 'all' || order.status === orderStatus) &&
      `${order.number} ${order.id} ${customerName(order)}`
        .toLocaleLowerCase('id-ID')
        .includes(query.trim().replace(/^#/, '').toLocaleLowerCase('id-ID')),
  )
  function changeRange(key, value) {
    setCustomRange({ ...range, [key]: value })
    setPage(1)
  }
  const actionClass =
    'inline-flex items-center justify-center gap-2 rounded-full border border-primary/20 bg-white px-4 py-2 text-xs font-semibold shadow-soft hover:bg-peach disabled:opacity-40'
  return (
    <div className="space-y-7">
      <header>
        <span className="inline-block rounded-full bg-blush px-3 py-1 text-[10px] font-bold tracking-wide text-baked">
          LAPORAN & KEUANGAN • PERIODE AKTIF
        </span>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-lg">
            <h1 className="text-3xl font-bold leading-snug tracking-tight">
              Laporan Penjualan & Analisis Finansial
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted">
              Pantau tren pertumbuhan pendapatan harian, performa varian
              terlaris, dan rekap detail transaksi pesanan toko.
            </p>
          </div>
          <div className="flex max-w-lg flex-wrap items-end gap-2">
            <div className="flex flex-wrap gap-2 rounded-2xl bg-white p-3 shadow-soft">
              {[
                ['start', 'Tanggal mulai'],
                ['end', 'Tanggal akhir'],
              ].map(([key, label]) => (
                <label
                  key={key}
                  className="text-[10px] font-semibold text-muted"
                >
                  {label}
                  <input
                    type="date"
                    aria-label={label}
                    aria-invalid={!validRange}
                    value={range[key]}
                    onChange={(e) => changeRange(key, e.target.value)}
                    className="mt-1 block rounded-full border border-primary/30 bg-canvas px-3 py-2 text-xs text-chocolate focus-visible:ring-offset-0"
                  />
                </label>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setCustomRange(null)
                setPage(1)
              }}
              className={actionClass}
            >
              Semua Periode
            </button>
            <button
              type="button"
              disabled={loading || error}
              onClick={() => window.print()}
              className={actionClass}
            >
              <Icon name="receipt" className="h-4 w-4" />
              Cetak Laporan
            </button>
            <button
              type="button"
              disabled={!validRange || loading || error}
              onClick={() =>
                exportReportPdf(salesOrders, range.start, range.end)
              }
              className={actionClass}
            >
              <Icon name="download" className="h-4 w-4" />
              Export PDF
            </button>
            <button
              type="button"
              disabled={!validRange || loading || error}
              title="Unduh CSV yang dapat dibuka di Excel"
              onClick={() =>
                exportReportCsv(salesOrders, range.start, range.end)
              }
              className="inline-flex items-center gap-2 rounded-full bg-baked px-4 py-2 text-xs font-semibold text-white shadow-soft hover:bg-terracotta disabled:opacity-40"
            >
              <Icon name="download" className="h-4 w-4" />
              Export Excel
            </button>
            <p className="w-full text-[10px] text-muted">
              Export Excel tersedia dalam format CSV.
            </p>
            <p className="w-full text-[10px] text-muted">
              PDF berisi ringkasan dan transaksi; gunakan Cetak Laporan untuk
              grafik.
            </p>
          </div>
        </div>
        {!validRange && (
          <p role="alert" className="mt-3 text-xs text-red-700">
            Pilih tanggal mulai dan akhir yang valid. Tanggal akhir tidak boleh
            sebelum tanggal mulai.
          </p>
        )}
      </header>
      {loading ? (
        <p
          role="status"
          className="rounded-2xl bg-white p-10 text-center text-muted shadow-soft"
        >
          Memuat laporan penjualan...
        </p>
      ) : error ? (
        <div
          role="alert"
          className="rounded-2xl bg-white p-10 text-center text-muted shadow-soft"
        >
          <p>Gagal memuat laporan penjualan.</p>
          <button
            type="button"
            onClick={retry}
            className="mt-3 text-baked underline"
          >
            Coba lagi
          </button>
        </div>
      ) : (
        <>
          <section
            aria-label="Ringkasan penjualan"
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            <SalesStatCard
              label="Total Pendapatan"
              value={formatRupiah(stats.total)}
              icon="money"
            />
            <SalesStatCard
              label="Total Pesanan"
              value={`${stats.count} Pesanan`}
              icon="bag"
            />
            <SalesStatCard
              label="Rata-rata Order (AOV)"
              value={formatRupiah(Math.round(stats.aov))}
              icon="sparkles"
            />
            <SalesStatCard
              label="Produk Terlaris"
              value={stats.top?.name || 'Belum ada produk terjual'}
              detail={stats.top ? `${stats.top.quantity} pcs` : undefined}
              icon="cookie"
            />
          </section>
          <p className="text-xs leading-5 text-muted">
            Ringkasan dan grafik menghitung pesanan berstatus pembayaran Lunas,
            kecuali pesanan yang dibatalkan. Pendapatan memakai total pesanan,
            termasuk ongkir. Tabel memuat semua transaksi pada periode terpilih.
          </p>
          <SalesTrendChart
            orders={salesOrders}
            start={range.start}
            end={range.end}
            validRange={validRange}
          />
          <TransactionsTable
            orders={filtered}
            query={query}
            onQuery={(value) => {
              setParams(value ? { q: value } : {}, { replace: true })
              setPage(1)
            }}
            payment={payment}
            onPayment={(value) => {
              setPayment(value)
              setPage(1)
            }}
            orderStatus={orderStatus}
            onOrderStatus={(value) => {
              setOrderStatus(value)
              setPage(1)
            }}
            page={page}
            onPage={setPage}
            onExport={() => exportReportCsv(filtered, range.start, range.end)}
            emptyPeriod={!periodOrders.length}
            emptyFiltered={!filtered.length && periodOrders.length > 0}
          />
        </>
      )}
    </div>
  )
}
