import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useProducts } from '@/context/productsContext'
import ProductRequestStatus from '@/components/ProductRequestStatus'
import { stockStatus } from '@/data/productStore'
import Icon from '@/components/Icon'
import ProductEditor from './components/ProductEditor'
import ProductTable from './components/ProductTable'
import { exportCatalogPdf } from './utils/catalogPdf'

export default function ManajemenProduk() {
  const {
    products,
    categories,
    loading,
    error,
    reload,
    duplicateProduct,
    deleteProduct,
  } = useProducts()
  const [params, setParams] = useSearchParams()
  const query = params.get('q') || ''
  const [category, setCategory] = useState('all')
  const [status, setStatus] = useState('all')
  const [perPage, setPerPage] = useState(8)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState([])
  const [editor, setEditor] = useState(null)
  const [notice, setNotice] = useState('')
  const [deleting, setDeleting] = useState(null)
  const [acting, setActing] = useState(false)
  const closeEditor = useCallback(() => setEditor(null), [setEditor])
  const filtered = products.filter(
    (p) =>
      (category === 'all' || p.category === category) &&
      (status === 'all' || stockStatus(p) === status) &&
      `${p.name} ${p.sku}`
        .toLocaleLowerCase('id-ID')
        .includes(query.trim().toLocaleLowerCase('id-ID')),
  )
  const pages = Math.max(1, Math.ceil(filtered.length / perPage))
  const currentPage = Math.min(page, pages)
  const start = (currentPage - 1) * perPage
  const visible = filtered.slice(start, start + perPage)
  async function action(callback, message) {
    if (acting) return false
    setActing(true)
    try {
      await callback()
      setNotice(message)
      return true
    } catch (error) {
      setNotice(error.message)
      return false
    } finally {
      setActing(false)
    }
  }
  return (
    <div className={editor ? 'xl:pr-[480px] 2xl:pr-[560px]' : ''}>
      <header className="mb-7 flex flex-wrap items-start justify-between gap-5">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight">
            Manajemen Produk
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Kelola varian cookie artisan, ketersediaan loyang display etalase,
            monitoring adonan dingin (chilled dough), dan pengaturan harga
            katalog.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3 2xl:flex-col">
          <button
            type="button"
            onClick={() => exportCatalogPdf(filtered)}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/40 bg-peach px-4 py-2.5 text-xs font-semibold"
          >
            <Icon name="download" className="h-4 w-4" />
            Export Katalog PDF
          </button>
          <button
            type="button"
            disabled={loading || error || !categories.length || acting}
            onClick={() => setEditor({ product: null })}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-baked px-4 py-2.5 text-xs font-semibold text-white shadow-soft hover:bg-terracotta"
          >
            <Icon name="plus" className="h-4 w-4" />
            Tambah Produk Baru
          </button>
        </div>
      </header>
      <section
        aria-label="Filter produk"
        className="mb-7 space-y-6 rounded-2xl bg-white p-5 shadow-soft"
      >
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'Semua Produk' },
            ...categories.map((c) => ({ id: c.slug, label: c.nama })),
          ].map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={category === c.id}
              onClick={() => {
                setCategory(c.id)
                setPage(1)
              }}
              className={`rounded-full px-3 py-2 text-xs font-semibold ${category === c.id ? 'bg-baked text-white' : 'bg-peach hover:bg-blush'}`}
            >
              {c.label} (
              {c.id === 'all'
                ? products.length
                : products.filter((p) => p.category === c.id).length}
              )
            </button>
          ))}
        </div>
        <div className="flex flex-wrap justify-between gap-4">
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-muted/50 bg-peach px-3 focus-within:border-terracotta focus-within:ring-2 focus-within:ring-terracotta/15 sm:max-w-lg">
            <Icon name="search" className="h-4 w-4 text-muted" />
            <input
              aria-label="Cari produk atau SKU"
              value={query}
              onChange={(e) => {
                setParams(e.target.value ? { q: e.target.value } : {}, {
                  replace: true,
                })
                setPage(1)
              }}
              placeholder="Cari varian cookie atau SKU (e.g. HB-RV-01)..."
              className="min-w-0 flex-1 bg-transparent py-2.5 text-xs outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </label>
          <select
            aria-label="Status stok"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
            className="rounded-full border border-muted/50 bg-peach px-3 py-2.5 text-xs"
          >
            <option value="all">Status: Semua Status</option>
            <option value="available">Tersedia</option>
            <option value="low">Hampir Habis</option>
            <option value="empty">Habis</option>
          </select>
        </div>
      </section>
      {notice && (
        <p
          role="status"
          className="mb-4 flex items-center justify-between gap-2 rounded-xl bg-blush p-3 text-sm"
        >
          {notice}
          <button
            aria-label="Tutup pesan"
            type="button"
            onClick={() => setNotice('')}
          >
            <Icon name="close" className="h-4 w-4" />
          </button>
        </p>
      )}
      {deleting && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-primary bg-white p-4 text-sm"
        >
          <p>Hapus produk “{deleting.name}” dari katalog?</p>
          <div className="mt-3 flex gap-4">
            <button
              type="button"
              disabled={acting}
              onClick={async () => {
                const deleted = await action(
                  () => deleteProduct(deleting.id),
                  'Produk dihapus.',
                )
                if (!deleted) return
                if (editor?.product?.id === deleting.id) setEditor(null)
                setDeleting(null)
              }}
              className="font-semibold text-red-700"
            >
              Hapus Produk
            </button>
            <button type="button" onClick={() => setDeleting(null)}>
              Batal
            </button>
          </div>
        </div>
      )}
      <section className="rounded-2xl shadow-soft">
        {loading || error ? (
          <ProductRequestStatus loading={loading} onRetry={reload} />
        ) : (
          <>
            <ProductTable
              busy={acting}
              products={visible}
              selected={selected}
              onSelect={(id) =>
                setSelected((s) =>
                  s.includes(id) ? s.filter((v) => v !== id) : [...s, id],
                )
              }
              onSelectAll={() =>
                setSelected((s) =>
                  visible.every((p) => s.includes(p.id))
                    ? s.filter((id) => !visible.some((p) => p.id === id))
                    : [...new Set([...s, ...visible.map((p) => p.id)])],
                )
              }
              onEdit={(product) => setEditor({ product })}
              onDuplicate={(id) =>
                action(
                  () => duplicateProduct(id),
                  'Salinan produk dibuat sebagai draft.',
                )
              }
              onDelete={setDeleting}
            />
            <footer className="flex flex-wrap items-center justify-between gap-4 rounded-b-2xl bg-peach/50 px-5 py-5 text-xs text-muted">
              <span>
                Menampilkan {filtered.length ? start + 1 : 0} -{' '}
                {Math.min(start + perPage, filtered.length)} dari{' '}
                {filtered.length} Varian Cookie Aktif
              </span>
              <label className="flex items-center gap-2">
                Per Halaman:
                <select
                  value={perPage}
                  onChange={(e) => {
                    setPerPage(Number(e.target.value))
                    setPage(1)
                  }}
                  className="rounded-full border border-muted/50 bg-white px-2 py-1 text-chocolate"
                >
                  {[8, 12, 20].map((n) => (
                    <option key={n} value={n}>
                      {n} Varian
                    </option>
                  ))}
                </select>
              </label>
              <nav
                aria-label="Pagination produk"
                className="flex flex-wrap gap-1"
              >
                <button
                  type="button"
                  aria-label="Halaman sebelumnya"
                  disabled={currentPage === 1}
                  onClick={() => setPage(currentPage - 1)}
                  className="rounded-full bg-white px-3 py-2 disabled:opacity-30"
                >
                  ‹
                </button>
                {Array.from({ length: pages }, (_, i) => i + 1)
                  .filter(
                    (n) =>
                      n === 1 || n === pages || Math.abs(n - currentPage) <= 1,
                  )
                  .map((n) => (
                    <button
                      type="button"
                      key={n}
                      aria-label={`Halaman ${n}`}
                      aria-current={currentPage === n ? 'page' : undefined}
                      onClick={() => setPage(n)}
                      className={`h-8 w-8 rounded-full ${currentPage === n ? 'bg-baked text-white' : 'bg-white'}`}
                    >
                      {n}
                    </button>
                  ))}
                <button
                  type="button"
                  aria-label="Halaman berikutnya"
                  disabled={currentPage === pages}
                  onClick={() => setPage(currentPage + 1)}
                  className="rounded-full bg-white px-3 py-2 disabled:opacity-30"
                >
                  ›
                </button>
              </nav>
            </footer>
          </>
        )}
      </section>
      {editor && (
        <ProductEditor
          key={editor.product?.id || 'new'}
          product={editor.product}
          onClose={closeEditor}
          onSavingChange={setActing}
        />
      )}
    </div>
  )
}
