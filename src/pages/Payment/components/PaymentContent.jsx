import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SiteDialog from '@/components/SiteDialog'
import Icon from '@/components/Icon'
import CheckoutSteps from '@/components/StepProgress'
import PaymentProof from '@/pages/Payment/components/PaymentProof'
import PaymentSummary from '@/pages/Payment/components/PaymentSummary'
import {
  getOrderById,
  getOrderItems,
  uploadPaymentProof,
  submitPaymentProof,
  orderErrorMessage,
} from '@/services/orderService'
import { useAuth } from '@/context/authContext'
import useProductRequest from '@/hooks/useProductRequest'

export default function PaymentContent({ cartCount, order }) {
  const loadItems = useCallback(() => getOrderItems(order.id), [order.id])
  const {
    data: items,
    loading: itemsLoading,
    error: itemsError,
    retry: retryItems,
  } = useProductRequest(loadItems)
  const navigate = useNavigate()
  const { user } = useAuth()
  const [confirmationError, setConfirmationError] = useState('')
  const [dialog, setDialog] = useState(null)
  const [file, setFile] = useState(null)
  const [sender, setSender] = useState(order.nama_penerima || '')
  const [now, setNow] = useState(Date.now)
  const [copyMessage, setCopyMessage] = useState('')
  const [status, setStatus] = useState(order.status_pesanan)
  const [submitting, setSubmitting] = useState(false)
  const [serverExpired, setServerExpired] = useState(false)
  const pending = useRef(false)
  const uploaded = useRef(null)
  const openAccount = () => navigate('/login')
  const totals = {
    subtotal: Number(order.subtotal),
    shipping: Number(order.ongkir),
    service: 0,
    total: Number(order.total),
  }
  const checkout = {
    name: order.nama_penerima,
    whatsapp: order.no_whatsapp,
    email: order.email,
    address: order.alamat,
    city: order.kota,
    postalCode: order.kode_pos,
    notes: order.catatan_kurir,
  }
  const deadlineTime = Date.parse(order.batas_bayar)
  const seconds =
    !serverExpired && Number.isFinite(deadlineTime)
      ? Math.max(0, Math.ceil((deadlineTime - now) / 1000))
      : 0
  const awaitingPayment = status === 'menunggu_pembayaran'
  const expired = seconds === 0
  const timer =
    String(Math.floor(seconds / 60)).padStart(2, '0') +
    ':' +
    String(seconds % 60).padStart(2, '0')
  useEffect(() => {
    if (!awaitingPayment) return
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [awaitingPayment])
  useEffect(() => {
    if (!copyMessage) return
    const timeout = setTimeout(() => setCopyMessage(''), 2500)
    return () => clearTimeout(timeout)
  }, [copyMessage])
  const deadline = Number.isFinite(deadlineTime)
    ? new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(deadlineTime)
    : '-'
  const rupiah = (amount) => 'Rp ' + amount.toLocaleString('id-ID')
  async function copyAmount() {
    try {
      await navigator.clipboard.writeText(String(order.total))
      setCopyMessage('Nominal tersalin!')
    } catch {
      setCopyMessage('Gagal menyalin. Silakan salin nominal secara manual.')
    }
  }
  async function confirm(event) {
    event.preventDefault()
    if (pending.current || !file || !awaitingPayment) return
    if (Date.now() >= deadlineTime || !Number.isFinite(deadlineTime)) {
      setNow(Date.now())
      setConfirmationError('Batas waktu pembayaran sudah lewat.')
      return
    }
    pending.current = true
    setSubmitting(true)
    setConfirmationError('')
    try {
      // Recheck server state before uploading (another tab may have submitted).
      const latest = await getOrderById(order.id)
      if (!latest) throw new Error('Pesanan tidak ditemukan.')
      if (latest.status_pesanan !== 'menunggu_pembayaran') {
        setStatus(latest.status_pesanan)
        setFile(null)
        return
      }
      const end = Date.parse(latest.batas_bayar)
      if (!Number.isFinite(end) || Date.now() >= end)
        throw new Error('Batas waktu pembayaran sudah lewat.')
      // If the RPC fails, retry the same uploaded path instead of uploading twice.
      if (uploaded.current?.file !== file) {
        const path = await uploadPaymentProof(order.id, user.id, file)
        uploaded.current = { file, path }
      }
      if (Date.now() >= end)
        throw new Error('Batas waktu pembayaran sudah lewat.')
      await submitPaymentProof(order.id, uploaded.current.path, sender)
      setStatus('menunggu_konfirmasi')
      setFile(null)
      uploaded.current = null
    } catch (error) {
      setConfirmationError(orderErrorMessage(error))
      if (orderErrorMessage(error) === 'Batas waktu pembayaran sudah lewat.')
        setServerExpired(true)
    } finally {
      pending.current = false
      setSubmitting(false)
    }
  }
  function chooseFile(next) {
    if (pending.current) return
    setFile(next)
    setConfirmationError('')
    if (uploaded.current?.file !== next) uploaded.current = null
  }
  const statusMessage =
    status === 'menunggu_konfirmasi'
      ? 'Bukti pembayaran sudah dikirim. Menunggu verifikasi admin.'
      : status === 'dibatalkan'
        ? 'Pesanan dibatalkan.'
        : 'Status pesanan: ' + String(status).replaceAll('_', ' ') + '.'
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <Navbar
        cartCount={cartCount}
        onAccount={openAccount}
        onSearch={() => navigate('/katalog#catalog-search')}
      />
      <main className="flex-1">
        <CheckoutSteps step={3} />
        <div className="mx-auto grid max-w-[1320px] items-start gap-6 px-5 py-8 pb-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:px-8">
          <section className="min-w-0 rounded-[30px] bg-white p-5 shadow-soft sm:p-8">
            <div className="flex items-start gap-3">
              <span className="rounded-full bg-peach p-3 text-baked">
                <Icon name="qr" className="h-6 w-6" />
              </span>
              <div>
                <h1 className="text-xl font-semibold sm:text-2xl">
                  Pembayaran Instan QRIS
                </h1>
                <p className="mt-1 text-xs leading-5 text-muted">
                  Metode resmi nasional tanpa biaya transaksi tambahan
                </p>
              </div>
            </div>
            <p className="mt-4 rounded-xl bg-cream px-3 py-2 text-xs leading-5 text-baked">
              Mode demo: kode QR ini adalah placeholder dan tidak dapat
              digunakan untuk pembayaran.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[26px] bg-blush/80 p-4 sm:p-5">
              <div className="flex items-center gap-2 text-baked">
                <Icon name="clock" className="h-6 w-6" />
                <div>
                  <p className="text-[10px] font-bold">SELESAIKAN DALAM</p>
                  <output
                    aria-label="Sisa waktu pembayaran"
                    className="text-2xl font-bold tabular-nums"
                  >
                    {timer}
                  </output>
                </div>
              </div>
              <p className="max-w-64 text-xs leading-5 text-muted">
                Batas waktu pembayaran s/d {deadline} WIB. Pesanan akan otomatis
                dibatalkan jika melewati batas waktu.
              </p>
            </div>
            {awaitingPayment && expired && (
              <div
                role="alert"
                className="mt-3 rounded-xl border border-primary bg-peach p-4 text-sm text-baked"
              >
                Waktu pembayaran habis.{' '}
                <Link to="/checkout" className="font-bold underline">
                  Kembali ke checkout.
                </Link>
              </div>
            )}
            <section className="mt-5 rounded-[26px] bg-peach p-4 sm:p-5">
              <h2 className="text-xs font-semibold">
                Total Tagihan Pembayaran
              </h2>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-baseline gap-2">
                  <p
                    aria-label="Total tagihan"
                    className="text-3xl font-bold text-baked sm:text-4xl"
                  >
                    {rupiah(totals.total)}
                  </p>
                  <span className="rounded-full bg-blush/60 px-2 py-1 text-[9px] font-bold">
                    Kode Unik Aktif · Demo
                  </span>
                </div>
                <button
                  type="button"
                  onClick={copyAmount}
                  className="inline-flex items-center gap-1 rounded-full bg-canvas px-3 py-2 text-xs font-bold text-baked"
                >
                  <Icon name="copy" className="h-3.5 w-3.5" />
                  Salin Nominal
                </button>
              </div>
              <p
                role="status"
                className="mt-2 text-xs font-semibold text-baked empty:hidden"
              >
                {copyMessage}
              </p>
              <p className="mt-3 text-xs leading-5 text-muted">
                Mohon transfer sesuai nominal persis hingga digit terakhir agar
                sistem mendeteksi pembayaran secara otomatis.
              </p>
            </section>
            <section className="mt-5 rounded-[26px] bg-white p-4 text-center shadow-soft sm:p-6">
              <div className="flex flex-wrap items-center justify-center gap-8 text-[10px] font-bold">
                <span>
                  QRIS{' '}
                  <span className="rounded-full bg-chocolate px-2 py-1 text-white">
                    STANDAR · DEMO
                  </span>
                </span>
                <span className="rounded-full bg-blush px-2 py-1 text-baked">
                  GPN · DEMO
                </span>
              </div>
              <img
                src="/images/qris-demo.svg"
                alt="Contoh QR demo HappyBite, bukan kode pembayaran"
                width="280"
                height="280"
                className="mx-auto my-5 aspect-square w-full max-w-64 rounded-2xl shadow-soft"
              />
              <p className="text-[10px] font-bold text-muted">
                NAMA MERCHANT RESMI (DEMO)
              </p>
              <h2 className="mt-1 text-sm font-bold">
                PT HAPPYBITE KREASI INDONESIA
              </h2>
              <p className="mt-1 text-xs text-muted">
                NMID: DEMO — belum terhubung ke merchant
              </p>
              <p className="mx-auto mt-3 max-w-sm text-xs leading-5 text-muted">
                Scan kode QR menggunakan aplikasi{' '}
                <strong>
                  BCA Mobile, Livin’ Mandiri, GoPay, OVO, ShopeePay, Dana,
                  LinkAja
                </strong>
                , atau m-Banking yang mendukung QRIS saat layanan tersedia.
              </p>
              <a
                href="/images/qris-demo.svg"
                download="HappyBite-QRIS-Demo.svg"
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-blush/70 px-4 py-2.5 text-xs font-bold"
              >
                <Icon name="download" className="h-4 w-4" />
                Unduh Kode QR (Simpan Gambar)
              </a>
            </section>
            <section className="mt-5 rounded-[26px] bg-peach p-4">
              <h2 className="mb-3 text-lg font-semibold text-baked">
                4 Langkah Mudah Bayar QRIS
              </h2>
              <ol className="grid gap-2 sm:grid-cols-2">
                {[
                  'Buka aplikasi m-Banking atau e-Wallet favoritmu.',
                  'Pilih menu Bayar / Scan QRIS dan arahkan kamera ke kode QR.',
                  'Periksa nama penerima: PT HAPPYBITE KREASI INDONESIA.',
                  `Masukkan nominal ${rupiah(totals.total)} dan konfirmasi pembayaran.`,
                ].map((instruction, index) => (
                  <li
                    key={instruction}
                    className="flex items-start gap-2 rounded-2xl bg-white p-3 text-xs leading-5 text-muted"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blush font-bold text-baked">
                      {index + 1}
                    </span>
                    {instruction}
                  </li>
                ))}
              </ol>
            </section>
            {awaitingPayment && !expired ? (
              <form onSubmit={confirm}>
                <PaymentProof
                  file={file}
                  onFile={chooseFile}
                  disabled={submitting}
                />
                <label
                  htmlFor="payment-sender"
                  className="mt-5 block text-xs font-bold"
                >
                  Nama Pemilik Akun / Rekening Pengirim (Opsional)
                </label>
                <input
                  id="payment-sender"
                  disabled={submitting}
                  value={sender}
                  onChange={(event) => setSender(event.target.value)}
                  autoComplete="name"
                  className="mt-2 w-full rounded-xl border border-primary/20 px-3 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-terracotta/30 focus-visible:ring-offset-0"
                />
                <button
                  type="submit"
                  disabled={!file || submitting}
                  aria-busy={submitting}
                  className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-baked px-4 py-3 text-sm font-bold text-white shadow-warm hover:bg-terracotta disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Icon name="seal" className="h-5 w-5" />
                  {submitting
                    ? 'Memproses...'
                    : 'Konfirmasi Pembayaran Sekarang'}
                </button>
              </form>
            ) : !awaitingPayment ? (
              <p
                role="status"
                className="mt-3 rounded-xl border border-primary bg-peach p-4 text-sm text-baked"
              >
                {statusMessage}
              </p>
            ) : null}
            {confirmationError && (
              <p role="alert" className="mt-3 text-sm text-baked">
                {confirmationError}
              </p>
            )}
            <div className="mt-4 flex flex-wrap justify-between gap-3">
              <Link
                to="/checkout"
                className="flex items-center gap-1 text-xs font-semibold"
              >
                <Icon name="back" className="h-3.5 w-3.5" />
                Kembali ke Data Pengiriman
              </Link>
              <p className="flex items-center gap-1 text-[9px] text-muted">
                <Icon name="shield" className="h-3 w-3" />
                Mode demo • Verifikasi gateway belum tersedia
              </p>
            </div>
          </section>
          <PaymentSummary
            order={order}
            checkout={checkout}
            items={items || []}
            itemsLoading={itemsLoading}
            itemsError={itemsError}
            onRetryItems={retryItems}
            status={status}
            totals={totals}
            expired={awaitingPayment && expired}
          />
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
