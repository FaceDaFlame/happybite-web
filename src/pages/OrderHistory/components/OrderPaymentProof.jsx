import { useEffect, useRef, useState } from 'react'
import { getMyPaymentProofUrl } from '@/services/orderService'

export default function OrderPaymentProof({ path }) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const active = useRef(false)
  useEffect(() => {
    active.current = true
    return () => {
      active.current = false
    }
  }, [])
  async function open() {
    setLoading(true)
    setError(false)
    try {
      const signed = await getMyPaymentProofUrl(path)
      if (active.current) setUrl(signed)
    } catch {
      if (active.current) setError(true)
    } finally {
      if (active.current) setLoading(false)
    }
  }
  return (
    <div className="mt-3">
      <button
        type="button"
        disabled={loading}
        onClick={open}
        className="text-baked underline"
      >
        {loading ? 'Memuat bukti...' : 'Lihat Bukti Pembayaran'}
      </button>
      {error && (
        <p role="alert" className="mt-2">
          Gagal memuat bukti pembayaran. Coba lagi.
        </p>
      )}
      {url && !error && (
        <a href={url} target="_blank" rel="noreferrer">
          <img
            src={url}
            alt="Bukti pembayaran"
            onError={() => setError(true)}
            className="mt-3 max-h-72 w-full rounded-xl object-contain"
          />
        </a>
      )}
    </div>
  )
}
