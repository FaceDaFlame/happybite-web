import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'
import { gallery } from '@/data/homeGallery'

const faqs = [
  [
    'Bagaimana cara memesan?',
    'Masuk ke akun, pilih cookie favorit, lalu lanjutkan ke keranjang dan pembayaran. Layanan akun dan pemesanan online akan segera tersedia.',
  ],
  [
    'Apakah tersedia pengiriman di hari yang sama?',
    'Pilihan Instant dan Sameday ditujukan untuk wilayah Jabodetabek. Ketersediaan kurir dan ongkir akan ditampilkan saat checkout tersedia.',
  ],
  [
    'Apakah cookie mengandung alergen?',
    'Cookie mengandung gandum (gluten), susu, dan telur. Beberapa varian mengandung kacang. Semua varian dibuat di dapur yang juga mengolah kacang.',
  ],
  [
    'Bagaimana cara menyimpan cookie?',
    'Simpan dalam wadah tertutup di tempat sejuk dan kering. Ikuti petunjuk penyimpanan pada kemasan untuk setiap varian.',
  ],
]

const information = {
  'Kebijakan Privasi': 'Kebijakan privasi HappyBite akan segera tersedia.',
  'Syarat & Ketentuan': 'Syarat dan ketentuan HappyBite akan segera tersedia.',
}

export default function SiteDialog({ kind, onClose, onAccount }) {
  const dialog = useRef(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    const element = dialog.current
    const previousFocus = document.activeElement
    element.showModal()
    document.body.classList.add('overflow-hidden')
    return () => {
      element.close()
      document.body.classList.remove('overflow-hidden')
      previousFocus?.focus()
    }
  }, [])

  const title = kind === 'search' ? 'Cari gigitan bahagiamu' : kind
  const matches = gallery.filter((product) =>
    `${product.name} ${product.description}`
      .toLowerCase()
      .includes(query.toLowerCase().trim()),
  )
  const isContact = ['Kontak HappyBite', 'Instagram', 'TikTok'].includes(kind)
  const relevantFaqs = faqs.filter((_, index) =>
    kind === 'Informasi Alergen'
      ? index === 2
      : kind === 'Pengiriman & Same-Day Delivery'
        ? index === 1
        : true,
  )

  return (
    <dialog
      ref={dialog}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      aria-labelledby="dialog-title"
      className="m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-[30px] bg-canvas p-0 text-chocolate shadow-warm backdrop:bg-chocolate/45 backdrop:backdrop-blur-sm"
    >
      <div className="p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 id="dialog-title" className="text-xl font-bold">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Tutup dialog"
            className="rounded-full bg-peach p-2"
          >
            <Icon name="close" />
          </button>
        </div>
        {information[kind] ? (
          <p className="text-sm leading-7 text-muted">{information[kind]}</p>
        ) : kind === 'search' ? (
          <>
            <label
              htmlFor="cookie-search"
              className="mb-2 block text-sm font-semibold"
            >
              Nama atau rasa cookie
            </label>
            <div className="flex items-center gap-3 rounded-xl border border-primary/40 bg-white px-4">
              <Icon name="search" className="h-4 w-4 text-muted" />
              <input
                autoFocus
                id="cookie-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Coba: matcha, cokelat, walnut…"
                className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none focus-visible:ring-0"
              />
            </div>
            <p role="status" className="mb-4 mt-3 text-xs text-muted">
              {matches.length} cookie ditemukan
            </p>
            <div className="space-y-3">
              {matches.map((product) => (
                <button
                  key={product.name}
                  onClick={onAccount}
                  className="flex w-full items-center gap-4 rounded-xl bg-white p-3 text-left hover:bg-peach"
                >
                  <img
                    src={product.image}
                    alt=""
                    className="h-16 w-16 rounded-xl object-cover"
                  />
                  <span>
                    <span className="block text-sm font-bold">
                      {product.name}
                    </span>
                    <span className="mt-1 block text-xs text-baked">
                      Masuk untuk lihat menu & pesan →
                    </span>
                  </span>
                </button>
              ))}
            </div>
            {!matches.length && (
              <p className="py-6 text-center text-sm text-muted">
                Belum ada cookie yang cocok. Coba kata kunci lain, ya.
              </p>
            )}
          </>
        ) : isContact ? (
          <p className="text-sm leading-7 text-muted">
            Kontak dan akun media sosial resmi HappyBite akan segera tersedia di
            sini. Nantikan kabar manis dari dapur kami!
          </p>
        ) : (
          <div className="space-y-3">
            {relevantFaqs.map(([question, answer]) => (
              <details
                key={question}
                className="rounded-2xl bg-peach p-4"
                open={kind !== 'FAQ (Tanya Jawab)' || undefined}
              >
                <summary className="cursor-pointer text-sm font-bold">
                  {question}
                </summary>
                <p className="mt-3 text-sm leading-7 text-muted">{answer}</p>
              </details>
            ))}
          </div>
        )}
      </div>
    </dialog>
  )
}
