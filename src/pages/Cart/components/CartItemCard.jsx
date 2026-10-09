import { Link } from 'react-router-dom'
import Icon from '@/components/Icon'

export default function CartItemCard({ item, onChange }) {
  const { product, quantity, selected, variant, id } = item
  const name = `${product.name}${variant ? ` — ${variant}` : ''}`
  return (
    <article
      aria-label={name}
      className="grid grid-cols-[auto_80px_minmax(0,1fr)] items-center gap-3 rounded-[30px] bg-white p-4 shadow-soft sm:grid-cols-[auto_112px_minmax(0,1fr)] sm:gap-4 sm:p-6 xl:grid-cols-[auto_112px_minmax(0,1fr)_160px]"
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={(event) =>
          onChange({ type: 'select', id, selected: event.target.checked })
        }
        aria-label={`Pilih ${name}`}
        className="h-5 w-5 cursor-pointer accent-baked"
      />
      <Link
        to={`/produk/${product.slug}`}
        className="relative overflow-hidden rounded-xl"
      >
        <img
          src={product.image}
          alt={product.name}
          width="112"
          height="112"
          className="aspect-square w-full object-cover"
        />
        <span className="absolute bottom-1 right-1 max-w-[95%] rounded-full bg-baked px-2 py-1 text-[8px] font-bold text-white sm:text-[9px]">
          {product.badge}
        </span>
      </Link>
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap gap-2">
          <span className="rounded-full bg-blush px-2.5 py-1 text-[10px] font-bold text-baked">
            {product.category === 'stuffed'
              ? 'Stuffed Lava Series'
              : product.category === 'signature'
                ? 'Signature NYC Recipe'
                : product.priceLabel || product.badge}
          </span>
          {variant && (
            <span className="rounded-full bg-peach px-2.5 py-1 text-[10px] font-semibold">
              {variant}
            </span>
          )}
        </div>
        <h2 className="text-sm font-bold leading-6 sm:text-lg">
          <Link
            to={`/produk/${product.slug}`}
            className="rounded hover:text-baked"
          >
            {product.name}
          </Link>
        </h2>
        <p className="mt-1 text-xs leading-5 text-muted">
          Harga Satuan:{' '}
          <strong className="font-semibold text-chocolate">
            Rp {product.price.toLocaleString('id-ID')}
          </strong>
        </p>
      </div>
      <div className="col-span-3 flex flex-wrap items-center justify-end gap-x-4 gap-y-2 border-t border-primary/10 pt-3 xl:col-span-1 xl:flex-col xl:items-end xl:border-0 xl:pt-0">
        <p
          aria-label={`Subtotal ${name}`}
          className="mr-auto text-lg font-bold text-baked xl:mr-0"
        >
          Rp {(quantity * product.price).toLocaleString('id-ID')}
        </p>
        <div className="flex items-center gap-2">
          <div
            role="group"
            aria-label={`Jumlah ${name}`}
            className="flex items-center rounded-full bg-peach p-1"
          >
            <button
              type="button"
              aria-label={`Kurangi ${name}`}
              disabled={quantity === 1}
              onClick={() =>
                onChange({ type: 'quantity', id, quantity: quantity - 1 })
              }
              className="rounded-full bg-white p-2.5 hover:bg-blush disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon name="minus" className="h-4 w-4" />
            </button>
            <output
              className="min-w-9 text-center text-sm font-bold"
              aria-label={`Jumlah ${name}`}
            >
              {quantity}
            </output>
            <button
              type="button"
              aria-label={`Tambah ${name}`}
              onClick={() =>
                onChange({ type: 'quantity', id, quantity: quantity + 1 })
              }
              className="rounded-full bg-white p-2.5 hover:bg-blush"
            >
              <Icon name="plus" className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            aria-label={`Hapus ${name}`}
            onClick={() => onChange({ type: 'remove', id })}
            className="rounded-full bg-peach p-3 text-muted hover:bg-blush hover:text-baked"
          >
            <Icon name="trash" className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  )
}
