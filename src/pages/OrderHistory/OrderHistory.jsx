import { useCallback, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/authContext'
import { getMyOrders, confirmOrderReceived } from '@/services/orderService'
import useProductRequest from '@/hooks/useProductRequest'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Icon from '@/components/Icon'
import SiteDialog from '@/components/SiteDialog'
import OrderHistoryCard from '@/pages/OrderHistory/components/OrderHistoryCard'
import OrderHistoryDialog from '@/pages/OrderHistory/components/OrderHistoryDialog'
import { customerOrderTabs as orderStatuses } from '@/data/customerOrders'
import { downloadOrderPdf } from '@/pages/OrderHistory/utils/orderPdf'

export default function OrderHistory({ cartCount }) {
  const { isLoggedIn, user, loading } = useAuth()
  if (loading)
    return (
      <p role="status" className="p-8 text-center text-muted">
        Memuat riwayat pesanan...
      </p>
    )
  if (!isLoggedIn) return <Navigate to="/login" replace />
  return (
    <CustomerHistory key={user.id} userId={user.id} cartCount={cartCount} />
  )
}

function CustomerHistory({ userId, cartCount }) {
  const navigate = useNavigate()
  const loadOrders = useCallback(() => getMyOrders(userId), [userId])
  const { data, loading, error, retry } = useProductRequest(loadOrders)
  const orders = data || []
  const [busy, setBusy] = useState(null)
  const pending = useRef(false)
  const [reference] = useState(Date.now)
  const [status, setStatus] = useState('all')
  const [query, setQuery] = useState('')
  const [days, setDays] = useState('30')
  const [limit, setLimit] = useState(3)
  const [selected, setSelected] = useState(null)
  const [dialog, setDialog] = useState(null)
  const [notice, setNotice] = useState('')
  const openAccount = () => navigate('/login')
  const inPeriod = (order) =>
    days === 'all' ||
    new Date(order.timestamp).getTime() >= reference - Number(days) * 86400000
  const periodOrders = orders.filter(inPeriod)
  const filtered = periodOrders.filter(
    (order) =>
      (status === 'all' || order.status === status) &&
      `${order.number} ${order.items.map((item) => item.name).join(' ')}`
        .toLocaleLowerCase('id-ID')
        .includes(query.trim().toLocaleLowerCase('id-ID')),
  )
  function resetFilters() {
    setStatus('all')
    setQuery('')
    setDays('30')
    setLimit(3)
  }
  async function confirm(order) {
    if (order.status !== 'dikirim' || pending.current) return
    pending.current = true
    setBusy(order.id)
    try {
      await confirmOrderReceived(order.id)
      setNotice('Pesanan berhasil dikonfirmasi diterima.')
      retry()
    } catch {
      setNotice('Gagal mengonfirmasi pesanan. Coba lagi.')
    } finally {
      pending.current = false
      setBusy(null)
    }
  }
  const selectedOrder = orders.find((order) => order.id === selected)
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <Navbar
        cartCount={cartCount}
        onAccount={openAccount}
        onSearch={() => navigate('/katalog#catalog-search')}
      />
      <main className="flex-1">
        <div className="mx-auto max-w-[1320px] px-5 pb-12 pt-5 lg:px-8">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-1 text-[10px] font-semibold text-muted"
          >
            <Link to="/" className="hover:text-baked">
              Beranda
            </Link>
            <Icon name="chevronRight" className="h-3 w-3" />
            <Link to="/profil" className="hover:text-baked">
              Profil Akun
            </Link>
            <Icon name="chevronRight" className="h-3 w-3" />
            <span aria-current="page" className="text-baked">
              Riwayat Pesanan
            </span>
          </nav>
          <h1 className="mt-3 text-3xl font-bold tracking-[-.8px] sm:text-4xl">
            Riwayat & Status Pesanan
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-muted sm:text-base">
            Pantau perjalanan cookie artisan hangatmu dari adonan lembut,
            panggangan oven, hingga tiba tepat waktu di depan pintu rumah.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3 rounded-[30px] bg-white p-3 shadow-soft">
            <div
              role="group"
              aria-label="Filter status pesanan"
              className="flex flex-wrap gap-1.5"
            >
              {orderStatuses.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  aria-pressed={status === item.id}
                  onClick={() => {
                    setStatus(item.id)
                    setLimit(3)
                  }}
                  className={`rounded-full px-3 py-2 text-[11px] font-semibold ${status === item.id ? 'bg-baked text-white' : 'bg-peach hover:bg-blush'}`}
                >
                  {item.label} (
                  {
                    periodOrders.filter(
                      (order) => item.id === 'all' || order.status === item.id,
                    ).length
                  }
                  )
                </button>
              ))}
            </div>
            <div className="flex min-w-0 flex-1 basis-80 flex-wrap gap-2 xl:flex-nowrap">
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-peach px-3 focus-within:ring-2 focus-within:ring-terracotta/30">
                <Icon name="search" className="h-4 w-4 text-muted" />
                <label htmlFor="history-search" className="sr-only">
                  Cari invoice / jenis cookie
                </label>
                <input
                  id="history-search"
                  type="search"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value)
                    setLimit(3)
                  }}
                  placeholder="Cari invoice / jenis cookie..."
                  className="min-w-0 w-full bg-transparent py-2.5 text-xs outline-none placeholder:text-muted/70 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <label htmlFor="history-date" className="sr-only">
                Rentang tanggal pesanan
              </label>
              <select
                id="history-date"
                value={days}
                onChange={(event) => {
                  setDays(event.target.value)
                  setLimit(3)
                }}
                title="Rentang waktu dihitung dari hari ini"
                className="max-w-full rounded-full border border-transparent bg-peach px-3 py-2.5 text-xs outline-none focus:border-baked"
              >
                <option value="30">30 Hari Terakhir</option>
                <option value="7">7 Hari Terakhir</option>
                <option value="all">Semua Tanggal</option>
              </select>
            </div>
          </div>
          <p role="status" className="sr-only">
            {loading
              ? 'Memuat riwayat pesanan...'
              : `${filtered.length} pesanan ditemukan.`}
          </p>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              disabled={loading || Boolean(busy)}
              onClick={retry}
              className="rounded-full bg-blush px-5 py-2.5 text-xs font-bold hover:bg-primary"
            >
              Muat Ulang
            </button>
          </div>
          {loading && (
            <p role="status" className="p-10 text-center text-muted">
              Memuat riwayat pesanan...
            </p>
          )}
          {error && (
            <div role="alert" className="p-10 text-center text-muted">
              <p>Gagal memuat riwayat pesanan.</p>
              <button
                type="button"
                onClick={retry}
                className="mt-3 text-baked underline"
              >
                Coba lagi
              </button>
            </div>
          )}
          <div className="mt-6 space-y-6" aria-label="Daftar pesanan">
            {filtered.slice(0, limit).map((order) => (
              <OrderHistoryCard
                key={order.id}
                order={order}
                onDetails={(item) => setSelected(item.id)}
                onConfirm={confirm}
                busy={Boolean(busy)}
                onDownload={downloadOrderPdf}
              />
            ))}
          </div>
          {!loading && !error && !filtered.length && (
            <section className="rounded-[30px] bg-white p-10 text-center shadow-soft">
              <Icon name="receipt" className="mx-auto h-10 w-10 text-primary" />
              <h2 className="mt-4 text-xl font-bold">
                Tidak ada pesanan yang cocok
              </h2>
              <p className="mt-2 text-sm text-muted">
                Coba status, kata kunci, atau rentang tanggal lain.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-5 rounded-full bg-baked px-5 py-3 text-sm font-bold text-white"
              >
                Tampilkan Semua Pesanan
              </button>
            </section>
          )}
          {limit < filtered.length && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setLimit((current) => current + 5)}
                className="rounded-full bg-blush px-6 py-3 text-xs font-bold hover:bg-primary"
              >
                Muat Pesanan Lainnya ({filtered.length - limit})
              </button>
            </div>
          )}
          <section className="mt-8 flex flex-wrap items-center justify-between gap-5 rounded-[30px] bg-gradient-to-r from-blush to-peach p-6">
            <div className="flex max-w-3xl items-start gap-4">
              <span className="rounded-full bg-baked p-4 text-white shadow-soft">
                <Icon name="headset" className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-lg font-semibold">
                  Ada Kendala dengan Pesanan atau Pengiriman?
                </h2>
                <p className="mt-1 text-xs leading-6 text-muted">
                  Tim Kitchen & Logistics Concierge HappyBite siap membantumu
                  via WhatsApp untuk memastikan kehangatan setiap gigitan.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDialog('Kontak HappyBite')}
              className="inline-flex items-center gap-2 rounded-full bg-baked px-5 py-3 text-xs font-bold text-white shadow-soft hover:bg-terracotta"
            >
              <Icon name="chat" className="h-4 w-4" />
              Chat WhatsApp Admin
            </button>
          </section>
        </div>
      </main>
      <Footer onAccount={openAccount} onInfo={setDialog} />
      {selectedOrder && (
        <OrderHistoryDialog
          key={selectedOrder.id}
          order={selectedOrder}
          onClose={() => setSelected(null)}
        />
      )}
      {dialog && (
        <SiteDialog
          kind={dialog}
          onClose={() => setDialog(null)}
          onAccount={openAccount}
        />
      )}
      {notice && (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-3 rounded-2xl bg-white p-4 text-xs shadow-warm"
        >
          <p className="flex-1">{notice}</p>
          <button
            type="button"
            onClick={() => setNotice('')}
            aria-label="Tutup pemberitahuan"
            className="rounded-full p-1"
          >
            <Icon name="close" className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
