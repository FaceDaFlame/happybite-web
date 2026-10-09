import { useEffect, useRef, useState } from 'react'
import Icon from '@/components/Icon'
import { stockStatus } from '@/data/productStore'

export default function ProductTable({
  products,
  busy,
  selected,
  onSelect,
  onSelectAll,
  onEdit,
  onDuplicate,
  onDelete,
}) {
  const [menu, setMenu] = useState(null)
  const checkbox = useRef(null)
  const count = products.filter((p) => selected.includes(p.id)).length
  useEffect(() => {
    if (checkbox.current)
      checkbox.current.indeterminate = count > 0 && count < products.length
  }, [count, products.length])
  useEffect(() => {
    function close(event) {
      if (!event.target.closest('[data-product-menu]')) setMenu(null)
    }
    function escape(event) {
      if (event.key === 'Escape') setMenu(null)
    }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', escape)
    }
  }, [])
  return (
    <div className="overflow-x-auto rounded-t-2xl bg-white">
      <table className="w-full min-w-[680px] text-left text-xs">
        <thead className="bg-peach text-[10px] uppercase tracking-wide text-chocolate/80">
          <tr>
            <th className="w-12 px-5 py-5">
              <input
                ref={checkbox}
                type="checkbox"
                aria-label="Pilih semua produk halaman ini"
                checked={products.length > 0 && count === products.length}
                onChange={onSelectAll}
                className="h-4 w-4 accent-baked"
              />
            </th>
            {[
              'FOTO & NAMA PRODUK',
              'HARGA SATUAN',
              'STOK SIAP JUAL',
              'AKSI',
            ].map((heading) => (
              <th key={heading} className="px-3 py-5 font-semibold">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const status = stockStatus(product)
            const color =
              status === 'empty' || product.stokDisplayEtalase <= 2
                ? 'text-red-600 [&::-webkit-progress-value]:bg-red-600 [&::-moz-progress-bar]:bg-red-600'
                : status === 'low'
                  ? 'text-amber-600 [&::-webkit-progress-value]:bg-amber-500 [&::-moz-progress-bar]:bg-amber-500'
                  : 'text-emerald-700 [&::-webkit-progress-value]:bg-emerald-600 [&::-moz-progress-bar]:bg-emerald-600'
            return (
              <tr
                key={product.id}
                className="border-b border-peach last:border-0 hover:bg-canvas/70"
              >
                <td className="px-5 py-5">
                  <input
                    type="checkbox"
                    aria-label={`Pilih ${product.name}`}
                    checked={selected.includes(product.id)}
                    onChange={() => onSelect(product.id)}
                    className="h-4 w-4 accent-baked"
                  />
                </td>
                <td className="px-3 py-5">
                  <div className="flex items-center gap-3">
                    <img
                      src={product.image}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-full bg-peach object-cover"
                    />
                    <div className="min-w-0">
                      <p
                        className="max-w-60 truncate text-sm font-semibold"
                        title={product.name}
                      >
                        {product.name}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px]">
                        <span className="rounded-full bg-blush px-2 py-1">
                          {product.categoryName || product.category}
                        </span>
                        <span className="text-muted">{product.sku}</span>
                        {!product.isLiveOnWebsite && (
                          <span className="text-muted">Draft</span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-5 text-sm font-semibold text-baked">
                  Rp {product.price.toLocaleString('id-ID')}
                </td>
                <td className="min-w-36 px-3 py-5">
                  <div className="flex items-center justify-between gap-2">
                    <strong>{product.stokDisplayEtalase} Pcs</strong>
                    <span className={`text-[10px] ${color}`}>
                      {status === 'empty'
                        ? 'Habis etalase'
                        : status === 'low'
                          ? 'Sisa sedikit'
                          : 'Tersedia'}
                    </span>
                  </div>
                  <progress
                    aria-label={`Stok ${product.name}`}
                    max={Math.max(30, product.stokDisplayEtalase)}
                    value={product.stokDisplayEtalase}
                    className={`mt-1.5 block h-1.5 w-full overflow-hidden rounded-full bg-peach [&::-webkit-progress-bar]:bg-peach [&::-webkit-progress-value]:rounded-full ${color}`}
                  />
                </td>
                <td className="px-3 py-5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onEdit(product)}
                      aria-label={`Edit ${product.name}`}
                      className="flex items-center gap-1 rounded-full border border-golden bg-golden/15 px-3 py-1.5 text-baked"
                    >
                      <Icon name="note" className="h-3 w-3" />
                      Edit
                    </button>
                    <div data-product-menu className="relative">
                      <button
                        type="button"
                        disabled={busy}
                        aria-label={`Aksi ${product.name}`}
                        aria-expanded={menu === product.id}
                        onClick={() =>
                          setMenu(menu === product.id ? null : product.id)
                        }
                        className="rounded-full px-2 py-1 text-lg hover:bg-peach"
                      >
                        ⋮
                      </button>
                      {menu === product.id && (
                        <div className="absolute bottom-0 right-8 z-10 w-32 rounded-xl border border-primary/20 bg-white p-1 shadow-warm">
                          <button
                            type="button"
                            onClick={() => {
                              onDuplicate(product.id)
                              setMenu(null)
                            }}
                            className="block w-full rounded-lg px-3 py-2 text-left hover:bg-peach"
                          >
                            Duplikat
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onDelete(product)
                              setMenu(null)
                            }}
                            className="block w-full rounded-lg px-3 py-2 text-left text-red-700 hover:bg-peach"
                          >
                            Hapus
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {!products.length && (
        <p className="p-12 text-center text-sm text-muted">
          Tidak ada produk yang cocok dengan filter ini.
        </p>
      )}
    </div>
  )
}
