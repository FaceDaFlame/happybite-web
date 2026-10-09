import { useEffect, useRef } from 'react'
import Icon from '@/components/Icon'

export default function ProofZoom({ src, onClose, onError }) {
  const dialog = useRef(null)
  useEffect(() => {
    const element = dialog.current
    const previous = document.activeElement
    element.showModal()
    return () => {
      element.close()
      previous?.focus()
    }
  }, [])
  return (
    <dialog
      ref={dialog}
      aria-label="Bukti pembayaran diperbesar"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-4xl rounded-2xl bg-canvas p-4 text-chocolate shadow-warm backdrop:bg-chocolate/60"
    >
      <div className="mb-3 flex items-center justify-between gap-4">
        <p className="font-bold">Bukti Pembayaran</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup foto"
          className="rounded-full bg-peach p-3"
        >
          <Icon name="close" />
        </button>
      </div>
      <img
        src={src}
        alt="Bukti pembayaran diperbesar"
        onError={onError}
        className="max-h-[75dvh] w-full rounded-xl object-contain"
      />
    </dialog>
  )
}
