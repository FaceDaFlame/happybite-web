import { useEffect, useRef, useState } from 'react'
import Icon from '@/components/Icon'
import { validatePaymentProof } from '@/services/orderService'

export default function PaymentProof({ file, onFile, disabled }) {
  const input = useRef(null)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const preview = useRef(null)
  useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file)
    if (preview.current) preview.current.src = url
    return () => URL.revokeObjectURL(url)
  }, [file])
  function selectFile(files) {
    if (disabled) return
    setError('')
    if (!files.length) return
    if (files.length !== 1) {
      setError('Pilih satu file bukti pembayaran.')
      return
    }
    const next = files[0]
    try {
      validatePaymentProof(next)
    } catch (error) {
      setError(error.message)
      return
    }
    onFile(next)
  }
  return (
    <section className="mt-6" aria-labelledby="proof-title">
      <h2 id="proof-title" className="text-sm font-bold">
        Upload Bukti Pembayaran (Verifikasi Cepat)
      </h2>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        disabled={disabled}
        aria-label="Pilih bukti pembayaran"
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          selectFile(event.target.files)
          event.target.value = ''
        }}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => input.current?.click()}
        onDragOver={(event) => {
          event.preventDefault()
          if (!disabled) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          selectFile(event.dataTransfer.files)
        }}
        aria-describedby={error ? 'proof-error' : 'proof-help'}
        className={`mt-3 flex min-h-40 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-5 text-center disabled:cursor-not-allowed disabled:opacity-50 ${dragging ? 'border-baked bg-peach' : 'border-primary/25 bg-canvas/40 hover:bg-peach/50'}`}
      >
        <span className="rounded-full bg-blush p-3 text-baked">
          <Icon name="upload" className="h-6 w-6" />
        </span>
        <span className="text-xs font-bold">
          Klik atau tarik screenshot bukti transfer di sini
        </span>
        <span id="proof-help" className="text-xs text-muted">
          Format: JPG, PNG, WEBP (Maksimal 2 MB)
        </span>
      </button>
      {error && (
        <p id="proof-error" role="alert" className="mt-2 text-xs text-baked">
          {error}
        </p>
      )}
      {file && (
        <div className="mt-3 flex items-center gap-3 rounded-xl bg-blush p-3">
          <img
            ref={preview}
            alt="Preview bukti pembayaran"
            className="h-14 w-14 rounded-lg object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="break-all text-xs font-bold">{file.name}</p>
            <p role="status" className="mt-1 text-[11px] text-baked">
              {Math.max(1, Math.ceil(file.size / 1024))} KB • Siap diverifikasi
            </p>
          </div>
          <button
            type="button"
            aria-label="Hapus bukti pembayaran"
            disabled={disabled}
            onClick={() => {
              onFile(null)
              setError('')
            }}
            className="rounded-full p-2 hover:bg-primary/30"
          >
            <Icon name="close" className="h-4 w-4" />
          </button>
        </div>
      )}
    </section>
  )
}
