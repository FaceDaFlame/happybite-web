import { useCallback, useState } from 'react'
import { getPaymentProofUrl } from '@/services/adminOrderService'
import useProductRequest from '@/hooks/useProductRequest'
import { formatRupiah, formatOrderDate } from '@/data/orderHistory'
import ProofZoom from './ProofZoom'

export default function PaymentEvidence({ payment, status }) {
  const path = payment?.path
  const load = useCallback(
    () => path ? getPaymentProofUrl(path) : Promise.resolve(null),
    [path],
  )
  const { data: url, loading, error, retry } = useProductRequest(load)
  const [imageError, setImageError] = useState(false)
  const [zoom, setZoom] = useState(false)
  return (
    <section aria-label="Pembayaran" className="my-6 rounded-2xl bg-peach p-4">
      <h3 className="mb-4 text-[11px] font-bold">BUKTI PEMBAYARAN</h3>
      <p className="text-xs font-bold text-baked">{status}</p>
      {payment ? (
        <>
          <dl className="mt-3 space-y-2 text-[11px]">
            <div>
              <dt>Nama Pengirim</dt>
              <dd className="font-semibold">{payment.sender || '-'}</dd>
            </div>
            <div>
              <dt>Nominal</dt>
              <dd>{formatRupiah(payment.amount)}</dd>
            </div>
            <div>
              <dt>Diunggah</dt>
              <dd>
                {payment.uploadedAt ? formatOrderDate(payment.uploadedAt) : '-'}
              </dd>
            </div>
          </dl>
          {!payment.path ? (
            <p className="mt-3 text-xs text-muted">
              Bukti pembayaran belum tersedia.
            </p>
          ) : loading ? (
            <p role="status" className="mt-3 text-xs text-muted">
              Memuat bukti...
            </p>
          ) : error || imageError ? (
            <div role="alert" className="mt-3 text-xs text-baked">
              <p>Gagal memuat bukti pembayaran. Coba lagi.</p>
              <button
                type="button"
                onClick={() => {
                  setImageError(false)
                  retry()
                }}
                className="mt-2 font-semibold underline"
              >
                Muat Ulang Bukti
              </button>
            </div>
          ) : (
            url && (
              <button
                type="button"
                onClick={() => setZoom(true)}
                aria-label="Perbesar bukti pembayaran"
                className="mt-3 w-full rounded-xl"
              >
                <img
                  src={url}
                  alt="Bukti pembayaran"
                  onError={() => setImageError(true)}
                  className="max-h-[75dvh] w-full rounded-xl object-contain"
                />
              </button>
            )
          )}
        </>
      ) : (
        <p className="mt-3 text-xs text-muted">Belum ada bukti pembayaran.</p>
      )}
      {zoom && url && (
        <ProofZoom
          src={url}
          onClose={() => setZoom(false)}
          onError={() => {
            setZoom(false)
            setImageError(true)
          }}
        />
      )}
    </section>
  )
}
